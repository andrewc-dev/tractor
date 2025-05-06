import { Card } from '../types.js';

// Generate a standard deck of 54 cards
export function generateDeck(): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        suit,
        value
      });
    }
  }
  deck.push({
    suit: '',
    value: 'Big Joker',
    isJoker: true,
  });
  deck.push({
    suit: '',
    value: 'Small Joker',
    isJoker: true,
  });

  // Shuffle the deck
  return shuffleDeck(deck);
}

// Shuffle a deck of cards
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Deal a specific number of cards from a deck
export function dealCards(deck: Card[], count: number): Card[] {
  return deck.splice(0, count);
} 