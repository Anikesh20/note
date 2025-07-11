import * as DocumentPicker from 'expo-document-picker';
import * as React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, TextInput } from 'react-native-paper';
import { API_URL, useAuth } from '../hooks/useAuth';

export default function UploadScreen() {
  const { user, token } = useAuth();
  const [upload, setUpload] = React.useState({ title: '', description: '', program: 'BBA', semester: 1, subject: '', price: '' });
  const [uploading, setUploading] = React.useState(false);
  const [pdf, setPdf] = React.useState<any>(null);

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPdf(result.assets[0]);
    }
  };

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
        Alert.alert('Success', 'Note uploaded!');
      } else {
        Alert.alert('Error', 'Failed to upload note.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to upload note.');
    }
    setUploading(false);
  };

  return (
    <Card style={styles.uploadCard}>
      <Card.Title title="Upload a Note" />
      <Card.Content>
        <TextInput label="Title" value={upload.title} onChangeText={v=>setUpload({...upload, title: v})} style={styles.input} />
        <TextInput label="Description" value={upload.description} onChangeText={v=>setUpload({...upload, description: v})} style={styles.input} multiline />
        <View style={styles.filterRow}>
          <Chip selected={upload.program==='BBA'} onPress={()=>setUpload({...upload, program: 'BBA'})}>BBA</Chip>
          <Chip selected={upload.program==='BBA-TT'} onPress={()=>setUpload({...upload, program: 'BBA-TT'})}>BBA-TT</Chip>
          <Chip selected={upload.program==='BCA'} onPress={()=>setUpload({...upload, program: 'BCA'})}>BCA</Chip>
          <TextInput
            mode="outlined"
            label="Semester"
            value={upload.semester.toString()}
            onChangeText={v=>setUpload({...upload, semester: Number(v)||1})}
            style={{ width: 90, marginLeft: 8 }}
            keyboardType="numeric"
          />
        </View>
        <TextInput label="Subject" value={upload.subject} onChangeText={v=>setUpload({...upload, subject: v})} style={styles.input} />
        <TextInput label="Price (Rs.)" value={upload.price} onChangeText={v=>setUpload({...upload, price: v})} style={styles.input} keyboardType="numeric" />
        <Button icon="file-pdf-box" mode="outlined" onPress={pickPdf} style={{ marginTop: 8 }}>
          {pdf ? pdf.name : 'Select PDF'}
        </Button>
        <Button icon="upload" mode="contained" style={{ marginTop: 12, borderRadius: 20 }} loading={uploading} onPress={handleUpload}>Upload</Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  uploadCard: { margin: 16, backgroundColor: '#f1f5f9', elevation: 1 },
  input: { marginVertical: 6 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
}); 