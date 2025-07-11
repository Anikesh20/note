const express = require('express');
const cors = require('cors');
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Stripe = require('stripe');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });
const JWT_SECRET = process.env.JWT_SECRET || 'NoteBazaar_2025';
// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create notes table if not exists and add pdf_path column if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    program TEXT,
    semester INT,
    subject TEXT,
    price INT,
    seller TEXT,
    user_id INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`).then(() => {
  pool.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS pdf_path TEXT`);
  pool.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id)`);
});

// Create purchases table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    buyer TEXT NOT NULL,
    note_id INT REFERENCES notes(id),
    purchased_at TIMESTAMPTZ DEFAULT NOW()
  )
`).then(() => {
  pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS seller_id INT REFERENCES users(id)`);
  pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS buyer_id INT REFERENCES users(id)`);
});

// Create users table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    password TEXT NOT NULL,
    program TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`).then(() => {
  pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS balance INT DEFAULT 0`);
  pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS sold INT DEFAULT 0`);
});

// Create payments table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    buyer_id INT REFERENCES users(id),
    seller_id INT REFERENCES users(id),
    amount INT NOT NULL,
    note_id INT REFERENCES notes(id),
    payment_intent_id TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

// Get all notes
app.get('/notes', async (req, res) => {
  const result = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
  res.json(result.rows);
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Add a new note with PDF upload
app.post('/notes', authenticateToken, upload.single('pdf'), async (req, res) => {
  const { title, description, program, semester, subject, price, seller } = req.body;
  const user_id = req.user.id;
  const pdfPath = req.file ? `/uploads/${req.file.filename}` : null;
  const result = await pool.query(
    'INSERT INTO notes (title, description, program, semester, subject, price, seller, user_id, pdf_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [title, description, program, semester, subject, price, seller, user_id, pdfPath]
  );
  res.json(result.rows[0]);
});

// (Optional) Get notes by seller
app.get('/notes/seller/:seller', async (req, res) => {
  const { seller } = req.params;
  const result = await pool.query('SELECT * FROM notes WHERE seller = $1 ORDER BY created_at DESC', [seller]);
  res.json(result.rows);
});

const stripe = Stripe('sk_test_51RiI3tE9QfjmYq5Y7YTLRYELQmoI1Ovm4k805yfFlPfskd8inlHyDhV4d9BWDKApIQN5poQcRe7Qp9W7hjVfuwl900cgxieHM3');

app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency = 'usd' } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency,
      payment_method_types: ['card'],
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record a purchase
app.post('/purchases', async (req, res) => {
  const { buyer, note_id } = req.body;
  // Get note info (seller, price, seller_id)
  const noteRes = await pool.query('SELECT seller, price, user_id FROM notes WHERE id = $1', [note_id]);
  let seller_id = null;
  let price = 0;
  let seller = null;
  if (noteRes.rows.length > 0) {
    seller = noteRes.rows[0].seller;
    price = noteRes.rows[0].price;
    seller_id = noteRes.rows[0].user_id;
  }
  // Get buyer_id from users table
  const buyerRes = await pool.query('SELECT id FROM users WHERE username = $1', [buyer]);
  let buyer_id = null;
  if (buyerRes.rows.length > 0) {
    buyer_id = buyerRes.rows[0].id;
  }
  // Insert purchase record with seller_id and buyer_id
  const result = await pool.query(
    'INSERT INTO purchases (buyer, note_id, seller_id, buyer_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [buyer, note_id, seller_id, buyer_id]
  );
  // Update seller's balance and sold count
  if (seller && price) {
    await pool.query('UPDATE users SET balance = balance + $1, sold = sold + 1 WHERE username = $2', [price, seller]);
  }
  // Insert payment record
  await pool.query(
    'INSERT INTO payments (buyer_id, seller_id, amount, note_id, payment_intent_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
    [buyer_id, seller_id, price, note_id, null, 'succeeded']
  );
  res.json(result.rows[0]);
});

// Get all notes bought by a user
app.get('/purchases/:buyer', async (req, res) => {
  const { buyer } = req.params;
  const result = await pool.query(
    `SELECT notes.* FROM purchases
     JOIN notes ON purchases.note_id = notes.id
     WHERE purchases.buyer = $1
     ORDER BY purchases.purchased_at DESC`,
    [buyer]
  );
  res.json(result.rows);
});

// User registration
app.post('/register', async (req, res) => {
  const { full_name, email, username, phone_number, password, program } = req.body;
  if (!full_name || !email || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (full_name, email, username, phone_number, password, program) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, email, username, phone_number, program, created_at',
      [full_name, email, username, phone_number, hashedPassword, program]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email or username already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// User login
app.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  console.log('Login attempt:', { identifier, password });
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing identifier or password' });
  }
  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [identifier]
    );
    console.log('User found in DB:', userResult.rows[0]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Exclude password from response
    const { password: _, ...userData } = user;
    const token = jwt.sign({ id: userData.id, username: userData.username }, JWT_SECRET, { expiresIn: '7d' });
    console.log('User ID received on login:', userData.id);
    res.json({ user: userData, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 