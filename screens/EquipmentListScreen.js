import React, { useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';

const EquipmentListScreen = () => {
  const [equipments, setEquipments] = useState([
    { id: '1', name: 'Computadora 1', photo: 'https://example.com/photo1.jpg' },
    { id: '2', name: 'Computadora 2', photo: 'https://example.com/photo2.jpg' },
    // Aquí puedes agregar más equipos para probar
  ]);

  return (
    <View>
      <FlatList
        data={equipments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name}</Text>
            {item.photo && <Image source={{ uri: item.photo }} style={styles.image} />}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  image: {
    width: 100,
    height: 100,
  },
});

export default EquipmentListScreen;
