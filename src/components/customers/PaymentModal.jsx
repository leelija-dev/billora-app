// components/customers/PaymentModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const PaymentModal = ({
  visible,
  customer,
  onClose,
  onSubmit,
  loading,
  isDarkMode,
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setPaymentAmount('');
      setPaymentError('');
      setIsSubmitting(false);
    }
  }, [visible]);

  if (!customer) return null;

  const dueAmount = parseFloat(customer.due_amount || 0);

  const validatePaymentAmount = (amount) => {
    if (!amount || amount === '') {
      return 'Payment amount is required';
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return 'Please enter a valid number';
    }
    if (numAmount <= 0) {
      return 'Payment amount must be greater than zero';
    }
    if (numAmount > dueAmount) {
      return `Payment amount cannot exceed due amount of ₹${dueAmount.toFixed(2)}`;
    }
    return '';
  };

  const handleAmountChange = (text) => {
    // Allow only numbers and decimal point
    let value = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setPaymentAmount(value);
    
    // Validate on change
    const error = validatePaymentAmount(value);
    setPaymentError(error);
  };

  const handlePayFullAmount = () => {
    const maxAmount = dueAmount.toString();
    setPaymentAmount(maxAmount);
    setPaymentError('');
  };

  const handleSubmit = async () => {
    const error = validatePaymentAmount(paymentAmount);
    if (error) {
      setPaymentError(error);
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > dueAmount) {
      const errorMsg = `Payment amount cannot exceed due amount of ₹${dueAmount.toFixed(2)}`;
      setPaymentError(errorMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(amount);
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className={`w-full max-w-sm rounded-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {/* Header with Gradient */}
              <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                className="p-5 items-center"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3">
                  <Icon name="credit-card" size={32} color="#ffffff" />
                </View>
                <Text className="text-white text-xl font-bold">Make Payment</Text>
                <Text className="text-white/80 text-sm text-center mt-1">
                  Customer: {customer.name}
                </Text>
              </LinearGradient>

              {/* Body */}
              <View className="p-5">
                {/* Due Amount Display */}
                <View className={`p-4 rounded-xl mb-4 ${dueAmount > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                  <Text className={`text-sm text-center ${dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    Current Due Amount
                  </Text>
                  <Text className={`text-2xl font-bold text-center mt-1 ${dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    ₹{dueAmount.toFixed(2)}
                  </Text>
                </View>

                {/* Amount Input */}
                <View className="mb-4">
                  <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Payment Amount
                  </Text>
                  <View className={`flex-row items-center rounded-xl border ${paymentError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Text className="text-lg ml-3 text-gray-500">₹</Text>
                    <TextInput
                      className={`flex-1 p-3 text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                      placeholder="Enter amount"
                      placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9ca3af'}
                      value={paymentAmount}
                      onChangeText={handleAmountChange}
                      keyboardType="decimal-pad"
                      editable={!isSubmitting && !loading}
                    />
                  </View>
                  {paymentError ? (
                    <View className="flex-row items-center mt-1">
                      <Icon name="alert-circle" size={14} color="#ef4444" />
                      <Text className="text-red-500 text-xs ml-1">{paymentError}</Text>
                    </View>
                  ) : paymentAmount && parseFloat(paymentAmount) > 0 ? (
                    <View className="flex-row items-center mt-1">
                      <Icon name="check-circle" size={14} color="#10b981" />
                      <Text className="text-green-500 text-xs ml-1">Valid payment amount</Text>
                    </View>
                  ) : null}
                  
                  {/* Max allowed and pay full button */}
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Max allowed: ₹{dueAmount.toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={handlePayFullAmount}>
                      <Text className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        Pay Full Amount
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={onClose}
                    className={`flex-1 p-3 rounded-xl items-center border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
                    disabled={isSubmitting}
                  >
                    <Text className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={
                      !paymentAmount ||
                      parseFloat(paymentAmount) <= 0 ||
                      parseFloat(paymentAmount) > dueAmount ||
                      isSubmitting ||
                      loading
                    }
                    className={`flex-1 p-3 rounded-xl items-center ${(!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > dueAmount)
                      ? 'bg-gray-400'
                      : 'bg-purple-600'
                    }`}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text className="text-white font-medium">
                        Pay Now
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PaymentModal;