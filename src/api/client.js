import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from '../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased from 10000 to 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await authStorage.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token added to request headers');
      } else {
        console.log('No token found in storage');
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      config: error.config,
    });
    
    if (error.response?.status === 401) {
      try {
        await authStorage.clearAuth();
        console.log('Auth tokens cleared due to 401 error');
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error Details:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
      });
      error.response = {
        data: { message: 'Network error. Please check your connection.' },
        status: 0,
      };
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;
