import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';

const Card = ({ card, onPress, style, disabled = false }) => {
  if (!card) return null;
  
  const { suit, value } = card;
  
  // Define color based on suit
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const color = isRed ? '#E63946' : '#1D3557';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.8}
      style={[styles.cardContainer, style]}
    >
      <View style={[styles.card, disabled && styles.disabledCard]}>
        {/* Top-left corner with value and suit symbol */}
        <View style={styles.topLeft}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          <SuitIcon suit={suit} size={12} color={color} />
        </View>
        
        {/* Center symbol */}
        <View style={styles.center}>
          <SuitIcon suit={suit} size={30} color={color} />
        </View>
        
        {/* Bottom-right corner with value and suit symbol */}
        <View style={styles.bottomRight}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          <SuitIcon suit={suit} size={12} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SuitIcon = ({ suit, size, color }) => {
  switch (suit) {
    case 'hearts':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </Svg>
      );
    case 'diamonds':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12 2L8 12L12 22L16 12L12 2Z" />
        </Svg>
      );
    case 'clubs':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12 2C9.24 2 7 4.24 7 7C7 8.7 7.87 10.2 9.17 11C6.79 11.76 5 14.08 5 16.8V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V16.8C19 14.08 17.21 11.76 14.83 11C16.13 10.2 17 8.7 17 7C17 4.24 14.76 2 12 2Z" />
        </Svg>
      );
    case 'spades':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12 2C8 2 4 5 4 11C4 13 5 15 7 16.25C9.67 18 11.94 19.83 12 22C12.06 19.83 14.33 18 17 16.25C19 15 20 13 20 11C20 5 16 2 12 2Z" />
        </Svg>
      );
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  cardContainer: {
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
  },
  disabledCard: {
    opacity: 0.6,
  },
  topLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  bottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Card; 