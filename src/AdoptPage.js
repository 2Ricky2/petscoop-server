import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ORANGE = '#FF7A00';

function AdoptPage({ navigation }) {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [role, setRole] = useState('user'); // default user role
  const [modalVisible, setModalVisible] = useState(false);

  const fetchPets = async () => {
    try {
      const res = await axios.get('http://10.0.2.2:3000/pets');
      if (res.data.success) {
        setPets(res.data.pets);
      } else {
        Alert.alert('Error', res.data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pets.');
    }
  };

  const loadRole = async () => {
    const userRole = await AsyncStorage.getItem('userRole');
    if (userRole) setRole(userRole);
  };

  useEffect(() => {
    fetchPets();
    loadRole();
  }, []);

  const goBack = () => {
    navigation.replace('MainPage');
  };

  const openAddPet = () => {
    navigation.navigate('AddPetPage');
  };

  const showPetInfo = (pet) => {
    setSelectedPet(pet);
    setModalVisible(true);
  };

  // 🐾 Adopt Pet Function
  const adoptPet = () => {
    Alert.alert(
      'Adoption Confirmation',
      `Are you sure you want to adopt ${selectedPet.pet_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            setModalVisible(false);
            Alert.alert('Thank you!', `You have adopted ${selectedPet.pet_name}!`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          <Image source={require('../assets/images/smallpaw.png')} /> PETSCOOP
        </Text>

        <TouchableOpacity style={styles.button} onPress={goBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {role === 'admin' && (
        <TouchableOpacity style={styles.addButton} onPress={openAddPet}>
          <Text style={styles.addText}>+ Add Pet for Adoption</Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {pets.map((pet) => (
          <View key={pet.pet_id} style={styles.card}>
            <Image
              source={{ uri: pet.pet_image || 'https://via.placeholder.com/150' }}
              style={styles.petImage}
            />
            <Text style={styles.petName}>Name: {pet.pet_name}</Text>

            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => showPetInfo(pet)}
            >
              <Text style={styles.infoText}>INFO</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Pet Info Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPet && (
              <>
                <Text style={styles.modalTitle}>{selectedPet.pet_name}</Text>
                <Image
                  source={{
                    uri: selectedPet.pet_image || 'https://via.placeholder.com/150',
                  }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalDesc}>{selectedPet.pet_desc}</Text>

                {/* 🟢 Button Row (Adopt + Close) */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.adoptButton}
                    onPress={adoptPet}
                  >
                    <Text style={styles.adoptText}>Adopt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ORANGE },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFD9C0',
    padding: 15,
    marginTop: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: { fontSize: 35, fontWeight: 'bold', color: ORANGE },
  scroll: { padding: 20, alignItems: 'center' },
  card: {
    backgroundColor: '#FFD9C0',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    width: '80%',
  },
  petImage: { width: '100%', height: 180, borderRadius: 15 },
  petName: { fontSize: 16, marginVertical: 10, color: '#333' },
  infoButton: {
    backgroundColor: ORANGE,
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  infoText: { color: '#fff', fontWeight: 'bold' },
  buttonText: { color: '#b13939ff', fontWeight: 'bold', fontSize: 18 },
  button: {
    backgroundColor: ORANGE,
    padding: 5,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 15,
  },
  addButton: {
    backgroundColor: '#FFD9C0',
    marginHorizontal: 30,
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  addText: { color: ORANGE, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: ORANGE },
  modalImage: {
    width: 200,
    height: 200,
    marginVertical: 15,
    borderRadius: 15,
  },
  modalDesc: { fontSize: 16, color: '#444', textAlign: 'center' },

  
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  adoptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  adoptText: { color: '#fff', fontWeight: 'bold' },
  closeButton: {
    backgroundColor: ORANGE,
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  closeText: { color: '#fff', fontWeight: 'bold' },
});

export default AdoptPage;
