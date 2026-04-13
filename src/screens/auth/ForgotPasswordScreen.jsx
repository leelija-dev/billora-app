import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';

const ForgotPasswordScreen = ({ navigation }) => {
  const { forgotPassword, isLoading } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Invalid email address';
    return '';
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError('');
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const onSubmit = async () => {
    const emailValidationError = validateEmail(email);
    setEmailError(emailValidationError);
    
    if (!emailValidationError) {
      try {
        setError(null);
        await forgotPassword(email);
        setSuccess(true);
      } catch (err) {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    form: {
      flex: 1,
      justifyContent: 'center',
    },
    description: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      lineHeight: 24,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '20',
      borderWidth: 1,
      borderColor: theme.colors.error,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    errorText: {
      ...theme.typography.body2,
      color: theme.colors.error,
      textAlign: 'center',
    },
    submitButton: {
      marginTop: theme.spacing.lg,
    },
    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    successIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.lg,
    },
    successTitle: {
      ...theme.typography.h2,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    successMessage: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      lineHeight: 24,
    },
    backButton: {
      marginTop: theme.spacing.lg,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading text="Sending reset email..." />
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Email Sent" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent password reset instructions to your email address.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              style={styles.backButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Reset Password" showBackButton onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.description}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <Input
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            error={emailError}
            leftIcon="email-outline"
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title="Send Reset Email"
            onPress={onSubmit}
            loading={isLoading}
            disabled={!email || isLoading}
            style={styles.submitButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;