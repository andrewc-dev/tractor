import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, LogBox } from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import JoinGameScreen from './src/screens/JoinGameScreen';
import WaitingRoomScreen from './src/screens/WaitingRoomScreen';
import GameScreen from './src/screens/GameScreen';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Unrecognized WebSocket connection',
  'Socket.io connection error'
]);

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="JoinGame" component={JoinGameScreen} />
        <Stack.Screen name="WaitingRoom" component={WaitingRoomScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; 