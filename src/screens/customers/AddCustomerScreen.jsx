// screens/customers/AddCustomerScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../../store/authStore";
import useCustomerStore from "../../store/customerStore";
import { useThemeStore } from "../../store/themeStore";

const AddCustomerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const { createCustomer, updateCustomer, getCustomer } = useCustomerStore();
  const { isDarkMode } = useThemeStore();

  const customerId = route.params?.customerId;
  const editingCustomer = route.params?.customer;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customerId && editingCustomer) {
      loadCustomerData(editingCustomer);
    } else if (customerId) {
      fetchCustomerData(customerId);
    }
  }, [customerId, editingCustomer]);

  const fetchCustomerData = async (id) => {
    setLoading(true);
    try {
      const customer = await getCustomer(id);
      if (customer) {
        loadCustomerData(customer);
      }
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load customer data" });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = (customer) => {
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      let result;
      if (customerId) {
        result = await updateCustomer(customerId, formData);
      } else {
        result = await createCustomer(formData);
      }
      
      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: customerId ? "Customer updated successfully" : "Customer created successfully",
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: result.error || "Failed to save customer",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An error occurred while saving",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading customer data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Name Field */}
          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Customer Name <Text className="text-red-500">*</Text>
            </Text>
            <View className={`flex-row items-center rounded-xl px-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} ${errors.name ? "border-red-500" : ""}`}>
              <Icon name="account" size={20} color="#9ca3af" />
              <TextInput
                className={`flex-1 ml-3 py-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter customer name"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
              />
            </View>
            {errors.name && <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>}
          </View>

          {/* Phone Field */}
          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Phone Number <Text className="text-red-500">*</Text>
            </Text>
            <View className={`flex-row items-center rounded-xl px-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} ${errors.phone ? "border-red-500" : ""}`}>
              <Icon name="phone" size={20} color="#9ca3af" />
              <TextInput
                className={`flex-1 ml-3 py-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter 10-digit phone number"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                keyboardType="phone-pad"
                maxLength={10}
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
              />
            </View>
            {errors.phone && <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>}
          </View>

          {/* Email Field */}
          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Email Address <Text className="text-gray-400">(Optional)</Text>
            </Text>
            <View className={`flex-row items-center rounded-xl px-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} ${errors.email ? "border-red-500" : ""}`}>
              <Icon name="email" size={20} color="#9ca3af" />
              <TextInput
                className={`flex-1 ml-3 py-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter email address"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
              />
            </View>
            {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>}
          </View>

          {/* Address Field */}
          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Address <Text className="text-red-500">*</Text>
            </Text>
            <View className={`flex-row items-center rounded-xl px-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} ${errors.address ? "border-red-500" : ""}`}>
              <Icon name="map-marker" size={20} color="#9ca3af" />
              <TextInput
                className={`flex-1 ml-3 py-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter street address"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.address}
                onChangeText={(value) => handleInputChange("address", value)}
              />
            </View>
            {errors.address && <Text className="text-red-500 text-xs mt-1">{errors.address}</Text>}
          </View>

          {/* City Field */}
          <View className="mb-6">
            <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              City <Text className="text-gray-400">(Optional)</Text>
            </Text>
            <View className={`flex-row items-center rounded-xl px-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <Icon name="city" size={20} color="#9ca3af" />
              <TextInput
                className={`flex-1 ml-3 py-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter city"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.city}
                onChangeText={(value) => handleInputChange("city", value)}
              />
            </View>
          </View>

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <View className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-xl">
              <Text className="text-red-600 dark:text-red-400 font-semibold mb-2">Please fix the following errors:</Text>
              {Object.entries(errors).map(([field, message]) => (
                <Text key={field} className="text-red-600 dark:text-red-400 text-sm">• {message}</Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className={`p-4 ${isDarkMode ? "bg-gray-900" : "bg-white"} border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
        <LinearGradient colors={["#3b82f6", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-xl">
          <TouchableOpacity onPress={handleSubmit} disabled={submitting} className="py-4 items-center">
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                {customerId ? "Update Customer" : "Create Customer"}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddCustomerScreen;