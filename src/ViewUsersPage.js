import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';

const ORANGE = '#FF7A00';

export default function ViewUsersPage({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://10.0.2.2:3000/users');
      if (res.data.success) {
        setUsers(res.data.users);
      } else {
        Alert.alert('Error', res.data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await axios.delete(`http://10.0.2.2:3000/users/${id}`);
            if (res.data.success) {
              Alert.alert('Success', 'User deleted');
              fetchUsers();
            } else {
              Alert.alert('Error', res.data.message);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete user');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>All Users</Text>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.user_id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.user_name}</Text>
              <Text style={styles.email}>{item.user_email}</Text>
              <Text style={styles.role}>Role: {item.user_role}</Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteUser(item.user_id)}
              >
                <Text style={styles.deleteText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ORANGE,
  },
  header: {
    backgroundColor: '#FFD9C0',
    paddingVertical: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15, // 🟢 push the header down a bit for easier tap
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: ORANGE,
  },
  backButton: {
    backgroundColor: ORANGE,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 25,
  },
  backText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFD9C0',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 15,
    color: '#555',
  },
  role: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#b13939ff',
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
