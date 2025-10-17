import axios from 'axios';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function LoginPage({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleAuth = async () => {
    if (!userEmail || !userPass || (!isLogin && !userName)) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    try {
      if (isLogin) {
        // ✅ LOGIN
        const res = await axios.post('mysql://root:LTvkwuFGFomLRhwOoKtTuABgeeIVecLA@mysql.railway.internal:3306/railway/login', {
          user_email: userEmail,
          user_pass: userPass,
        });

        if (res.data.success) {
          Alert.alert('Welcome', `Hello ${res.data.user.username}`);

          // ✅ Save role in AsyncStorage for session handling
          await AsyncStorage.setItem('userRole', res.data.user.role);

          // ✅ Role-based navigation
          if (res.data.user.role === 'admin') {
            navigation.replace('AdminPage');
          } else {
            navigation.replace('MainPage');
          }
        } else {
          Alert.alert('Login Failed', res.data.message);
        }
      } else {
        // ✅ SIGNUP
        if (userPass !== confirm) {
          Alert.alert('Error', 'Passwords do not match.');
          return;
        }

        const res = await axios.post('mysql://root:LTvkwuFGFomLRhwOoKtTuABgeeIVecLA@mysql.railway.internal:3306/railway/signup', {
          user_name: userName,
          user_email: userEmail,
          user_pass: userPass,
        });

        if (res.data.success) {
          Alert.alert('Success', 'Account created! Please log in.');
          setIsLogin(true);
        } else {
          Alert.alert('Sign Up Failed', res.data.message);
        }
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Could not connect to server.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Image source={require('../assets/images/Vector.png')} />
      <Text style={styles.title}>PET</Text>
      <Text style={styles.title}>SCOOP</Text>

      <View style={styles.bubble}>
        <Text style={styles.subtitle}>{isLogin ? 'Login' : 'Sign Up'}</Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#999"
            value={userName}
            onChangeText={setUserName}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={userEmail}
          onChangeText={setUserEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          placeholderTextColor="#999"
          value={userPass}
          onChangeText={setUserPass}
        />

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            placeholderTextColor="#999"
            value={confirm}
            onChangeText={setConfirm}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>
            {isLogin ? 'Login' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.toggleText}>
            {isLogin
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ORANGE = '#FF7A00';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Itim-Regular',
    fontSize: 36,
    fontWeight: 'bold',
    color: ORANGE,
  },
  bubble: {
    marginTop: 120,
    backgroundColor: '#fff',
    width: '100%',
    padding: 25,
    borderRadius: 30,
    elevation: 5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: ORANGE,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 20,
    padding: 12,
    marginVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: ORANGE,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 15,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  toggleText: { color: ORANGE, textAlign: 'center', marginTop: 10 },
});

export default LoginPage;
