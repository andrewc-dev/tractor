import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Button from '../components/Button';
import Input from '../components/Input';
import { joinGame, getGameStatus } from '../services/api';

const JoinGameScreen = ({ navigation, route }) => {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameIdError, setGameIdError] = useState('');
  const [playerNameError, setPlayerNameError] = useState('');
  
  // Get the game ID from route params if coming from create game
  useEffect(() => {
    const loadSavedName = async () => {
      const savedName = await AsyncStorage.getItem('playerName');
      if (savedName) {
        setPlayerName(savedName);
      }
    };
    
    loadSavedName();
    
    if (route.params?.gameId) {
      setGameId(route.params.gameId);
    }
  }, [route.params]);
  
  // Validate form fields
  const validateForm = () => {
    let isValid = true;
    
    if (!gameId.trim()) {
      setGameIdError('Game ID is required');
      isValid = false;
    } else {
      setGameIdError('');
    }
    
    if (!playerName.trim()) {
      setPlayerNameError('Your name is required');
      isValid = false;
    } else {
      setPlayerNameError('');
    }
    
    return isValid;
  };
  
  // Handle joining a game
  const handleJoinGame = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // First, check if game exists
      try {
        await getGameStatus(gameId);
      } catch (error) {
        setGameIdError('Game not found or has expired');
        setLoading(false);
        return;
      }
      
      // Get or generate player ID
      let playerId = route.params?.playerId || await AsyncStorage.getItem('playerId');
      if (!playerId) {
        playerId = uuid.v4();
        await AsyncStorage.setItem('playerId', playerId);
      }
      
      // Save player name
      await AsyncStorage.setItem('playerName', playerName);
      
      // Join the game
      const response = await joinGame(gameId, playerId, playerName);
      
      if (response.success) {
        // Navigate to waiting room
        navigation.navigate('WaitingRoom', {
          gameId,
          playerId,
          playerName,
          playerCount: response.game.playerCount,
          maxPlayers: response.game.maxPlayers,
          status: response.game.status
        });
      } else {
        Alert.alert('Error', 'Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      if (error.response?.status === 400) {
        Alert.alert('Error', error.response.data.message || 'Game room is full');
      } else {
        Alert.alert('Error', 'Failed to join game. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Join Game</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Input
              label="Game ID"
              value={gameId}
              onChangeText={setGameId}
              placeholder="Enter game ID"
              keyboardType="default"
              autoCapitalize="characters"
              maxLength={6}
              error={gameIdError}
              editable={!route.params?.fromCreate}
            />
            
            <Input
              label="Your Name"
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Enter your name"
              autoCapitalize="words"
              maxLength={15}
              error={playerNameError}
            />
            
            <Button
              title="Join Game"
              onPress={handleJoinGame}
              loading={loading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginVertical: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 5,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4E56F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  formContainer: {
    marginTop: 40,
    width: '100%',
  },
  button: {
    marginTop: 20,
  },
});

export default JoinGameScreen; 