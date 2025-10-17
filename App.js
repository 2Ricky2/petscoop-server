// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginPage from './src/LoginPage';
import MainPage from './src/MainPage';
import AdoptPage from './src/AdoptPage';
import AdminPage from './src/AdminPage';
import ViewUsersPage from './src/ViewUsersPage';
import AddPetPage from './src/AddPetPage';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('LoginPage');

  useEffect(() => {
    const checkUser = async () => {
      const role = await AsyncStorage.getItem('userRole');
      if (role === 'admin') {
        setInitialRoute('AdminPage');
      } else if (role === 'user') {
        setInitialRoute('MainPage');
      } else {
        setInitialRoute('LoginPage');
      }
    };
    checkUser();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="LoginPage" component={LoginPage} />
        <Stack.Screen name="MainPage" component={MainPage} />
        <Stack.Screen name="AdoptPage" component={AdoptPage} />
        <Stack.Screen name="AdminPage" component={AdminPage} />
        <Stack.Screen name="ViewUsersPage" component={ViewUsersPage} />
        <Stack.Screen name="AddPetPage" component={AddPetPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
