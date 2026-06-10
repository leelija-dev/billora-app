// src/components/auth/RegisterForm.jsx
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import Button from '../common/Button';
import Header from '../common/Header';
import Input from '../common/Input';

const RegisterForm = ({ onSubmit, loading, error, onLoginPress }) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [cityError, setCityError] = useState('');
  const [stateError, setStateError] = useState('');
  const [countryError, setCountryError] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Invalid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(password)) return 'Must contain lowercase letter';
    if (!/[A-Z]/.test(password)) return 'Must contain uppercase letter';
    if (!/\d/.test(password)) return 'Must contain number';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';
    if (!/^\d{10}$/.test(phone)) return 'Invalid phone number';
    return '';
  };

  const validateRequired = (value, fieldName) => {
    if (!value || value.trim() === '') return `${fieldName} is required`;
    return '';
  };

  const handleNameChange = (text) => {
    setName(text);
    setNameError('');
  };

  const handlePhoneChange = (text) => {
    setPhone(text);
    setPhoneError('');
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError('');
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setPasswordError('');
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    setConfirmPasswordError('');
  };

  const handleCompanyNameChange = (text) => {
    setCompanyName(text);
  };

  const handleGstNumberChange = (text) => {
    setGstNumber(text);
  };

  const handleAddressChange = (text) => {
    setAddress(text);
  };

  const handleCityChange = (text) => {
    setCity(text);
    setCityError('');
  };

  const handleStateChange = (text) => {
    setState(text);
    setStateError('');
  };

  const handleCountryChange = (text) => {
    setCountry(text);
    setCountryError('');
  };

  const handlePincodeChange = (text) => {
    setPincode(text);
    setPincodeError('');
  };

  const handleNameBlur = () => {
    setNameError(validateRequired(name, 'Name'));
  };

  const handlePhoneBlur = () => {
    setPhoneError(validatePhone(phone));
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleCityBlur = () => {
    setCityError(validateRequired(city, 'City'));
  };

  const handleStateBlur = () => {
    setStateError(validateRequired(state, 'State'));
  };

  const handleCountryBlur = () => {
    setCountryError(validateRequired(country, 'Country'));
  };

  const handlePincodeBlur = () => {
    setPincodeError(validateRequired(pincode, 'Pincode'));
  };

  const onFormSubmit = () => {
    const nameValidationError = validateRequired(name, 'Name');
    const emailValidationError = validateEmail(email);
    const phoneValidationError = validatePhone(phone);
    const passwordValidationError = validatePassword(password);
    const cityValidationError = validateRequired(city, 'City');
    const stateValidationError = validateRequired(state, 'State');
    const countryValidationError = validateRequired(country, 'Country');
    const pincodeValidationError = validateRequired(pincode, 'Pincode');
    const confirmPasswordValidationError = !confirmPassword ? 'Please confirm your password' : 
      (password !== confirmPassword ? 'Passwords do not match' : '');
    
    setNameError(nameValidationError);
    setEmailError(emailValidationError);
    setPhoneError(phoneValidationError);
    setPasswordError(passwordValidationError);
    setCityError(cityValidationError);
    setStateError(stateValidationError);
    setCountryError(countryValidationError);
    setPincodeError(pincodeValidationError);
    setConfirmPasswordError(confirmPasswordValidationError);
    
    if (!nameValidationError && !emailValidationError && !phoneValidationError && 
        !passwordValidationError && !confirmPasswordValidationError && !cityValidationError && 
        !stateValidationError && !countryValidationError && !pincodeValidationError) {
      onSubmit?.({ 
        name,
        email,
        phone,
        password,
        companyName,
        gstNumber,
        address,
        city,
        state,
        country,
        pincode,
        created_by: 1 // This should come from auth context
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['left', 'right']}>
      <Header title="Create Account" showBackButton={true} />
      <View style={{ flex: 1, padding: theme.spacing.lg }}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {/* Basic Information */}
            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: theme.colors.text, 
                marginBottom: theme.spacing.md 
              }}>
                Basic Information
              </Text>
              
              <Input
                label="Full Name"
                value={name}
                onChangeText={handleNameChange}
                onBlur={handleNameBlur}
                placeholder="Enter your full name"
                error={nameError}
                leftIcon="account-outline"
              />
              
              <Input
                label="Email Address"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="Enter your email"
                error={emailError}
                leftIcon="email-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Input
                label="Phone Number"
                value={phone}
                onChangeText={handlePhoneChange}
                onBlur={handlePhoneBlur}
                placeholder="Enter your phone number"
                error={phoneError}
                leftIcon="phone-outline"
                keyboardType="phone-pad"
                maxLength={10}
              />
              
              <Input
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                onBlur={handlePasswordBlur}
                placeholder="Create a password"
                error={passwordError}
                leftIcon="lock-outline"
                secureTextEntry
              />
              
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                placeholder="Confirm your password"
                error={confirmPasswordError}
                leftIcon="lock-outline"
                secureTextEntry
              />
            </View>

            {/* Company Information (Optional) */}
            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: theme.colors.text, 
                marginBottom: theme.spacing.md 
              }}>
                Company Information (Optional)
              </Text>
              
              <Input
                label="Company Name"
                value={companyName}
                onChangeText={handleCompanyNameChange}
                placeholder="Enter company name"
                leftIcon="office-building-outline"
              />
              
              <Input
                label="GST Number"
                value={gstNumber}
                onChangeText={handleGstNumberChange}
                placeholder="Enter GST number"
                leftIcon="receipt-outline"
              />
            </View>

            {/* Address Information */}
            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: theme.colors.text, 
                marginBottom: theme.spacing.md 
              }}>
                Address Information
              </Text>
              
              <Input
                label="Address"
                value={address}
                onChangeText={handleAddressChange}
                placeholder="Enter your address"
                leftIcon="map-marker-outline"
              />
              
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="City"
                    value={city}
                    onChangeText={handleCityChange}
                    onBlur={handleCityBlur}
                    placeholder="Enter city"
                    error={cityError}
                    leftIcon="home-city-outline"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="State"
                    value={state}
                    onChangeText={handleStateChange}
                    onBlur={handleStateBlur}
                    placeholder="Enter state"
                    error={stateError}
                    leftIcon="map-outline"
                  />
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Country"
                    value={country}
                    onChangeText={handleCountryChange}
                    onBlur={handleCountryBlur}
                    placeholder="Enter country"
                    error={countryError}
                    leftIcon="map-marker-outline"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Pincode"
                    value={pincode}
                    onChangeText={handlePincodeChange}
                    onBlur={handlePincodeBlur}
                    placeholder="Enter pincode"
                    error={pincodeError}
                    leftIcon="mailbox-outline"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {error && (
          <View style={{
            backgroundColor: theme.colors.error + '20',
            borderWidth: 1,
            borderColor: theme.colors.error,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
          }}>
            <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
              {error}
            </Text>
          </View>
        )}

        <Button
          title="Create Account"
          onPress={onFormSubmit}
          loading={loading}
          disabled={!name || !email || !phone || !password || !confirmPassword || !city || !state || !country || !pincode || loading}
          style={{ marginTop: theme.spacing.lg }}
        />

        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: theme.spacing.xl,
        }}>
          <Text style={{
            ...theme.typography.body2,
            color: theme.colors.textSecondary,
          }}>Already have an account? </Text>
          <TouchableOpacity onPress={onLoginPress}>
            <Text style={{
              ...theme.typography.body2,
              color: theme.colors.primary,
              fontWeight: '600',
            }}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RegisterForm;