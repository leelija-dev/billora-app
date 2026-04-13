import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import RegisterForm from '../../components/auth/RegisterForm';
import Loading from '../../components/common/Loading';

const RegisterScreen = ({ navigation }) => {
  const { register, isLoading } = useAuth();
  const theme = useTheme();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (userData) => {
    try {
      setError(null);
      const response = await register(userData);
      
      // Registration successful - show success message
      setSuccess(true);
      
      // Auto-redirect to login after 2 seconds
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading text="Creating account..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {success ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: theme.colors.success, 
            textAlign: 'center',
            marginBottom: theme.spacing.md 
          }}>
            Registration Successful! 🎉
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: theme.colors.textSecondary, 
            textAlign: 'center' 
          }}>
            Redirecting to login...
          </Text>
        </View>
      ) : (
        <RegisterForm
          onSubmit={handleRegister}
          loading={isLoading}
          error={error}
          onLoginPress={handleLoginPress}
        />
      )}
    </SafeAreaView>
  );
};

export default RegisterScreen;