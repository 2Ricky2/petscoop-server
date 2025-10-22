import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = async () => {
    if (!email || !pass) return Alert.alert('Error', 'Fill all fields.');
    try {
      const res = await axios.post(`${API_BASE}/login`, {
        user_email: email,
        user_pass: pass,
      });
      if (res.data.success) {
        await AsyncStorage.setItem('userRole', res.data.user.role);
        Alert.alert('Welcome', res.data.user.username);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', res.data.message);
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Cannot connect to server');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Petscoop Server</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={setPass}
        value={pass}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>LOGIN</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Health')}>
        <Text style={styles.link}>Check Server Health</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FF7A00', marginBottom: 30 },
  input: { width: '80%', borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#FF7A00', padding: 12, borderRadius: 10, width: '80%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  link: { color: '#1E90FF', marginTop: 10 },
});