import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import EquipmentFormScreen from './screens/EquipmentFormScreen';
import EquipmentListScreen from './screens/EquipmentListScreen';
import Registro from './screens/RegistroScreen';
import Buscar from './screens/BuscarScreen';

const Stack = createStackNavigator();

// Solución para el error 'setImmediate' en modo Bridgeless
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback) => setTimeout(callback, 0);
}

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EquipmentForm" component={EquipmentFormScreen} />
        <Stack.Screen name="EquipmentList" component={EquipmentListScreen} />
        <Stack.Screen name="Registro" component={Registro} />
        <Stack.Screen name="Buscar" component={Buscar} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
