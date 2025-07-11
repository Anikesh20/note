import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { ActivityIndicator, Appbar, Avatar, Banner, Button, Card, Chip, Divider, Searchbar, Text, TextInput, useTheme } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'http://10.0.2.2:4000'; // Use this for Android emulator to access local backend

// Define Note type
interface Note {
  id: number;
  title: string;
  description?: string;
  program: string;
  semester: number;
  subject: string;
  price: number;
  seller: string;
  created_at: string;
  pdf_path?: string;
}

export default function DashboardScreen() {
  const { user, token, signOut } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  console.log('User in Dashboard:', user);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [program, setProgram] = React.useState('BBA');
  const [semester, setSemester] = React.useState(1);
  const [showBanner, setShowBanner] = React.useState(true);
  const [upload, setUpload] = React.useState({ title: '', description: '', program: 'BBA', semester: 1, subject: '', price: '' });
  const [uploading, setUploading] = React.useState(false);
  const [pdf, setPdf] = React.useState<any>(null);
  const [paymentVisible, setPaymentVisible] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [cardDetails, setCardDetails] = React.useState<any>(null);
  const [paying, setPaying] = React.useState(false);
  const { confirmPayment, loading: stripeLoading } = useConfirmPayment();
  const [myBought, setMyBought] = React.useState<Note[]>([]);

  // Fetch notes from backend
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notes`);
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch notes from server.');
    }
    setLoading(false);
  };

  // Fetch bought notes
  const fetchBoughtNotes = async () => {
    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/purchases/${user.username}`);
      const data = await res.json();
      setMyBought(data);
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchNotes();
    fetchBoughtNotes();
  }, [user]);

  // Pick PDF file
  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPdf(result.assets[0]);
    }
  };

  // Upload note to backend with PDF
  const handleUpload = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'You must be logged in to upload a note.');
      setUploading(false);
      return;
    }
    if (!upload.title || !upload.subject || !upload.price || !pdf) {
      Alert.alert('Validation', 'Title, Subject, Price, and PDF are required.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', upload.title);
      formData.append('description', upload.description);
      formData.append('program', upload.program);
      formData.append('semester', String(upload.semester));
      formData.append('subject', upload.subject);
      formData.append('price', String(upload.price));
      formData.append('seller', user.username);
      formData.append('pdf', {
        uri: pdf.uri,
        name: pdf.name || 'note.pdf',
        type: pdf.mimeType || 'application/pdf',
      } as any);
      const res = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (res.ok) {
        setUpload({ title: '', description: '', program: 'BBA', semester: 1, subject: '', price: '' });
        setPdf(null);
        fetchNotes();
        Alert.alert('Success', 'Note uploaded!');
      } else {
        Alert.alert('Error', 'Failed to upload note.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to upload note.');
    }
    setUploading(false);
  };

  // Filter notes for UI sections
  const mySelling: Note[] = notes.filter(n => n.seller === (user ? user.username : ''));
  const trending: Note[] = notes.slice(0, 3); // Example: top 3 as trending
  const filtered: Note[] = notes.filter(n => n.program === program && n.semester === semester && n.title.toLowerCase().includes(search.toLowerCase()));

  // Quick Actions
  const quickActions = [
    { icon: (props: any) => <MaterialCommunityIcons name="upload" size={32} color={props.color || theme.colors.primary} />, label: 'Upload Note', onPress: () => {} },
    { icon: (props: any) => <MaterialCommunityIcons name="help-circle" size={32} color={props.color || theme.colors.primary} />, label: 'Support', onPress: () => {} },
    { icon: (props: any) => <MaterialCommunityIcons name="book-open-variant" size={32} color={props.color || theme.colors.primary} />, label: 'FAQs', onPress: () => {} },
  ];

  // Stripe payment handler
  const handleBuy = async (note: Note) => {
    Alert.alert('Buy Clicked', `Buying note: ${note.title}`);
    setSelectedNote(note);
    setPaymentVisible(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedNote) return;
    if (!confirmPayment) {
      Alert.alert('Payment Error', 'Stripe is not initialized. Please try again later.');
      return;
    }
    setPaying(true);
    try {
      // 1. Get client secret from backend
      const res = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedNote.price * 100, currency: 'usd' }),
      });
      const { clientSecret, error } = await res.json();
      if (!clientSecret) {
        Alert.alert('Payment Error', error || 'Could not get payment intent.');
        setPaying(false);
        return;
      }
      // 2. Confirm payment
      const { paymentIntent, error: stripeError } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {},
      });
      if (stripeError) {
        Alert.alert('Payment failed', stripeError.message);
      } else if (paymentIntent) {
        // Record purchase in backend
        await fetch(`${API_URL}/purchases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyer: user ? user.username : '', note_id: selectedNote.id }),
        });
        fetchBoughtNotes();
        Alert.alert('Payment successful', 'You have bought the note!');
        setPaymentVisible(false);
        setSelectedNote(null);
        setCardDetails(null);
        // Optionally, mark the note as bought in your DB
      }
    } catch (err) {
      Alert.alert('Payment Error', 'Could not process payment.');
    }
    setPaying(false);
  };

  // DEBUG LOG
  console.log('DEBUG mySelling:', mySelling, 'loading:', loading);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient colors={theme.dark ? ['#232526', '#414345'] : ['#3b82f6', '#60a5fa']} style={styles.headerGradient}>
        <Appbar.Header style={[styles.header, { backgroundColor: 'transparent', elevation: 0 }]}> 
          <Appbar.Content title="NoteBazaar" titleStyle={[styles.headerTitle, { color: theme.colors.onPrimary }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.onPrimary, marginRight: 12, fontWeight: 'bold', fontSize: 18 }}>Rs. {user && user.balance ? user.balance : 0}</Text>
            <Avatar.Image size={40} source={user && user.avatar ? { uri: user.avatar } : require('../assets/images/note.png')} />
            <Appbar.Action icon="logout" color={theme.colors.onPrimary} onPress={() => { if (typeof signOut === 'function') { signOut(); router.replace('/(auth)/LoginScreen'); } }} />
          </View>
        </Appbar.Header>
      </LinearGradient>

      {/* Payment Modal */}
      <Modal
        visible={paymentVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, width: '90%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Enter Card Details</Text>
            <CardField
              postalCodeEnabled={false}
              placeholders={{ number: '4242 4242 4242 4242' }}
              cardStyle={{ backgroundColor: '#F6F6F6', textColor: '#000000' }}
              style={{ width: '100%', height: 50, marginVertical: 16 }}
              onCardChange={cardDetails => setCardDetails(cardDetails)}
            />
            <Button
              mode="contained"
              loading={paying}
              disabled={paying || !cardDetails?.complete}
              onPress={handleConfirmPayment}
              style={{ marginTop: 8, borderRadius: 20 }}
            >
              Pay Now
            </Button>
            <Button
              mode="text"
              onPress={() => setPaymentVisible(false)}
              style={{ marginTop: 8 }}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* Announcements/News */}
      {showBanner && (
        <Banner
          visible={showBanner}
          actions={[{ label: 'Dismiss', onPress: () => setShowBanner(false) }]}
          icon="bullhorn"
        >
          New semester notes are now available!
        </Banner>
      )}

      {/* Welcome & Quick Stats */}
      <View style={styles.welcomeSection}>
        <Text variant="headlineMedium">Welcome, {user ? user.username : 'User'}!</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}><Card.Content><Text>Uploaded</Text><Text variant="titleLarge">{mySelling.length}</Text></Card.Content></Card>
          <Card style={styles.statCard}><Card.Content><Text>Sold</Text><Text variant="titleLarge">{user ? user.sold : 0}</Text></Card.Content></Card>
          <Card style={styles.statCard}><Card.Content><Text>Balance</Text><Text variant="titleLarge">Rs. {user ? user.balance : 0}</Text></Card.Content></Card>
        </View>
      </View>

      {/* Upload Note Form */}
      <Card style={[styles.uploadCard, { shadowColor: theme.colors.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }]}> 
        <Card.Title title="Upload a Note" left={props => <FontAwesome5 name="upload" size={24} color={theme.colors.primary} />} />
        <Card.Content>
          <TextInput label="Title" value={upload.title} onChangeText={v=>setUpload({...upload, title: v})} style={styles.input} left={<TextInput.Icon icon="note" />} />
          <TextInput label="Description" value={upload.description} onChangeText={v=>setUpload({...upload, description: v})} style={styles.input} multiline left={<TextInput.Icon icon="text" />} />
          <View style={styles.filterRow}>
            <Chip selected={upload.program==='BBA'} onPress={()=>setUpload({...upload, program: 'BBA'})} icon="school">BBA</Chip>
            <Chip selected={upload.program==='BBA-TT'} onPress={()=>setUpload({...upload, program: 'BBA-TT'})} icon="school">BBA-TT</Chip>
            <Chip selected={upload.program==='BCA'} onPress={()=>setUpload({...upload, program: 'BCA'})} icon="school">BCA</Chip>
            <TextInput
              mode="outlined"
              label="Semester"
              value={upload.semester.toString()}
              onChangeText={v=>setUpload({...upload, semester: Number(v)||1})}
              style={{ width: 90, marginLeft: 8 }}
              keyboardType="numeric"
              left={<TextInput.Icon icon="numeric" />}
            />
          </View>
          <TextInput label="Subject" value={upload.subject} onChangeText={v=>setUpload({...upload, subject: v})} style={styles.input} left={<TextInput.Icon icon="book" />} />
          <TextInput label="Price (Rs.)" value={upload.price} onChangeText={v=>setUpload({...upload, price: v})} style={styles.input} keyboardType="numeric" left={<TextInput.Icon icon="currency-inr" />} />
          <Button icon="file-pdf-box" mode="outlined" onPress={pickPdf} style={{ marginTop: 8 }}>
            {pdf ? pdf.name : 'Select PDF'}
          </Button>
          <Button icon="upload" mode="contained" style={{ marginTop: 12, borderRadius: 20, backgroundColor: theme.colors.primary }} loading={uploading} onPress={handleUpload}>Upload</Button>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        {quickActions.map(action => (
          <Animatable.View key={action.label} animation="fadeInUp" delay={100}>
            <Button
              icon={action.icon}
              mode="contained-tonal"
              style={styles.quickActionBtn}
              labelStyle={{ fontSize: 14, marginTop: 4 }}
              contentStyle={{ flexDirection: 'column', alignItems: 'center', paddingVertical: 12 }}
              onPress={action.onPress}
            >
              {action.label}
            </Button>
          </Animatable.View>
        ))}
      </View>

      <Divider style={{ marginVertical: 16 }} />

      {/* Trending Notes - now clearly separated from My Notes */}
      <Text variant="titleLarge" style={styles.sectionTitle}>Trending Notes</Text>
      {loading ? <ActivityIndicator style={{ margin: 16 }} /> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {trending.map((note, idx) => (
            <Animatable.View key={note.id} animation="fadeInRight" delay={idx * 100}>
              <Card style={[styles.noteCard, { borderColor: theme.colors.secondary, borderWidth: 2, shadowColor: theme.colors.primary, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }]}> 
                <Card.Title
                  title={note.title}
                  subtitle={`${note.subject} • ${note.seller}`}
                  left={props => <Avatar.Text {...props} label={note.program} style={{ backgroundColor: theme.colors.secondaryContainer }} />}
                  right={props => <Chip icon="fire" style={{ backgroundColor: theme.colors.errorContainer, marginRight: 8 }}>Trending</Chip>}
                />
                <Card.Content>
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>Price: Rs. {note.price}</Text>
                  <Text>Semester: {note.semester}</Text>
                  {note.pdf_path && (
                    <Button icon="file-pdf-box" mode="text" onPress={() => {
                      const url = `${API_URL}${note.pdf_path}`;
                      Alert.alert('PDF', 'Open this PDF in your browser?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open', onPress: () => { window.open ? window.open(url) : null; } }
                      ]);
                    }}>View PDF</Button>
                  )}
                </Card.Content>
                <Card.Actions>
                  <Button
                    mode="contained"
                    style={{ borderRadius: 20, backgroundColor: theme.colors.primary }}
                    onPress={() => handleBuy(note)}
                    labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
                    icon={({ size, color }) => <Ionicons name="cart" size={20} color={color} />}
                  >
                    Buy
                  </Button>
                </Card.Actions>
              </Card>
            </Animatable.View>
          ))}
        </ScrollView>
      )}

      <Divider style={{ marginVertical: 16 }} />

      {/* Browse/Explore Notes */}
      <Text variant="titleLarge" style={styles.sectionTitle}>Browse/Explore Notes</Text>
      <View style={styles.filterRow}>
        <Chip selected={program==='BBA'} onPress={()=>setProgram('BBA')}>BBA</Chip>
        <Chip selected={program==='BBA-TT'} onPress={()=>setProgram('BBA-TT')}>BBA-TT</Chip>
        <Chip selected={program==='BCA'} onPress={()=>setProgram('BCA')}>BCA</Chip>
        <TextInput
          mode="outlined"
          label="Semester"
          value={semester.toString()}
          onChangeText={v=>setSemester(Number(v)||1)}
          style={{ width: 90, marginLeft: 8 }}
          keyboardType="numeric"
        />
        <Searchbar
          placeholder="Search notes"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>
      {loading ? <ActivityIndicator style={{ margin: 16 }} /> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {filtered.length === 0 ? (
            <Text style={{ margin: 16 }}>No notes found.</Text>
          ) : (
            filtered.map(note => (
              <Card key={note.id} style={styles.noteCard}>
                <Card.Title title={note.title} subtitle={`${note.subject} • ${note.seller}`} left={props => <Avatar.Text {...props} label={note.program} />} />
                <Card.Content>
                  <Text>Price: Rs. {note.price}</Text>
                  <Text>Semester: {note.semester}</Text>
                  {note.pdf_path && (
                    <Button icon="file-pdf-box" mode="text" onPress={() => {
                      const url = `${API_URL}${note.pdf_path}`;
                      Alert.alert('PDF', 'Open this PDF in your browser?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open', onPress: () => { window.open ? window.open(url) : null; } }
                      ]);
                    }}>View PDF</Button>
                  )}
                </Card.Content>
                <Card.Actions>
                  <Button mode="contained" style={{ borderRadius: 20 }} onPress={() => handleBuy(note)}>Buy</Button>
                </Card.Actions>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { width: '100%', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  header: { backgroundColor: 'transparent', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontWeight: 'bold', fontSize: 28, letterSpacing: -1 },
  welcomeSection: { padding: 20, alignItems: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16 },
  statCard: { flex: 1, marginHorizontal: 6, alignItems: 'center', backgroundColor: '#e0e7ff' },
  sectionTitle: { marginLeft: 16, marginBottom: 8, marginTop: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8 },
  noteCard: { width: 260, marginHorizontal: 8, backgroundColor: '#fff', elevation: 2, borderRadius: 12 },
  uploadCard: { marginHorizontal: 16, backgroundColor: '#f1f5f9', elevation: 1 },
  input: { marginVertical: 6 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 8, marginTop: 8 },
  quickActionBtn: { borderRadius: 20, marginHorizontal: 4 },
});