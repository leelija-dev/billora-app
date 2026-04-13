// Mock authentication data and functions
import AsyncStorage from '@react-native-async-storage/async-storage';

let mockUsers = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@mobilesaaserp.com',
    phone: '+1234567890',
    password: 'demo123', // In real app, this would be hashed
    company_name: 'Demo Company',
    gst_number: 'GST123456',
    address: '123 Demo Street',
    city: 'Demo City',
    state: 'Demo State',
    country: 'Demo Country',
    pincode: '123456',
    created_at: new Date().toISOString(),
    is_active: true,
  },
];

const mockAuth = {
  post: async (endpoint, data) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    switch (endpoint) {
      case '/users/store':
        // Check if email already exists
        if (mockUsers.find(user => user.email === data.email)) {
          throw {
            response: {
              data: { message: 'Email already exists' }
            }
          };
        }

        const newUser = {
          id: mockUsers.length + 1,
          ...data,
          created_at: new Date().toISOString(),
          is_active: true,
        };

        mockUsers.push(newUser);
        
        return {
          data: {
            success: true,
            message: 'User registered successfully',
            user: { ...newUser, password: undefined }, // Remove password from response
            token: `mock-token-${newUser.id}`,
          }
        };

      case '/users/login':
        const user = mockUsers.find(u => u.email === data.email && u.password === data.password);
        
        if (!user) {
          throw {
            response: {
              data: { message: 'Invalid credentials' }
            }
          };
        }

        // Store auth token
        await AsyncStorage.setItem('authToken', `mock-token-${user.id}`);
        await AsyncStorage.setItem('userId', user.id.toString());

        return {
          data: {
            success: true,
            message: 'Login successful',
            user: { ...user, password: undefined },
            token: `mock-token-${user.id}`,
          }
        };

      case '/users/logout':
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
        
        return {
          data: {
            success: true,
            message: 'Logout successful',
          }
        };

      case '/auth/forgot-password':
        // Simulate sending reset email
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
          data: {
            success: true,
            message: 'Password reset email sent successfully',
          }
        };

      case '/auth/reset-password':
        // Simulate password reset
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return {
          data: {
            success: true,
            message: 'Password reset successfully',
          }
        };

      default:
        throw {
          response: {
            data: { message: 'Endpoint not found' }
          }
        };
    }
  },

  get: async (endpoint) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const userId = parseInt(endpoint.split('/')[2]);
    const user = mockUsers.find(u => u.id === userId);

    if (!user) {
      throw {
        response: {
          data: { message: 'User not found' }
        }
      };
    }

    return {
      data: {
        success: true,
        user: { ...user, password: undefined },
      }
    };
  },

  put: async (endpoint, data) => {
    await new Promise(resolve => setTimeout(resolve, 400));

    const userId = parseInt(endpoint.split('/')[2]);
    const userIndex = mockUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw {
        response: {
          data: { message: 'User not found' }
        }
      };
    }

    mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };

    return {
      data: {
        success: true,
        message: 'User updated successfully',
        user: { ...mockUsers[userIndex], password: undefined },
      }
    };
  },
};

export { mockAuth };
