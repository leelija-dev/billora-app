// api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get the correct base URL for React Native
const getBaseUrl = () => {
  // First check if we have a custom URL from environment
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.log('Using custom API URL from env:', process.env.EXPO_PUBLIC_API_BASE_URL);
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // For local development
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access localhost
    return 'http://10.0.2.2:8000/api';
  } else if (Platform.OS === 'ios') {
    // iOS simulator uses localhost
    return 'http://localhost:8000/api';
  }
  
  // For physical devices, use your computer's IP address
  // Run `ipconfig` on Windows or `ifconfig` on Mac/Linux to find your IP
  // return 'http://192.168.1.100:8000/api';
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getBaseUrl();

console.log('🚀 API Base URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to false for token-based auth
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
    });

    // Try to get token from AsyncStorage
    try {
      const authStorage = await AsyncStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        const token = parsed.state?.token || parsed.token;
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Token added to request');
        }
      }
      
      // Also check for direct token
      const directToken = await AsyncStorage.getItem('auth_token');
      if (directToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${directToken}`;
        console.log('🔐 Direct token added to request');
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }

    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized, clearing auth...');
      await AsyncStorage.removeItem('auth-storage');
      await AsyncStorage.removeItem('auth_token');
    }

    // Return a structured error
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    };
  }
);

export default apiClient;