import { useState, useEffect } from 'react';
import { authAPI } from '../api';
import { authStorage } from '../utils/storage';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser, isAuthenticated, setIsAuthenticated } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await authStorage.getAuthToken();
      const storedUser = await authStorage.getUser();
      
      if (token && storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(credentials.email, credentials.password);
      
      console.log('Login response:', response);
      console.log('Login response data:', response.data);
      
      // Check different possible response structures
      const { user: userData, token } = response.data;
      
      console.log('Extracted user:', userData);
      console.log('Extracted token:', token);
      
      if (!token) {
        console.error('No token found in login response');
        throw new Error('No token received from server');
      }
      
      await authStorage.setAuthToken(token);
      console.log('Token stored successfully');
      
      await authStorage.setUser(userData);
      console.log('User stored successfully');
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      console.log('useAuth register called with:', userData);
      const response = await authAPI.register({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        city: userData.city,
        state: userData.state,
        country: userData.country,
        pincode: userData.pincode,
        companyName: userData.companyName,
        gstNumber: userData.gstNumber,
        address: userData.address,
        created_by: userData.created_by,
      });
      
      // Backend response structure: { data: { user_data }, message: "User Created Successfully", status: true }
      const newUser = response.data.data;
      
      // For registration, user needs to login separately to get token
      // So we don't set auth state here, just return the response
      console.log('Registration successful:', response.data);
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const userId = await authStorage.getUserId();
      if (userId) {
        await authAPI.logout(userId);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await authStorage.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setIsLoading(true);
      const response = await authAPI.forgotPassword(email);
      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setIsLoading(true);
      const response = await authAPI.resetPassword(token, newPassword);
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    try {
      setIsLoading(true);
      const userId = user?.id;
      if (!userId) {
        throw new Error('User not found');
      }
      
      const response = await authAPI.updateProfile(userId, userData);
      await authStorage.setUser(response.data.user);
      setUser(response.data.user);
      
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = await authStorage.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      const response = await authAPI.refreshToken();
      const { token: newToken, refreshToken: newRefreshToken } = response;
      
      await authStorage.setAuthToken(newToken);
      if (newRefreshToken) {
        await authStorage.setRefreshToken(newRefreshToken);
      }
      
      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      throw error;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshToken,
  };
};