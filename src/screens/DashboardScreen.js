import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function DashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🐾 Welcome to Petscoop Dashboard</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF7A00' },
  text: { fontSize: 22, color: '#fff', marginBottom: 20 },
  button: { backgroundColor: '#fff', padding: 12, borderRadius: 20 },
  buttonText: { color: '#FF7A00', fontWeight: 'bold' },
});