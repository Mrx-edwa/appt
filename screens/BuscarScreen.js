import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  Image, 
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const BuscarScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [filteredEquipos, setFilteredEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEquipos();
  }, []);

  const fetchEquipos = async () => {
    try {
      setRefreshing(true);
      const querySnapshot = await getDocs(collection(db, 'computadoras'));
      const data = querySnapshot.docs.map(doc => {
        const item = doc.data();
        return {
          id: doc.id,
          ...item,
          fechaRegistro: item.fechaRegistro 
            ? new Date(item.fechaRegistro).toLocaleDateString('es-PE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
            : 'No disponible'
        };
      });

      setEquipos(data);
      setFilteredEquipos(data);
    } catch (error) {
      Alert.alert('Error', `Hubo un problema al cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (!text) {
      setFilteredEquipos(equipos);
      return;
    }

    const filtered = equipos.filter((item) =>
      item.nombre?.toLowerCase().includes(text.toLowerCase()) ||
      (item.dni && String(item.dni).includes(text)) || 
      item.tipoDispositivo?.toLowerCase().includes(text.toLowerCase()) ||
      item.marcaModelo?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredEquipos(filtered);
  };

  const handleVerDetalles = (equipo) => {
    setSelectedEquipo(equipo);
    setModalVisible(true);
  };

  const handleRefresh = () => {
    fetchEquipos();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar Equipos</Text>
        <Text style={styles.headerSubtitle}>Buscar por Nombre, DNI o Tipo de Dispositivo</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Buscar..."
          placeholderTextColor="#95a5a6"
          value={searchText}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Lista de equipos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : filteredEquipos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#bdc3c7" />
          <Text style={styles.emptyText}>No se encontraron resultados</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Recargar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredEquipos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.equipoCard}
              onPress={() => handleVerDetalles(item)}
            >
              <View style={styles.equipoHeader}>
                <Text style={styles.equipoTitle} numberOfLines={1}>{item.nombre || 'Sin nombre'}</Text>
                <Text style={styles.equipoDate}>{item.fechaRegistro}</Text>
              </View>
              
              <View style={styles.equipoInfoRow}>
                <Ionicons name="id-card" size={16} color="#7f8c8d" />
                <Text style={styles.equipoInfo}>DNI: {item.dni || 'No registrado'}</Text>
              </View>
              
              <View style={styles.equipoInfoRow}>
                <Ionicons name="desktop" size={16} color="#7f8c8d" />
                <Text style={styles.equipoInfo}>{item.tipoDispositivo || 'Sin tipo'}</Text>
              </View>
              
              <View style={styles.equipoInfoRow}>
                <Ionicons name="logo-android" size={16} color="#7f8c8d" />
                <Text style={styles.equipoInfo}>{item.marcaModelo || 'Sin marca/modelo'}</Text>
              </View>
              
              <View style={styles.equipoFooter}>
                <TouchableOpacity 
                  style={styles.detalleButton}
                  onPress={() => handleVerDetalles(item)}
                >
                  <Text style={styles.detalleButtonText}>Ver detalles</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modal para mostrar detalles */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {selectedEquipo && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Detalles del Equipo</Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Ionicons name="close" size={24} color="#7f8c8d" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Información del Cliente</Text>
                    <DetailRow icon="person" label="Nombre" value={selectedEquipo.nombre} />
                    <DetailRow icon="id-card" label="DNI" value={selectedEquipo.dni} />
                    <DetailRow icon="call" label="Teléfono" value={selectedEquipo.telefono} />
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Información del Equipo</Text>
                    <DetailRow icon="barcode" label="Número de Serie" value={selectedEquipo.numeroSerie} />
                    <DetailRow icon="desktop" label="Tipo de Dispositivo" value={selectedEquipo.tipoDispositivo} />
                    <DetailRow icon="logo-android" label="Marca y Modelo" value={selectedEquipo.marcaModelo} />
                    <DetailRow icon="construct" label="Estado Físico" value={selectedEquipo.estadoFisico} />
                    <DetailRow icon="list" label="Accesorios" value={selectedEquipo.accesorios} />
                    <DetailRow icon="calendar" label="Fecha de Registro" value={selectedEquipo.fechaRegistro} />
                  </View>
                  
                  {/* Mostrar fotos */}
                  {selectedEquipo.fotos && selectedEquipo.fotos.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Fotos del Equipo</Text>
                      <ScrollView 
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.fotosContainer}
                      >
                        {selectedEquipo.fotos.map((foto, index) => (
                          <Image key={index} source={{ uri: foto }} style={styles.foto} />
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Componente auxiliar para mostrar filas de detalle
const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconContainer}>
      <Ionicons name={icon} size={18} color="#3498db" />
    </View>
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value || 'No especificado'}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#3498db',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2c3e50',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  equipoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  equipoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  equipoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  equipoDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  equipoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipoInfo: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 8,
  },
  equipoFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 10,
  },
  detalleButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  detalleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 15,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  modalCloseButton: {
    padding: 5,
  },
  detailSection: {
    marginBottom: 25,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  fotosContainer: {
    paddingVertical: 5,
  },
  foto: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
});

export default BuscarScreen;