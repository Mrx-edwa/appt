import React, { useState } from 'react';
import { Alert, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

const EquipmentFormScreen = () => {
  const [foto, setFoto] = useState(null);
  const [cargando, setCargando] = useState(false);

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara para tomar una foto');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
    if (!result.canceled) {
      const uri = result.uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(storage, `fotos/${Date.now()}.jpg`);

      // Subir la foto
      await uploadBytes(fileRef, blob);

      // Obtener la URL de la foto
      const photoURL = await getDownloadURL(fileRef);
      setFoto(photoURL);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput style={styles.input} placeholder="Nombre del equipo" />
      {/* Otros campos del formulario */}
      
      <TouchableOpacity style={styles.button} onPress={tomarFoto}>
        <Text style={styles.buttonText}>Tomar Foto</Text>
      </TouchableOpacity>

      {foto && <Image source={{ uri: foto }} style={styles.foto} />}

      {cargando ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Registrar Equipo</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, paddingHorizontal: 10 },
  button: { backgroundColor: '#1877f2', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  foto: { width: 100, height: 100, alignSelf: 'center', marginTop: 10, borderRadius: 10 },
});

export default EquipmentFormScreen;
