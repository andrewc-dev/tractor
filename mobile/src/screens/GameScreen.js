import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
  FlatList,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

import Card from '../components/Card';
import Button from '../components/Button';
import LoadingAnimation from '../components/LoadingAnimation';
import {
  initializeSocket,
  joinGameRoom,
  listenForCardPlayed,
  playCard,
  disconnectSocket,
} from '../services/socket';
import { getGameStatus, dealCards } from '../services/api';

const GameScreen = ({ navigation, route }) => {
  const { gameId, playerId, playerName } = route.params;
  const [gameState, setGameState] = useState({
    status: 'waiting',
    players: [],
    currentPlayer: null,
    playedCards: [],
  });
  const [hand, setHand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  
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
  
  // Connect to socket and setup game
  useEffect(() => {
    const setupGame = async () => {
      try {
        setLoading(true);
        
        // Initialize socket connection
        await initializeSocket();
        await joinGameRoom(gameId, playerId, playerName);
        
        // Listen for card played events
        listenForCardPlayed((data) => {
          const { playerId: cardPlayerId, card } = data;
          // Update game state with played card
          setGameState(prevState => ({
            ...prevState,
            playedCards: [...prevState.playedCards, { playerId: cardPlayerId, card }],
          }));
        });
        
        // Get initial game state and check if we need to deal cards
        const gameStatusResponse = await getGameStatus(gameId);
        
        if (gameStatusResponse.success) {
          if (gameStatusResponse.game.status === 'ready') {
            // Game is ready but cards haven't been dealt
            // First player to reach this point will deal the cards
            try {
              await dealCards(gameId);
            } catch (error) {
              // Ignore errors, as another player might have already dealt the cards
              console.log('Deal cards error (might be already dealt):', error);
            }
          }
          
          // Simulate getting cards from the server
          // In a real implementation, you would fetch the player's hand
          // For now, we'll simulate with random cards
          const simulatedHand = generateRandomHand();
          setHand(simulatedHand);
          
          setGameState(prevState => ({
            ...prevState,
            status: 'active',
            players: Array(4).fill().map((_, i) => ({
              id: i === 0 ? playerId : `player-${i}`,
              name: i === 0 ? playerName : `Player ${i + 1}`,
            })),
            currentPlayer: playerId, // Start with the current player for simplicity
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error setting up game:', error);
        Alert.alert('Error', 'Failed to set up game. Please try again.');
        navigation.goBack();
      }
    };
    
    setupGame();
    
    // Cleanup socket connection on unmount
    return () => {
      disconnectSocket();
    };
  }, [gameId, playerId, playerName, navigation]);
  
  // Handle playing a card
  const handlePlayCard = () => {
    if (!selectedCard) {
      Alert.alert('Select a Card', 'Please select a card to play.');
      return;
    }
    
    // Play the card via socket
    playCard(gameId, playerId, selectedCard);
    
    // Update local state
    setHand(hand.filter(card => 
      !(card.suit === selectedCard.suit && card.value === selectedCard.value)
    ));
    
    setGameState(prevState => ({
      ...prevState,
      playedCards: [...prevState.playedCards, { playerId, card: selectedCard }],
    }));
    
    // Reset selected card
    setSelectedCard(null);
  };
  
  // Render player's hand
  const renderHand = () => {
    return (
      <View style={styles.handContainer}>
        <Text style={styles.sectionTitle}>Your Hand</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.cardsRow}>
            {hand.map((card, index) => (
              <Animatable.View 
                key={`${card.suit}-${card.value}-${index}`}
                animation="fadeIn"
                delay={index * 100}
              >
                <Card
                  card={card}
                  onPress={() => setSelectedCard(card)}
                  style={[
                    styles.card,
                    selectedCard && 
                    selectedCard.suit === card.suit && 
                    selectedCard.value === card.value && 
                    styles.selectedCard
                  ]}
                />
              </Animatable.View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };
  
  // Render played cards area
  const renderPlayedCards = () => {
    const recentCards = gameState.playedCards.slice(-4); // Show only the most recent cards
    
    return (
      <View style={styles.playedCardsContainer}>
        <Text style={styles.sectionTitle}>Played Cards</Text>
        {recentCards.length === 0 ? (
          <Text style={styles.noCardsText}>No cards played yet</Text>
        ) : (
          <View style={styles.playedCardsGrid}>
            {recentCards.map((playedCard, index) => (
              <Animatable.View
                key={`played-${playedCard.card.suit}-${playedCard.card.value}-${index}`}
                animation="zoomIn"
                duration={300}
              >
                <Card card={playedCard.card} disabled={true} />
              </Animatable.View>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  // Render players info
  const renderPlayers = () => {
    return (
      <View style={styles.playersContainer}>
        <Text style={styles.sectionTitle}>Players</Text>
        <View style={styles.playersList}>
          {gameState.players.map((player, index) => (
            <View 
              key={player.id} 
              style={[
                styles.playerItem,
                player.id === gameState.currentPlayer && styles.currentPlayerItem
              ]}
            >
              <Text 
                style={[
                  styles.playerName,
                  player.id === gameState.currentPlayer && styles.currentPlayerName
                ]}
              >
                {player.name} {player.id === playerId ? '(You)' : ''}
              </Text>
              <Text style={styles.cardsCount}>
                {player.id === playerId ? `${hand.length} cards` : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingAnimation message="Setting up the game..." />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Game Room: {gameId}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {renderPlayers()}
        {renderPlayedCards()}
      </ScrollView>
      
      {renderHand()}
      
      <View style={styles.actionsContainer}>
        <Button
          title="Play Card"
          onPress={handlePlayCard}
          disabled={!selectedCard}
          style={styles.actionButton}
        />
      </View>
    </SafeAreaView>
  );
};

// Helper function to generate a random hand of cards for testing
const generateRandomHand = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const hand = [];
  for (let i = 0; i < 5; i++) {
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomValue = values[Math.floor(Math.random() * values.length)];
    hand.push({
      suit: randomSuit,
      value: randomValue
    });
  }
  
  return hand;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#4E56F6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 12,
  },
  playersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playersList: {
    marginTop: 8,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  currentPlayerItem: {
    backgroundColor: '#F0F8FF',
  },
  playerName: {
    fontSize: 16,
    color: '#333333',
  },
  currentPlayerName: {
    fontWeight: 'bold',
    color: '#4E56F6',
  },
  cardsCount: {
    fontSize: 14,
    color: '#666666',
  },
  playedCardsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playedCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  noCardsText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    padding: 20,
  },
  handContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cardsRow: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  card: {
    marginRight: 10,
  },
  selectedCard: {
    transform: [{ translateY: -20 }],
    borderColor: '#4E56F6',
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    width: '100%',
  },
});

export default GameScreen; 