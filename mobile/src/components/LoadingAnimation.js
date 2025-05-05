import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

const LoadingAnimation = ({ message = 'Loading...' }) => {
  const dot1Ref = useRef(null);
  const dot2Ref = useRef(null);
  const dot3Ref = useRef(null);

  useEffect(() => {
    const animateDots = () => {
      if (dot1Ref.current) {
        dot1Ref.current.animate([
          { 0: { scale: 1 }, 50: { scale: 1.5 }, 100: { scale: 1 } }
        ], 1200, 'ease-in-out');
      }
      
      setTimeout(() => {
        if (dot2Ref.current) {
          dot2Ref.current.animate([
            { 0: { scale: 1 }, 50: { scale: 1.5 }, 100: { scale: 1 } }
          ], 1200, 'ease-in-out');
        }
      }, 200);
      
      setTimeout(() => {
        if (dot3Ref.current) {
          dot3Ref.current.animate([
            { 0: { scale: 1 }, 50: { scale: 1.5 }, 100: { scale: 1 } }
          ], 1200, 'ease-in-out');
        }
      }, 400);
    };

    const interval = setInterval(animateDots, 1200);
    animateDots(); // Start immediately

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.dotsContainer}>
        <Animatable.View ref={dot1Ref} style={styles.dot} />
        <Animatable.View ref={dot2Ref} style={styles.dot} />
        <Animatable.View ref={dot3Ref} style={styles.dot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4E56F6',
    marginHorizontal: 4,
  },
});

export default LoadingAnimation; 