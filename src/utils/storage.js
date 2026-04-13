import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

export const storage = {
  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Storage setItem error:', error);
      throw error;
    }
  },

  async getItem(key, defaultValue = null) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return defaultValue;
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
      throw error;
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  },

  async getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },

  async multiSet(keyValuePairs) {
    try {
      const jsonPairs = keyValuePairs.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(jsonPairs);
    } catch (error) {
      console.error('Storage multiSet error:', error);
      throw error;
    }
  },

  async multiGet(keys) {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      return pairs.map(([key, value]) => [
        key,
        value !== null ? JSON.parse(value) : null,
      ]);
    } catch (error) {
      console.error('Storage multiGet error:', error);
      return keys.map(key => [key, null]);
    }
  },

  async multiRemove(keys) {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Storage multiRemove error:', error);
      throw error;
    }
  },
};

export const authStorage = {
  async setAuthToken(token) {
    return storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async getAuthToken() {
    return storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async removeAuthToken() {
    return storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async setRefreshToken(token) {
    return storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken() {
    return storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async removeRefreshToken() {
    return storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async getUserId() {
    const user = await storage.getItem(STORAGE_KEYS.USER);
    return user ? user.id : null;
  },

  async setUser(user) {
    return storage.setItem(STORAGE_KEYS.USER, user);
  },

  async getUser() {
    return storage.getItem(STORAGE_KEYS.USER);
  },

  async removeUser() {
    return storage.removeItem(STORAGE_KEYS.USER);
  },

  async clearAuth() {
    const keys = [
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ];
    return storage.multiRemove(keys);
  },
};

export const appStorage = {
  async setTheme(theme) {
    return storage.setItem(STORAGE_KEYS.THEME, theme);
  },

  async getTheme() {
    return storage.getItem(STORAGE_KEYS.THEME, 'light');
  },

  async setLanguage(language) {
    return storage.setItem(STORAGE_KEYS.LANGUAGE, language);
  },

  async getLanguage() {
    return storage.getItem(STORAGE_KEYS.LANGUAGE, 'en');
  },

  async setOnboardingCompleted(completed) {
    return storage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  },

  async isOnboardingCompleted() {
    return storage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED, false);
  },
};

export default storage;
