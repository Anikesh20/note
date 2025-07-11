import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Avatar, Card, Text } from 'react-native-paper';
import { API_URL, useAuth } from '../hooks/useAuth';

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

export default function MyNotesScreen() {
  const { user } = useAuth();
  const [mySelling, setMySelling] = React.useState<Note[]>([]);
  const [myBought, setMyBought] = React.useState<Note[]>([]);

  React.useEffect(() => {
    // Fetch notes uploaded by user
    const fetchMySelling = async () => {
      if (!user) return;
      const res = await fetch(`${API_URL}/notes?seller=${user.username}`);
      const data = await res.json();
      setMySelling(data);
    };
    // Fetch notes bought by user
    const fetchMyBought = async () => {
      if (!user) return;
      const res = await fetch(`${API_URL}/purchases/${user.username}`);
      const data = await res.json();
      setMyBought(data);
    };
    fetchMySelling();
    fetchMyBought();
  }, [user]);

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleLarge" style={styles.sectionTitle}>My Uploaded Notes</Text>
      {mySelling.length === 0 ? <Text style={styles.empty}>No uploaded notes.</Text> : mySelling.map(note => (
        <Card key={note.id} style={styles.noteCard}>
          <Card.Title title={note.title} subtitle={`${note.subject} • ${note.program}`} left={props => <Avatar.Text {...props} label={note.program} />} />
        </Card>
      ))}
      <Text variant="titleLarge" style={styles.sectionTitle}>My Bought Notes</Text>
      {myBought.length === 0 ? <Text style={styles.empty}>No bought notes.</Text> : myBought.map(note => (
        <Card key={note.id} style={styles.noteCard}>
          <Card.Title title={note.title} subtitle={`${note.subject} • ${note.program}`} left={props => <Avatar.Text {...props} label={note.program} />} />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fa' },
  sectionTitle: { marginLeft: 16, marginBottom: 8, marginTop: 8 },
  noteCard: { marginHorizontal: 8, marginVertical: 4, backgroundColor: '#fff', elevation: 2, borderRadius: 12 },
  empty: { margin: 16, color: '#888' },
}); 