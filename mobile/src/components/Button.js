import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  View
} from 'react-native';

const Button = ({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  loading = false,
  disabled = false,
  primary = true
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        primary ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text 
          style={[
            styles.buttonText, 
            primary ? styles.primaryText : styles.secondaryText,
            disabled && styles.disabledText,
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: '#4E56F6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4E56F6',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    borderColor: '#CCCCCC',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#4E56F6',
  },
  disabledText: {
    color: '#888888',
  },
});

export default Button; 