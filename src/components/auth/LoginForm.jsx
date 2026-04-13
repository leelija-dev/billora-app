import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import Button from '../common/Button';
import Header from '../common/Header';
import Input from '../common/Input';

const LoginForm = ({ onSubmit, loading, error }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Invalid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError('');
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setPasswordError('');
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const onFormSubmit = () => {
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);
    
    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);
    
    if (!emailValidationError && !passwordValidationError) {
      onSubmit?.({ email, password });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['left', 'right']}>
      <Header title="Login" showBackButton={false} />
      <View style={{ flex: 1, padding: theme.spacing.lg }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Input
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            error={emailError}
            leftIcon="email-outline"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            onBlur={handlePasswordBlur}
            placeholder="Enter your password"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={onFormSubmit}
            error={passwordError}
            leftIcon="lock-outline"
          />

          {error && (
            <View style={{
              backgroundColor: theme.colors.error + '20',
              borderWidth: 1,
              borderColor: theme.colors.error,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}>
              <Text style={{
                ...theme.typography.body2,
                color: theme.colors.error,
                textAlign: 'center',
              }}>{error}</Text>
            </View>
          )}

          <Button
            title="Login"
            onPress={onFormSubmit}
            loading={loading}
            disabled={!email || !password || loading}
            style={{ marginTop: theme.spacing.lg }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginForm;