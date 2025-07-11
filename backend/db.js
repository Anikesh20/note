const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_zPFQyed6OR9g@ep-crimson-water-a8b1tx0f-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
});

module.exports = pool; 