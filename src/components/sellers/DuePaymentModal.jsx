// components/sellers/DuePaymentModal.jsx - FIXED

import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import Toast from "react-native-toast-message";

const DuePaymentModal = ({ 
  seller, 
  isOpen, 
  onClose, 
  onSuccess, 
  processing = false 
}) => {
  const { isDarkMode } = useThemeStore();
  const [paidAmount, setPaidAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && seller) {
      setPaidAmount("");
      setErrors({});
      setTouched(false);
      setIsSubmitting(false);
    }
  }, [isOpen, seller]);

  if (!isOpen || !seller) return null;

  const dueAmount = parseFloat(seller.due_amount) || 0;

  const handleAmountChange = (value) => {
    // Allow only digits and decimal
    let cleaned = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const decimalCount = (cleaned.match(/\./g) || []).length;
    if (decimalCount > 1) {
      cleaned = cleaned.slice(0, cleaned.lastIndexOf('.'));
    }
    
    // Limit to 2 decimal places
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts[1] && parts[1].length > 2) {
        cleaned = parts[0] + '.' + parts[1].slice(0, 2);
      }
    }
    
    setPaidAmount(cleaned);
    setTouched(true);
    
    // Validate
    const numericValue = parseFloat(cleaned);
    if (cleaned && !isNaN(numericValue) && numericValue > dueAmount && dueAmount > 0) {
      setErrors({
        paidAmount: `Amount cannot exceed due amount (₹${dueAmount.toFixed(2)})`
      });
    } else {
      const newErrors = { ...errors };
      delete newErrors.paidAmount;
      setErrors(newErrors);
    }
  };

  const handleMaxPayment = () => {
    setPaidAmount(dueAmount.toFixed(2));
    const newErrors = { ...errors };
    delete newErrors.paidAmount;
    setErrors(newErrors);
    setTouched(true);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!paidAmount) {
      newErrors.paidAmount = 'Please enter an amount';
    } else {
      const numericValue = parseFloat(paidAmount);
      if (isNaN(numericValue) || numericValue <= 0) {
        newErrors.paidAmount = 'Please enter a valid amount greater than 0';
      } else if (numericValue > dueAmount) {
        newErrors.paidAmount = `Amount cannot exceed due amount (₹${dueAmount.toFixed(2)})`;
      }
    }
    
    setErrors(newErrors);
    setTouched(true);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FIXED: Properly handle submit and call onSuccess
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const amount = parseFloat(paidAmount);
    if (isNaN(amount) || amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid amount',
      });
      return;
    }
    
    console.log("💰 Submitting payment of:", amount);
    setIsSubmitting(true);
    
    try {
      if (onSuccess) {
        // Call onSuccess with the amount and wait for it to complete
        await onSuccess(amount);
        // The parent will handle closing the modal
      } else {
        console.warn("⚠️ onSuccess callback not provided");
        // If no onSuccess, close modal ourselves
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Payment failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close handler - reset state
  const handleClose = () => {
    setPaidAmount("");
    setErrors({});
    setTouched(false);
    setIsSubmitting(false);
    if (onClose) {
      onClose();
    }
  };

  const numericValue = parseFloat(paidAmount) || 0;
  const remainingAmount = dueAmount - numericValue;
  const isValid = paidAmount && !errors.paidAmount && numericValue > 0 && numericValue <= dueAmount;

  const isProcessing = processing || isSubmitting;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/50 justify-end"
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={handleClose}
        >
          <View
            className={`rounded-t-3xl p-6 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Header */}
            <View className="items-center mb-4">
              <View
                className={`w-12 h-1 rounded-full ${
                  isDarkMode ? "bg-gray-600" : "bg-gray-300"
                }`}
              />
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl items-center justify-center mr-3">
                  <Icon name="currency-inr" size={20} color="#16a34a" />
                </View>
                <View>
                  <Text className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Due Payment
                  </Text>
                  <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {seller.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <Icon name="close" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Seller Info */}
              <View
                className={`p-4 rounded-xl mb-4 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <View className="flex-row justify-between items-center py-1">
                  <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Total Due
                  </Text>
                  <Text className={`text-lg font-bold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                    ₹{dueAmount.toFixed(2)}
                  </Text>
                </View>
                {dueAmount > 0 && (
                  <View className="flex-row justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                    <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Maximum amount allowed
                    </Text>
                    <Text className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      ₹{dueAmount.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Amount Input */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                  Payment Amount <Text className="text-red-500">*</Text>
                </Text>
                <View className="relative">
                  <View className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <Icon name="currency-inr" size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                  </View>
                  <TextInput
                    ref={inputRef}
                    className={`border rounded-xl px-4 py-3 pl-10 text-base ${
                      errors.paidAmount && touched
                        ? "border-red-500"
                        : isDarkMode
                        ? "border-gray-600 text-white bg-gray-700"
                        : "border-gray-300 text-gray-800 bg-gray-50"
                    }`}
                    placeholder="Enter amount"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                    keyboardType="numeric"
                    value={paidAmount}
                    onChangeText={handleAmountChange}
                    editable={!isProcessing && dueAmount > 0}
                    autoFocus
                  />
                </View>
                {errors.paidAmount && touched && (
                  <Text className="mt-1 text-xs text-red-500">
                    {errors.paidAmount}
                  </Text>
                )}
                {dueAmount > 0 && (
                  <View className="mt-2 flex-row items-center space-x-3">
                    <TouchableOpacity
                      onPress={handleMaxPayment}
                      disabled={isProcessing}
                      className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30"
                    >
                      <Text className="text-xs text-blue-600 dark:text-blue-400">
                        Pay full amount (₹{dueAmount.toFixed(2)})
                      </Text>
                    </TouchableOpacity>
                    {paidAmount && !errors.paidAmount && numericValue > 0 && (
                      <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Remaining: ₹{remainingAmount.toFixed(2)}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Summary */}
              <View className="flex-row justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 mb-4">
                <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {dueAmount > 0 ? (
                    <Text>
                      Remaining after payment:{' '}
                      <Text className={`font-medium ${remainingAmount < 0 ? "text-red-500" : ""}`}>
                        ₹{remainingAmount.toFixed(2)}
                      </Text>
                    </Text>
                  ) : (
                    <Text className="text-green-600 dark:text-green-400">
                      No pending dues
                    </Text>
                  )}
                </Text>
                {isValid && (
                  <View className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Text className="text-xs text-green-600 dark:text-green-400">
                      ✓ Valid amount
                    </Text>
                  </View>
                )}
              </View>

              {/* Buttons */}
              <View className="flex-row space-x-3 pt-2">
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={isProcessing}
                  className={`flex-1 py-3 rounded-xl border ${
                    isDarkMode ? "border-gray-600" : "border-gray-300"
                  }`}
                >
                  <Text className={`text-center font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isProcessing || dueAmount <= 0 || !paidAmount || !isValid}
                  className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                    isProcessing || dueAmount <= 0 || !paidAmount || !isValid
                      ? "bg-gray-400"
                      : "bg-blue-500"
                  }`}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="check" size={18} color="#FFFFFF" />
                      <Text className="text-white font-semibold ml-2">
                        Process Payment
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DuePaymentModal;