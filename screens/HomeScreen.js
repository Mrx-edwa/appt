import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 600;

const statusColors = {
  'Pantalla Rota': '#FF6B6B',
  'Falta de soporte': '#4ECDC4',
  'En diagnóstico': '#FFD166',
  'Reparado': '#06D6A0',
  'Entregado': '#118AB2'
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'computadoras'));
        const data = querySnapshot.docs.map(doc => {
          const item = doc.data();
          return {
            id: doc.id,
            ...item,
            fechaRegistro: item.fechaRegistro
              ? new Date(item.fechaRegistro).toLocaleDateString()
              : 'No disponible'
          };
        });
        setEquipos(data);
      } catch (error) {
        Alert.alert('Error', `Hubo un problema al cargar los datos: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipos();
  }, []);

  const handleVerDetalles = (equipo) => {
    setSelectedEquipo(equipo);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    return statusColors[status] || '#888';
  };

  return (
    <LinearGradient 
      colors={['#f5f7fa', '#e4e8f0']} 
      style={styles.container}
    >
      {/* Encabezado con gradiente */}
      <LinearGradient
        colors={['#4b6cb7', '#182848']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Gestión de Equipos</Text>
          <TouchableOpacity style={styles.profileButton}>
            <FontAwesome5 name="user-cog" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tarjetas de acciones principales */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Registro')}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.actionCardGradient}
          >
            <MaterialIcons name="add-circle" size={32} color="white" />
            <Text style={styles.actionCardText}>Registrar Equipo</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Buscar')}
        >
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.actionCardGradient}
          >
            <MaterialIcons name="search" size={32} color="white" />
            <Text style={styles.actionCardText}>Buscar Equipo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Sección de equipos */}
      <View style={styles.sectionHeader}>
        <Ionicons name="construct" size={24} color="#4b6cb7" />
        <Text style={styles.sectionTitle}>Equipos en Reparación</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4b6cb7" />
        </View>
      ) : equipos.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="devices-other" size={60} color="#ccc" />
          <Text style={styles.emptyStateText}>No hay equipos en reparación</Text>
          <Text style={styles.emptyStateSubtext}>Presiona "+ Registrar Equipo" para agregar uno</Text>
        </View>
      ) : (
        <FlatList
          data={equipos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.equipoCard}
              onPress={() => handleVerDetalles(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.equipoTitle}>{item.tipoDispositivo} - {item.marcaModelo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estadoFisico) }]}>
                  <Text style={styles.statusText}>{item.estadoFisico}</Text>
                </View>
              </View>
              
              <View style={styles.clientInfo}>
                <MaterialIcons name="person" size={16} color="#666" />
                <Text style={styles.equipoInfo}>{item.nombre}</Text>
              </View>
              
              <View style={styles.clientInfo}>
                <MaterialIcons name="phone" size={16} color="#666" />
                <Text style={styles.equipoInfo}>{item.telefono}</Text>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={styles.dateInfo}>
                  <MaterialIcons name="date-range" size={16} color="#666" />
                  <Text style={styles.dateText}>{item.fechaRegistro}</Text>
                </View>
                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>Ver detalles</Text>
                  <MaterialIcons name="chevron-right" size={18} color="#4b6cb7" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          numColumns={isTablet ? 2 : 1}
          columnWrapperStyle={isTablet ? styles.columnWrapper : null}
        />
      )}

      {/* Modal de detalles */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, isTablet && { width: '70%' }]}>
            {selectedEquipo && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalles del Equipo</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalScroll}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="devices" size={20} color="#4b6cb7" />
                    <Text style={styles.detailText}>{selectedEquipo.tipoDispositivo} - {selectedEquipo.marcaModelo}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="person" size={20} color="#4b6cb7" />
                    <Text style={styles.detailText}>{selectedEquipo.nombre}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="phone" size={20} color="#4b6cb7" />
                    <Text style={styles.detailText}>{selectedEquipo.telefono}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="date-range" size={20} color="#4b6cb7" />
                    <Text style={styles.detailText}>{selectedEquipo.fechaRegistro}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="info" size={20} color="#4b6cb7" />
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedEquipo.estadoFisico) }]}>
                      <Text style={styles.statusText}>{selectedEquipo.estadoFisico}</Text>
                    </View>
                  </View>
                  
                  {selectedEquipo.fotos && selectedEquipo.fotos.length > 0 && (
                    <>
                      <View style={styles.sectionDivider}>
                        <Text style={styles.sectionTitle}>Fotos del Equipo</Text>
                      </View>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.photosScroll}
                      >
                        {selectedEquipo.fotos.map((foto, index) => (
                          <Image 
                            key={index} 
                            source={{ uri: foto }} 
                            style={styles.photo} 
                          />
                        ))}
                      </ScrollView>
                    </>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'sans-serif-medium',
  },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  actionCard: {
    width: '48%',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  actionCardGradient: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#888',
    marginTop: 15,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  equipoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    flex: isTablet ? 0.48 : 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  equipoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipoInfo: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 13,
    color: '#4b6cb7',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginTop: 10,
  },
  photosScroll: {
    marginVertical: 15,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
});

export default HomeScreen;