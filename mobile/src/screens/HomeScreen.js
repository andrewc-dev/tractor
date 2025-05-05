import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Button from '../components/Button';
import { createGame } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [creating, setCreating] = useState(false);

  // Create a new game
  const handleCreateGame = async () => {
    try {
      setCreating(true);
      
      // Generate a player ID or get from storage if exists
      let playerId = await AsyncStorage.getItem('playerId');
      if (!playerId) {
        playerId = uuid.v4();
        await AsyncStorage.setItem('playerId', playerId);
      }
      
      // Create a new game on the server
      const response = await createGame();
      
      if (response.success) {
        // Navigate to the waiting room
        navigation.navigate('JoinGame', { 
          gameId: response.gameId,
          fromCreate: true,
          playerId
        });
      } else {
        Alert.alert('Error', 'Could not create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert('Error', 'Could not create game. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Navigate to join game screen
  const handleJoinGame = () => {
    navigation.navigate('JoinGame');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Tractor Card Game</Text>
          <Text style={styles.subtitle}>Multiplayer Card Game Experience</Text>
        </View>
        
        <View style={styles.buttonsContainer}>
          <Button
            title="Create Game"
            onPress={handleCreateGame}
            loading={creating}
            style={styles.button}
          />
          
          <Button
            title="Join Game"
            onPress={handleJoinGame}
            primary={false}
            style={styles.button}
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Tractor Card Game</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    maxWidth: '80%',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    width: '100%',
    marginVertical: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
  },
});

export default HomeScreen; 