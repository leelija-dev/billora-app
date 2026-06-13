// components/customers/CustomerForm.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import useCustomerStore from '../../store/customerStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Validation functions based on desktop version
const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateGSTNumber = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

const validationRules = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s.-]+$/,
    message: 'Name can only contain letters, spaces, dots, and hyphens',
  },
  phone: {
    length: 10,
    pattern: /^\d{10}$/,
    message: 'Please enter a valid 10-digit phone number',
  },
  address: {
    maxLength: 500,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  city: {
    pattern: /^[a-zA-Z\s-]+$/,
    message: 'City can only contain letters, spaces, and hyphens',
  },
  gstNumber: {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    message: 'Please enter a valid GST number (15 characters)',
  },
};

const CustomerForm = ({ customerId, onSuccess }) => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { createCustomer, updateCustomer, getCustomer } = useCustomerStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    gst_number: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load customer data if editing
  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const customer = await getCustomer(customerId);
      if (customer) {
        setFormData({
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          gst_number: customer.gst_number || '',
          status: customer.status || 'active',
        });
      }
    } catch (error) {
      console.error('Failed to load customer:', error);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  // Validation functions (matching desktop version)
  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value || value.trim() === '') {
          return 'Customer name is required';
        }
        if (value.trim().length < validationRules.name.minLength) {
          return `Name must be at least ${validationRules.name.minLength} characters`;
        }
        if (value.trim().length > validationRules.name.maxLength) {
          return `Name cannot exceed ${validationRules.name.maxLength} characters`;
        }
        if (!validationRules.name.pattern.test(value)) {
          return validationRules.name.message;
        }
        return '';

      case 'phone':
        if (!value || value.trim() === '') {
          return 'Phone number is required';
        }
        if (!validatePhone(value)) {
          return validationRules.phone.message;
        }
        return '';

      case 'address':
        if (!value || value.trim()==='') {
          return 'Address is required';
        }
        if (value.length > validationRules.address.maxLength) {
          return `Address cannot exceed ${validationRules.address.maxLength} characters`;
        }
        return '';

      case 'email':
        if (value && value.trim() !== '' && !validateEmail(value)) {
          return validationRules.email.message;
        }
        return '';

      case 'city':
        if (value && value.trim() !== '' && !validationRules.city.pattern.test(value)) {
          return validationRules.city.message;
        }
        return '';

      case 'gst_number':
        if (value && value.trim() !== '' && !validateGSTNumber(value)) {
          return validationRules.gstNumber.message;
        }
        return '';

      default:
        return '';
    }
  };

  // Handle input changes with real-time validation
  const handleChange = (field, value) => {
    let processedValue = value;

    // Apply transformations based on field type
    if (field === 'name') {
      processedValue = value.replace(/[^a-zA-Z\s.-]/g, '');
    } else if (field === 'phone') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    } else if (field === 'gst_number') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    } else if (field === 'city') {
      processedValue = value.replace(/[^a-zA-Z\s-]/g, '');
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));

    const error = validateField(field, processedValue);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;

    const phoneError = validateField('phone', formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    const addressError = validateField('address', formData.address);
    if (addressError) newErrors.address = addressError;

    if (formData.email && formData.email.trim() !== '') {
      const emailError = validateField('email', formData.email);
      if (emailError) newErrors.email = emailError;
    }

    if (formData.city && formData.city.trim() !== '') {
      const cityError = validateField('city', formData.city);
      if (cityError) newErrors.city = cityError;
    }

    if (formData.gst_number && formData.gst_number.trim() !== '') {
      const gstError = validateField('gst_number', formData.gst_number);
      if (gstError) newErrors.gst_number = gstError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const allFields = ['name', 'phone', 'address', 'email', 'city', 'gst_number'];
    const touchedObj = {};
    allFields.forEach(field => {
      touchedObj[field] = true;
    });
    setTouched(touchedObj);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    // Clean up data before submitting - MATCH DESKTOP STRUCTURE
    const cleanData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      email: formData.email?.trim() || null,
      city: formData.city?.trim() || null,
      gst_number: formData.gst_number?.trim() || null,
      status: formData.status,
    };

    console.log('📝 Submitting customer data:', cleanData);

    try {
      let result;
      if (customerId) {
        result = await updateCustomer(customerId, cleanData);
      } else {
        result = await createCustomer(cleanData);
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || 'Failed to save customer');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'An error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading customer data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
      {/* Name Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Full Name <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } ${errors.name && touched.name ? 'border-red-500' : ''}`}>
          <Icon name="account" size={20} color="#9ca3af" />
          <TextInput
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            onBlur={() => handleBlur('name')}
            placeholder="Enter customer's full name"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            className={`flex-1 ml-3 py-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          />
        </View>
        {errors.name && touched.name && (
          <View className="flex-row items-center mt-1">
            <Icon name="alert-circle" size={14} color="#ef4444" />
            <Text className="text-red-500 text-xs ml-1">{errors.name}</Text>
          </View>
        )}
        {!errors.name && touched.name && formData.name && (
          <View className="flex-row items-center mt-1">
            <Icon name="check-circle" size={14} color="#22c55e" />
            <Text className="text-green-500 text-xs ml-1">✓ Valid name</Text>
          </View>
        )}
        <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Letters, spaces, dots, and hyphens only (2-100 characters)
        </Text>
      </View>

      {/* Phone Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Mobile Number <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } ${errors.phone && touched.phone ? 'border-red-500' : ''}`}>
          <Icon name="phone" size={20} color="#9ca3af" />
          <TextInput
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            onBlur={() => handleBlur('phone')}
            placeholder="Enter 10-digit mobile number"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            keyboardType="phone-pad"
            maxLength={10}
            className={`flex-1 ml-3 py-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          />
        </View>
        {errors.phone && touched.phone && (
          <View className="flex-row items-center mt-1">
            <Icon name="alert-circle" size={14} color="#ef4444" />
            <Text className="text-red-500 text-xs ml-1">{errors.phone}</Text>
          </View>
        )}
        {!errors.phone && touched.phone && formData.phone && formData.phone.length === 10 && (
          <View className="flex-row items-center mt-1">
            <Icon name="check-circle" size={14} color="#22c55e" />
            <Text className="text-green-500 text-xs ml-1">✓ Valid mobile number</Text>
          </View>
        )}
      </View>

      {/* Email Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Email Address <Text className="text-gray-400 text-xs">(Optional)</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } ${errors.email && touched.email ? 'border-red-500' : ''}`}>
          <Icon name="email" size={20} color="#9ca3af" />
          <TextInput
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            onBlur={() => handleBlur('email')}
            placeholder="customer@example.com"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            keyboardType="email-address"
            autoCapitalize="none"
            className={`flex-1 ml-3 py-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          />
        </View>
        {errors.email && touched.email && (
          <View className="flex-row items-center mt-1">
            <Icon name="alert-circle" size={14} color="#ef4444" />
            <Text className="text-red-500 text-xs ml-1">{errors.email}</Text>
          </View>
        )}
        {!errors.email && formData.email && validateEmail(formData.email) && (
          <View className="flex-row items-center mt-1">
            <Icon name="check-circle" size={14} color="#22c55e" />
            <Text className="text-green-500 text-xs ml-1">✓ Valid email address</Text>
          </View>
        )}
      </View>

      {/* Address Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Street Address <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row rounded-xl px-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } ${errors.address && touched.address ? 'border-red-500' : ''}`}>
          <Icon name="map-marker" size={20} color="#9ca3af" style={{ marginTop: 12 }} />
          <TextInput
            value={formData.address}
            onChangeText={(value) => handleChange('address', value)}
            onBlur={() => handleBlur('address')}
            placeholder="Street address"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className={`flex-1 ml-3 py-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          />
        </View>
        {errors.address && touched.address && (
          <View className="flex-row items-center mt-1">
            <Icon name="alert-circle" size={14} color="#ef4444" />
            <Text className="text-red-500 text-xs ml-1">{errors.address}</Text>
          </View>
        )}
        {!errors.address && touched.address && formData.address && (
          <View className="flex-row items-center mt-1">
            <Icon name="check-circle" size={14} color="#22c55e" />
            <Text className="text-green-500 text-xs ml-1">✓ Valid address</Text>
          </View>
        )}
      </View>

      {/* City Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          City <Text className="text-gray-400 text-xs">(Optional)</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } ${errors.city && touched.city ? 'border-red-500' : ''}`}>
          <Icon name="city" size={20} color="#9ca3af" />
          <TextInput
            value={formData.city}
            onChangeText={(value) => handleChange('city', value)}
            onBlur={() => handleBlur('city')}
            placeholder="City"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            className={`flex-1 ml-3 py-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          />
        </View>
        {errors.city && touched.city && (
          <View className="flex-row items-center mt-1">
            <Icon name="alert-circle" size={14} color="#ef4444" />
            <Text className="text-red-500 text-xs ml-1">{errors.city}</Text>
          </View>
        )}
        <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Only letters, spaces, and hyphens allowed
        </Text>
      </View>

      {/* GST Number Field */}
      <View className="mb-6">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          GST Number <Text className="text-gray-400 text-xs">(Optional)</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } ${errors.gst_number && touched.gst_number ? 'border-red-500' : ''}`}>
          <Icon name="ticket-percent" size={20} color="#9ca3af" />
          <TextInput
            value={formData.gst_number}
            onChangeText={(value) => handleChange('gst_number', value)}
            onBlur={() => handleBlur('gst_number')}
            placeholder="Enter GST number (e.g., 27ABCDE1234F2Z5)"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            autoCapitalize="characters"
            maxLength={15}
            className={`flex-1 ml-3 py-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          />
        </View>
        {errors.gst_number && touched.gst_number && (
          <View className="flex-row items-center mt-1">
            <Icon name="alert-circle" size={14} color="#ef4444" />
            <Text className="text-red-500 text-xs ml-1">{errors.gst_number}</Text>
          </View>
        )}
        <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Format: 15 characters (e.g., 27ABCDE1234F2Z5)
        </Text>
      </View>

      {/* Required Fields Indicator */}
      <View className="flex-row items-center mb-4">
        <Text className="text-red-500 text-sm mr-1">*</Text>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Required fields
        </Text>
      </View>

      {/* Validation Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <View className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-xl">
          <View className="flex-row items-start">
            <Icon name="alert-circle" size={20} color="#ef4444" />
            <Text className="text-red-600 dark:text-red-400 font-semibold ml-2 mb-2">
              Please fix the following errors:
            </Text>
          </View>
          {Object.entries(errors).map(([field, message]) => (
            <View key={field} className="flex-row items-center ml-6 mt-1">
              <Icon name="circle-small" size={16} color="#ef4444" />
              <Text className="text-red-600 dark:text-red-400 text-sm ml-1">
                {field === 'name' ? 'Name' :
                 field === 'phone' ? 'Mobile Number' :
                 field === 'address' ? 'Address' :
                 field === 'gst_number' ? 'GST Number' :
                 field.charAt(0).toUpperCase() + field.slice(1)}: {message}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Error Display */}
      {error && Object.keys(errors).length === 0 && (
        <View className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-xl">
          <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className={`bg-blue-500 py-4 rounded-xl mb-6 flex-row items-center justify-center ${
          submitting ? 'opacity-50' : ''
        }`}
      >
        {submitting ? (
          <>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text className="text-white text-center font-semibold text-base ml-2">
              Saving...
            </Text>
          </>
        ) : (
          <Text className="text-white text-center font-semibold text-base">
            {customerId ? 'Update Customer' : 'Create Customer'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CustomerForm;