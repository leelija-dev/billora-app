// components/auth/LoginForm.js
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../store/themeStore';

const LoginForm = ({ onSubmit, loading, error }) => {
  const { isDarkMode } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (emailValue) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailValue) return 'Email is required';
    if (!emailRegex.test(emailValue)) return 'Invalid email address';
    return '';
  };

  const validatePassword = (passwordValue) => {
    if (!passwordValue) return 'Password is required';
    if (passwordValue.length < 6) return 'Password must be at least 6 characters';
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

  const handleSubmit = () => {
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);
    
    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);
    
    if (!emailValidationError && !passwordValidationError) {
      onSubmit?.({ email, password });
    }
  };

  const isFormValid = email && password && !emailError && !passwordError;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
      marginTop: Platform.OS === 'ios' ? 20 : 40,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: '#6366F1',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
      color: isDarkMode ? '#E5E7EB' : '#374151',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      borderColor: emailError || passwordError ? '#EF4444' : (isDarkMode ? '#374151' : '#E5E7EB'),
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    },
    inputIcon: {
      paddingLeft: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      fontSize: 16,
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
    },
    eyeButton: {
      paddingRight: 12,
    },
    errorText: {
      fontSize: 12,
      color: '#EF4444',
      marginTop: 4,
      marginLeft: 4,
    },
    loginButton: {
      backgroundColor: '#6366F1',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 20,
      opacity: isFormValid && !loading ? 1 : 0.6,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: '#FEE2E2',
      borderWidth: 1,
      borderColor: '#EF4444',
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
    },
    errorMessage: {
      color: '#DC2626',
      fontSize: 14,
      textAlign: 'center',
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Title */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Icon name="storefront" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Icon name="email-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!loading}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Icon name="lock-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={handlePasswordBlur}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleSubmit}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginForm;