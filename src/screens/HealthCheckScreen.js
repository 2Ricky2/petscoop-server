import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { API_BASE } from '../config/api';

export default function HealthCheckScreen() {
  const [status, setStatus] = useState('Tap button to check');

  const checkHealth = async () => {
    try {
      const res = await axios.get(`${API_BASE}/db-check`);
      if (res.data.success) {
        setStatus('✅ Database Connected');
      } else {
        setStatus('❌ DB Connection Failed');
      }
    } catch (e) {
      console.log(e);
      setStatus('❌ Server Unreachable');
      Alert.alert('Error', 'Cannot reach server.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Server Health Check</Text>
      <Text style={styles.status}>{status}</Text>
      <TouchableOpacity style={styles.button} onPress={checkHealth}>
        <Text style={styles.buttonText}>Check Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, color: '#FF7A00', fontWeight: 'bold', marginBottom: 20 },
  status: { fontSize: 18, color: '#333', marginBottom: 20 },
  button: { backgroundColor: '#FF7A00', padding: 12, borderRadius: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});