import apiClient from './client';


export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      console.log('Register API call:', {
        endpoint: '/users/register',
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: userData.password,
          city: userData.city,
          state: userData.state,
          country: userData.country,
          pincode: userData.pincode,
          company_name: userData.companyName || null,
          gst_number: userData.gstNumber || null,
          address: userData.address || null,
          created_by: userData.created_by || null,
        }
      });
      return await apiClient.post('/users/register', {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        company_name: userData.companyName || null,
        gst_number: userData.gstNumber || null,
        address: userData.address || null,
        city: userData.city,
        state: userData.state,
        country: userData.country,
        pincode: userData.pincode,
        created_by: userData.created_by || null,
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      return await apiClient.post('/users/login', {
        email,
        password,
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout user
  logout: async (userId) => {
    try {
      return await apiClient.post('/users/logout', {
        user_id: userId,
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get current user profile
  getProfile: async (userId) => {
    try {
      return await apiClient.get(`/users/edit/${userId}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user profile
  updateProfile: async (userId, userData) => {
    try {
      return await apiClient.put(`/users/update/${userId}`, userData);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update password
  updatePassword: async (userId, currentPassword, newPassword) => {
    try {
      return await apiClient.put(`/users/update-password/${userId}`, {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Legacy methods for backward compatibility
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
