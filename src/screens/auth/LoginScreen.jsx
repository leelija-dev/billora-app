import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginForm from '../../components/auth/LoginForm';
import Loading from '../../components/common/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useAuth();
  const theme = useTheme();
  const [error, setError] = useState(null);

  const handleLogin = async (credentials) => {
    try {
      setError(null);
      await login(credentials);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleRegisterPress = () => {
    navigation.navigate('Register');
  };

  const handleForgotPasswordPress = () => {
    navigation.navigate('ForgotPassword');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    footer: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    registerText: {
      ...theme.typography.body2,
      color: theme.colors.textSecondary,
    },
    registerLink: {
      ...theme.typography.body2,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    forgotPassword: {
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    forgotPasswordText: {
      ...theme.typography.body2,
      color: theme.colors.primary,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading text="Logging in..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LoginForm
        onSubmit={handleLogin}
        loading={isLoading}
        error={error}
      />
      <View style={styles.footer}>
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleRegisterPress}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={handleForgotPasswordPress}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;