import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Card, Chip, Searchbar, Text, TextInput } from 'react-native-paper';
import { API_URL } from '../hooks/useAuth';

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

export default function ExploreScreen() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [program, setProgram] = React.useState('BBA');
  const [semester, setSemester] = React.useState(1);

  React.useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      const res = await fetch(`${API_URL}/notes`);
      const data = await res.json();
      setNotes(data);
      setLoading(false);
    };
    fetchNotes();
  }, []);

  const filtered = notes.filter(n => n.program === program && n.semester === semester && n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView style={styles.container}>
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
                      // Open PDF logic here
                    }}>View PDF</Button>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fa' },
  sectionTitle: { marginLeft: 16, marginBottom: 8, marginTop: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8 },
  noteCard: { width: 260, marginHorizontal: 8, backgroundColor: '#fff', elevation: 2, borderRadius: 12 },
}); 