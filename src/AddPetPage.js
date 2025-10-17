import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import axios from 'axios';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const ORANGE = '#FF7A00';

export default function AddPetPage({ navigation }) {
  const [pet_name, setName] = useState('');
  const [pet_desc, setDesc] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');

  // Open image picker
  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', 'Image picker error: ' + response.errorMessage);
        return;
      }

      const asset = response.assets[0];
      setImageUri(asset.uri);
      await uploadImage(asset);
    });
  };

  // Upload image to backend
  const uploadImage = async (asset) => {
    const formData = new FormData();
    formData.append('image', {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName || `photo_${Date.now()}.jpg`,
    });

    try {
      const res = await axios.post('mysql://root:LTvkwuFGFomLRhwOoKtTuABgeeIVecLA@mysql.railway.internal:3306/railway/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setUploadedUrl(res.data.imageUrl);
        Alert.alert('Success', 'Image uploaded!');
      } else {
        Alert.alert('Error', res.data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  // Submit new pet
  const submitPet = async () => {
  if (!pet_name || !pet_desc || !uploadedUrl) {
    Alert.alert('Error', 'Please fill all fields and upload an image.');
    return;
  }

  try {
    const res = await axios.post('mysql://root:LTvkwuFGFomLRhwOoKtTuABgeeIVecLA@mysql.railway.internal:3306/railway/add-pet', {
      pet_name,
      pet_desc,
      pet_image: uploadedUrl,
    });

    if (res.data.success) {
      Alert.alert('Success', 'Pet added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.replace('AdminPage'), // ✅ back to admin
        },
      ]);
    } else {
      Alert.alert('Error', res.data.message);
    }
  } catch (err) {
    Alert.alert('Error', 'Failed to add pet.');
  }
};
    const openCamera = () => {
     launchCamera({ mediaType: 'photo' }, (response) => {
      if (!response.didCancel && !response.errorCode) {
      const asset = response.assets[0];
      setImageUri(asset.uri);
      uploadImage(asset);
    }
  });
};
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Pet for Adoption</Text>

      <TextInput
        style={styles.input}
        placeholder="Pet Name"
        value={pet_name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description"
        value={pet_desc}
        multiline
        onChangeText={setDesc}
      />
      <TouchableOpacity style={styles.imageButton} onPress={openCamera}>
        <Text style={styles.imageText}>📷 Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageText}>📸 Choose Image</Text>
      </TouchableOpacity>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      )}

      <TouchableOpacity style={styles.button} onPress={submitPet}>
        <Text style={styles.buttonText}>Save Pet</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#FFD9C0' }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.buttonText, { color: ORANGE }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ORANGE,
    padding: 25,
    alignItems: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 20,
  },
  input: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 15,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  imageButton: {
    backgroundColor: '#FFD9C0',
    borderRadius: 25,
    padding: 12,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  imageText: {
    color: ORANGE,
    fontWeight: 'bold',
  },
  previewImage: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderRadius: 15,
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: ORANGE,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
