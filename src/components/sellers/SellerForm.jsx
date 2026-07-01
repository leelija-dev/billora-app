// components/sellers/SellerForm.js
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { useThemeStore } from "../../store/themeStore";

const SellerForm = ({ 
  seller = null, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  isEdit = false 
}) => {
  const { isDarkMode } = useThemeStore();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gst_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    due_amount: "0",
  });
  
  const [errors, setErrors] = useState({});

  // Pre-fill form if editing
  useEffect(() => {
    if (seller && isEdit) {
      setFormData({
        name: seller.name || "",
        email: seller.email || "",
        phone: seller.phone || "",
        gst_number: seller.gst_number || "",
        address: seller.address || "",
        city: seller.city || "",
        state: seller.state || "",
        pincode: seller.pincode || "",
        due_amount: seller.due_amount ? seller.due_amount.toString() : "0",
      });
    }
  }, [seller, isEdit]);

  const handleChange = (field, value) => {
    // Apply input masks
    if (field === "phone") {
      value = value.replace(/[^0-9]/g, "").slice(0, 10);
    }
    if (field === "pincode") {
      value = value.replace(/[^0-9]/g, "").slice(0, 6);
    }
    if (field === "gst_number") {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
    }
    if (field === "city" || field === "state") {
      value = value.replace(/[^A-Za-z\s\-]/g, "");
    }
    if (field === "due_amount") {
      value = value.replace(/[^0-9.]/g, "");
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Seller name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Seller name must be at least 2 characters";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }
    
    if (formData.gst_number && !/^[0-9A-Z]{15}$/.test(formData.gst_number)) {
      newErrors.gst_number = "GST number must be 15 characters (alphanumeric)";
    }
    
    if (formData.due_amount && parseFloat(formData.due_amount) < 0) {
      newErrors.due_amount = "Due amount cannot be negative";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fix the errors before submitting",
      });
      return;
    }
    
    const submitData = {
      ...formData,
      due_amount: parseFloat(formData.due_amount) || 0,
    };
    
    await onSubmit(submitData);
  };

  return (
    <ScrollView className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#3b82f6", "#2563eb"]}
        className="px-6 pt-12 pb-6"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              {isEdit ? "Edit Seller" : "Add New Seller"}
            </Text>
            <Text className="text-white/80 text-sm mt-1">
              {isEdit ? "Update seller information" : "Enter seller details to register new supplier"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onCancel}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Icon name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Form Body */}
      <View className="p-4">
        {/* Seller Name */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Seller Name <Text className="text-red-500">*</Text>
          </Text>
          <View className={`flex-row items-center rounded-xl border ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <Icon name="account" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
            <TextInput
              className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
              placeholder="Enter seller name"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={formData.name}
              onChangeText={(value) => handleChange("name", value)}
            />
          </View>
          {errors.name && (
            <View className="flex-row items-center mt-1">
              <Icon name="alert-circle" size={14} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">{errors.name}</Text>
            </View>
          )}
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Email
          </Text>
          <View className={`flex-row items-center rounded-xl border ${errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <Icon name="email" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
            <TextInput
              className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
              placeholder="Enter email address"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={formData.email}
              onChangeText={(value) => handleChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && (
            <View className="flex-row items-center mt-1">
              <Icon name="alert-circle" size={14} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">{errors.email}</Text>
            </View>
          )}
        </View>

        {/* Phone Number */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Phone Number
          </Text>
          <View className={`flex-row items-center rounded-xl border ${errors.phone ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <Icon name="phone" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
            <TextInput
              className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
              placeholder="Enter 10-digit phone number"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={formData.phone}
              onChangeText={(value) => handleChange("phone", value)}
              keyboardType="phone-pad"
            />
          </View>
          {errors.phone && (
            <View className="flex-row items-center mt-1">
              <Icon name="alert-circle" size={14} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">{errors.phone}</Text>
            </View>
          )}
        </View>

        {/* Address */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Address <Text className="text-red-500">*</Text>
          </Text>
          <View className={`flex-row items-start rounded-xl border ${errors.address ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <Icon name="map-marker" size={20} color="#9ca3af" style={{ marginLeft: 12, marginTop: 12 }} />
            <TextInput
              className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
              placeholder="Enter seller address"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={formData.address}
              onChangeText={(value) => handleChange("address", value)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
          {errors.address && (
            <View className="flex-row items-center mt-1">
              <Icon name="alert-circle" size={14} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">{errors.address}</Text>
            </View>
          )}
        </View>

        {/* City and State Row */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              City <Text className="text-red-500">*</Text>
            </Text>
            <View className={`flex-row items-center rounded-xl border ${errors.city ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <Icon name="city" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
              <TextInput
                className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter city"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                value={formData.city}
                onChangeText={(value) => handleChange("city", value)}
              />
            </View>
            {errors.city && (
              <View className="flex-row items-center mt-1">
                <Icon name="alert-circle" size={14} color="#ef4444" />
                <Text className="text-red-500 text-xs ml-1">{errors.city}</Text>
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              State <Text className="text-red-500">*</Text>
            </Text>
            <View className={`flex-row items-center rounded-xl border ${errors.state ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <Icon name="state-machine" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
              <TextInput
                className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter state"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                value={formData.state}
                onChangeText={(value) => handleChange("state", value)}
              />
            </View>
            {errors.state && (
              <View className="flex-row items-center mt-1">
                <Icon name="alert-circle" size={14} color="#ef4444" />
                <Text className="text-red-500 text-xs ml-1">{errors.state}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pincode and GST Row */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Pincode <Text className="text-red-500">*</Text>
            </Text>
            <View className={`flex-row items-center rounded-xl border ${errors.pincode ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <Icon name="mailbox" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
              <TextInput
                className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                value={formData.pincode}
                onChangeText={(value) => handleChange("pincode", value)}
                keyboardType="numeric"
              />
            </View>
            {errors.pincode && (
              <View className="flex-row items-center mt-1">
                <Icon name="alert-circle" size={14} color="#ef4444" />
                <Text className="text-red-500 text-xs ml-1">{errors.pincode}</Text>
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              GST Number
            </Text>
            <View className={`flex-row items-center rounded-xl border ${errors.gst_number ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <Icon name="barcode" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
              <TextInput
                className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter GST number"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                value={formData.gst_number}
                onChangeText={(value) => handleChange("gst_number", value)}
                autoCapitalize="characters"
              />
            </View>
            {errors.gst_number && (
              <View className="flex-row items-center mt-1">
                <Icon name="alert-circle" size={14} color="#ef4444" />
                <Text className="text-red-500 text-xs ml-1">{errors.gst_number}</Text>
              </View>
            )}
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Format: 15 characters (e.g., 27ABCDE1234F2Z5)
            </Text>
          </View>
        </View>

        {/* Due Amount */}
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Due Amount (₹) {isEdit && <Text className="text-gray-500 text-xs">(Read-only)</Text>}
          </Text>
          <View className={`flex-row items-center rounded-xl border ${errors.due_amount ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"} ${isEdit ? "bg-gray-100 dark:bg-gray-700" : ""}`}>
            <Icon name="currency-inr" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
            <TextInput
              className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"} ${isEdit ? "text-gray-500" : ""}`}
              placeholder="Enter initial due amount"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={formData.due_amount}
              keyboardType="numeric"
              onChangeText={(value) => handleChange("due_amount", value)}
              editable={!isEdit}
            />
            {isEdit && (
              <Icon name="lock" size={16} color="#9ca3af" style={{ marginRight: 12 }} />
            )}
          </View>
          {errors.due_amount && (
            <View className="flex-row items-center mt-1">
              <Icon name="alert-circle" size={14} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">{errors.due_amount}</Text>
            </View>
          )}
          <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            {isEdit ? "Due amount can only be updated through payment" : "Initial outstanding amount for this seller"}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-4 mb-8">
          <TouchableOpacity
            onPress={onCancel}
            className={`flex-1 py-4 rounded-xl items-center border ${
              isDarkMode ? "border-gray-700" : "border-gray-300"
            }`}
            disabled={isSubmitting}
          >
            <Text className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-blue-500 py-4 rounded-xl items-center flex-row justify-center"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Icon name="content-save" size={20} color="#ffffff" />
                <Text className="text-white font-semibold ml-2">
                  {isEdit ? "Update Seller" : "Register Seller"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default SellerForm;
