// screens/auth/LoginScreen.js
import { useState } from 'react';
import { StyleSheet, View, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import LoginForm from '../../components/auth/LoginForm';

const LoginScreen = () => {
  const { isDarkMode } = useThemeStore();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState(null);

  const handleLogin = async (credentials) => {
    setError(null);
    const result = await login(credentials.email, credentials.password);
    
    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.');
    }
    // No need to navigate - the AppNavigator will automatically show Main screen
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}
      />
      <LoginForm
        onSubmit={handleLogin}
        loading={isLoading}
        error={error}
      />
    </SafeAreaView>
  );
};

export default LoginScreen;