import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Share,
  Alert,
  BackHandler,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

import LoadingAnimation from '../components/LoadingAnimation';
import Button from '../components/Button';
import { getGameStatus } from '../services/api';
import {
  initializeSocket,
  joinGameRoom,
  listenForPlayerJoined,
  listenForGameReady,
  disconnectSocket
} from '../services/socket';

const WaitingRoomScreen = ({ navigation, route }) => {
  const { gameId, playerId, playerName } = route.params;
  const [playerCount, setPlayerCount] = useState(route.params.playerCount || 1);
  const [maxPlayers] = useState(route.params.maxPlayers || 4);
  const [status, setStatus] = useState(route.params.status || 'waiting');
  const [isPolling, setIsPolling] = useState(true);
  
  // Handle back button press to prevent accidental exits
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Leave Game',
        'Are you sure you want to leave the game?',
        [
          { text: 'Cancel', onPress: () => null, style: 'cancel' },
          { text: 'Leave', onPress: () => navigation.goBack() }
        ]
      );
      return true;
    });
    
    return () => backHandler.remove();
  }, [navigation]);
  
  // Connect to socket and set up listeners
  useEffect(() => {
    const setupSocketConnection = async () => {
      try {
        await initializeSocket();
        await joinGameRoom(gameId, playerId, playerName);
        
        listenForPlayerJoined((data) => {
          setPlayerCount(data.playerCount);
          setStatus(data.status);
        });
        
        listenForGameReady((data) => {
          setStatus(data.status);
          if (data.status === 'ready') {
            navigation.replace('Game', {
              gameId,
              playerId,
              playerName,
            });
          }
        });
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    };
    
    setupSocketConnection();
    
    // Cleanup function
    return () => {
      disconnectSocket();
    };
  }, [gameId, playerId, playerName, navigation]);
  
  // Poll for game status as backup if sockets fail
  useEffect(() => {
    let interval;
    
    if (isPolling) {
      interval = setInterval(async () => {
        try {
          const response = await getGameStatus(gameId);
          if (response.success) {
            setPlayerCount(response.game.playerCount);
            setStatus(response.game.status);
            
            if (response.game.status === 'ready') {
              setIsPolling(false);
              navigation.replace('Game', {
                gameId,
                playerId,
                playerName,
              });
            }
          }
        } catch (error) {
          console.error('Error polling game status:', error);
        }
      }, 5000);
    }
    
    return () => clearInterval(interval);
  }, [gameId, playerId, playerName, navigation, isPolling]);
  
  // Share game invite link
  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join my card game with game ID: ${gameId}`,
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              'Leave Game',
              'Are you sure you want to leave the game?',
              [
                { text: 'Cancel', onPress: () => null, style: 'cancel' },
                { text: 'Leave', onPress: () => navigation.goBack() }
              ]
            );
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Waiting Room</Text>
      </View>
      
      <View style={styles.content}>
        <Animatable.View 
          animation="fadeIn" 
          duration={800} 
          style={styles.gameIdContainer}
        >
          <Text style={styles.gameIdLabel}>Game ID:</Text>
          <Text style={styles.gameId}>{gameId}</Text>
          <TouchableOpacity onPress={handleShareInvite} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share Invite</Text>
          </TouchableOpacity>
        </Animatable.View>
        
        <LoadingAnimation message="Waiting for players to join..." />
        
        <View style={styles.playerInfoContainer}>
          <Text style={styles.playerInfoText}>
            {playerCount} of {maxPlayers} players joined
          </Text>
          <View style={styles.playerCountVisualization}>
            {[...Array(maxPlayers)].map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.playerDot,
                  index < playerCount ? styles.playerDotActive : null
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 25,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameIdContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameIdLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  gameId: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    letterSpacing: 2,
  },
  shareButton: {
    marginTop: 12,
    padding: 8,
  },
  shareButtonText: {
    color: '#4E56F6',
    fontSize: 14,
    fontWeight: '500',
  },
  playerInfoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  playerInfoText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
  },
  playerCountVisualization: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
  },
  playerDotActive: {
    backgroundColor: '#4E56F6',
  },
});

export default WaitingRoomScreen; 