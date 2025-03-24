import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { EXPO_PUBLIC_API_TOKEN } from '@env';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

const RegistroScreen = () => {
  const scrollViewRef = useRef(null);
  const [formulario, setFormulario] = useState({
    dni: '', nombre: '', telefono: '', numeroSerie: '', tipoDispositivo: '',
    marcaModelo: '', estadoFisico: '', accesorios: '', fotos: [], fechaRegistro: ''
  });
  const [cargando, setCargando] = useState(false);
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);

  const actualizarFormulario = useCallback((campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
  }, []);

  const handleSeleccionarFecha = (event, fecha) => {
    setMostrarDatePicker(false);
    if (fecha) {
      actualizarFormulario('fechaRegistro', fecha.toISOString().split('T')[0]);
    }
  };

  const obtenerDatosPorDni = useCallback(async () => {
    const dniLimpio = formulario.dni.trim();
    if (dniLimpio.length !== 8 || !/^\d+$/.test(dniLimpio)) {
      return Alert.alert('Error', 'El DNI debe tener 8 dígitos numéricos.');
    }
    if (!EXPO_PUBLIC_API_TOKEN) return Alert.alert('Error', 'API_TOKEN no está definido.');

    try {
      setCargando(true);
      const response = await fetch(`https://api.factiliza.com/v1/dni/info/${dniLimpio}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${EXPO_PUBLIC_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const nombreCompleto = data.data.nombre_completo;
        actualizarFormulario('nombre', nombreCompleto);
      } else {
        Alert.alert('Error', 'No se encontraron datos para este DNI.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }, [formulario.dni, actualizarFormulario]);

  const tomarFoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara');

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3]
    });
    if (!result.canceled && result.assets?.length > 0) {
      actualizarFormulario('fotos', [...formulario.fotos, result.assets[0].uri]);
    }
  }, [formulario.fotos, actualizarFormulario]);

  const seleccionarDeGaleria = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se requiere acceso a la galería');

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ImagePicker.MediaTypeOptions.Images
    });
    if (!result.canceled && result.assets?.length > 0) {
      actualizarFormulario('fotos', [...formulario.fotos, result.assets[0].uri]);
    }
  }, [formulario.fotos, actualizarFormulario]);

  const eliminarFoto = useCallback((index) => {
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro de que quieres eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: () => {
          const nuevasFotos = formulario.fotos.filter((_, i) => i !== index);
          actualizarFormulario('fotos', nuevasFotos);
        }}
      ]
    );
  }, [formulario.fotos, actualizarFormulario]);

  const subirImagen = useCallback(async (uri) => {
    try {
      const respuesta = await fetch(uri);
      const blob = await respuesta.blob();
      const referenciaImagen = ref(storage, `imagenes/${Date.now()}.jpg`);
      await uploadBytes(referenciaImagen, blob);
      return await getDownloadURL(referenciaImagen);
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      throw error;
    }
  }, []);

  const subirImagenesYGuardarDatos = useCallback(async () => {
    if (!formulario.numeroSerie || !formulario.tipoDispositivo || !formulario.marcaModelo || !formulario.dni || !formulario.nombre) {
      return Alert.alert("Error", "Por favor complete todos los campos obligatorios.");
    }
    
    setCargando(true);
    try {
      let urlsFotos = formulario.fotos.length > 0 
        ? await Promise.all(formulario.fotos.map(uri => subirImagen(uri)))
        : [];

      await addDoc(collection(db, "computadoras"), { 
        ...formulario, 
        fotos: urlsFotos,
        fechaRegistro: formulario.fechaRegistro || new Date().toISOString().split('T')[0],
        fechaCreacion: new Date().toISOString()
      });

      Alert.alert("Éxito", "El equipo ha sido registrado correctamente.");
      setFormulario({ 
        dni: '', nombre: '', telefono: '', numeroSerie: '', tipoDispositivo: '', 
        marcaModelo: '', estadoFisico: '', accesorios: '', fotos: [], fechaRegistro: '' 
      });
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      Alert.alert("Error", "Ocurrió un error al guardar los datos. Por favor intente nuevamente.");
    } finally {
      setCargando(false);
    }
  }, [formulario, subirImagen]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[styles.container, { minHeight: height + 200 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
          style={{ flex: 1 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Registro de Equipos</Text>
            <Text style={styles.subtitle}>Complete todos los campos requeridos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
            
            <View style={styles.dniContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>DNI</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ingrese DNI" 
                  value={formulario.dni} 
                  onChangeText={(text) => actualizarFormulario('dni', text)} 
                  keyboardType="numeric" 
                  maxLength={8} 
                />
              </View>
              <TouchableOpacity 
                style={styles.searchButton} 
                onPress={obtenerDatosPorDni}
                disabled={cargando}
              >
                {cargando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: '#f5f5f5' }]} 
                placeholder="Nombre del cliente" 
                value={formulario.nombre} 
                editable={false} 
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Número de contacto" 
                value={formulario.telefono} 
                onChangeText={(text) => actualizarFormulario('telefono', text)} 
                keyboardType="phone-pad" 
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información del Equipo</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Número de Serie *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Identificación única del equipo" 
                value={formulario.numeroSerie} 
                onChangeText={(text) => actualizarFormulario('numeroSerie', text)} 
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Dispositivo *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej: Laptop, Desktop, All-in-One" 
                value={formulario.tipoDispositivo} 
                onChangeText={(text) => actualizarFormulario('tipoDispositivo', text)} 
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Marca y Modelo *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej: HP ProBook 450 G8" 
                value={formulario.marcaModelo} 
                onChangeText={(text) => actualizarFormulario('marcaModelo', text)} 
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Estado Físico</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Descripción del estado del equipo" 
                value={formulario.estadoFisico} 
                onChangeText={(text) => actualizarFormulario('estadoFisico', text)} 
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Accesorios Incluidos</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                placeholder="Lista de accesorios entregados" 
                value={formulario.accesorios} 
                onChangeText={(text) => actualizarFormulario('accesorios', text)} 
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fecha de Registro</Text>
              <TouchableOpacity 
                style={styles.input} 
                onPress={() => setMostrarDatePicker(true)}
              >
                <Text style={formulario.fechaRegistro ? {} : { color: '#999' }}>
                  {formulario.fechaRegistro || "Seleccionar fecha"}
                </Text>
              </TouchableOpacity>
              {mostrarDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleSeleccionarFecha}
                />
              )}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Evidencia Fotográfica</Text>
            <Text style={styles.photoSubtitle}>Adjunte fotos del equipo y sus accesorios</Text>
            
            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity 
                style={[styles.photoButton, { marginRight: 10 }]} 
                onPress={tomarFoto}
              >
                <Ionicons name="camera" size={20} color="#4CAF50" />
                <Text style={styles.photoButtonText}>Tomar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.photoButton} 
                onPress={seleccionarDeGaleria}
              >
                <Ionicons name="image" size={20} color="#2196F3" />
                <Text style={styles.photoButtonText}>Galería</Text>
              </TouchableOpacity>
            </View>

            {formulario.fotos.length > 0 && (
              <View style={styles.fotoContainer}>
                {formulario.fotos.map((foto, index) => (
                  <View key={index} style={styles.fotoWrapper}>
                    <Image source={{ uri: foto }} style={styles.foto} />
                    <TouchableOpacity 
                      style={styles.borrarButton} 
                      onPress={() => eliminarFoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, cargando && styles.submitButtonDisabled]} 
            onPress={subirImagenesYGuardarDatos}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Guardar Registro</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>* Campos obligatorios</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  photoSubtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#333',
  },
  dniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  photoButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  fotoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  fotoWrapper: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
  },
  foto: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  borrarButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    backgroundColor: '#27ae60',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
});

export default RegistroScreen;