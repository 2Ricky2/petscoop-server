import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const ORANGE = '#FF7A00';

export default function AdminPage({ navigation }) {
  const goBack = () => {
    navigation.replace('LoginPage');
  };

  const openUsers = () => {
    navigation.navigate('ViewUsersPage');
  };

  const openPets = () => {
    navigation.navigate('AdoptPage'); // 🟢 reuse AdoptPage for viewing/managing pets
  };

  const openReports = () => {
    navigation.navigate('ViewReportsPage'); // placeholder (optional future feature)
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Admin Panel</Text>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuButton} onPress={openUsers}>
          <Text style={styles.menuText}> View Users</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={openPets}>
          <Text style={styles.menuText}> Manage Pets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={openReports}>
          <Text style={styles.menuText}> View Reports</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 30,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  menuButton: {
    backgroundColor: '#FFD9C0',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
