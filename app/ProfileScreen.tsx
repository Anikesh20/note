import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Text } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={{ alignItems: 'center' }}>
          <Avatar.Image size={80} source={user && user.avatar ? { uri: user.avatar } : require('../assets/images/note.png')} />
          <Text variant="headlineMedium" style={{ marginTop: 12 }}>{user ? user.username : 'User'}</Text>
          <Text style={{ marginTop: 4 }}>Balance: Rs. {user && user.balance ? user.balance : 0}</Text>
          <Text style={{ marginTop: 4 }}>Sold: {user && user.sold ? user.sold : 0}</Text>
        </Card.Content>
      </Card>
      <Button
        mode="contained"
        style={{ marginTop: 32, borderRadius: 20, width: 200 }}
        onPress={() => {
          signOut();
        }}
      >
        Log Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fa', justifyContent: 'center', alignItems: 'center' },
  profileCard: { width: 320, backgroundColor: '#e0e7ff', elevation: 2, borderRadius: 16, marginTop: 40 },
}); 