import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import CameraComponent from '../components/CameraComponent';

const EquipmentFormScreen = ({ navigation }) => {
  const [equipmentName, setEquipmentName] = useState('');
  const [photo, setPhoto] = useState(null);

  const handleSave = () => {
    if (equipmentName && photo) {
      // Aquí podrías hacer lo que desees con los datos, como enviarlos a un servidor o guardarlos localmente
      Alert.alert('Éxito', 'Equipo guardado exitosamente');
      navigation.navigate('Home');
    } else {
      Alert.alert('Error', 'Por favor completa todos los campos');
    }
  };

  return (
    <View>
      <TextInput 
        placeholder="Nombre del Equipo" 
        value={equipmentName} 
        onChangeText={setEquipmentName} 
      />
      <CameraComponent onPhotoTaken={setPhoto} />
      <Button title="Guardar" onPress={handleSave} />
    </View>
  );
};

export default EquipmentFormScreen;
