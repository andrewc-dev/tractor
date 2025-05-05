// Utility functions to work with localStorage instead of AsyncStorage from React Native

export const saveItem = (key, value) => {
  try {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
    return true;
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    return false;
  }
};

export const getItem = (key) => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    
    // Try to parse as JSON, but return the raw string if it fails
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  } catch (error) {
    console.error('Error retrieving data from localStorage:', error);
    return null;
  }
};

export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing data from localStorage:', error);
    return false;
  }
};

export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

export default {
  saveItem,
  getItem,
  removeItem,
  clearStorage
}; 