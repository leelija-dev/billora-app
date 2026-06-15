// components/stores/StoreForm.js
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

const StoreForm = ({ 
  store = null, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  isEdit = false 
}) => {
  const { isDarkMode } = useThemeStore();
  
  const [formData, setFormData] = useState({
    name: "",
    gst: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    status: "active",
  });
  
  const [errors, setErrors] = useState({});

  // Pre-fill form if editing
  useEffect(() => {
    if (store && isEdit) {
      setFormData({
        name: store.name || "",
        gst: store.gst || "",
        email: store.email || "",
        mobile: store.mobile || "",
        address: store.address || "",
        city: store.city || "",
        state: store.state || "",
        pincode: store.pincode || "",
        status: store.status === true || store.status === "active" ? "active" : "inactive",
      });
    }
  }, [store, isEdit]);

  const handleChange = (field, value) => {
    // Apply input masks
    if (field === "mobile") {
      value = value.replace(/[^0-9]/g, "").slice(0, 10);
    }
    if (field === "pincode") {
      value = value.replace(/[^0-9]/g, "").slice(0, 6);
    }
    if (field === "gst") {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
    }
    if (field === "city" || field === "state") {
      value = value.replace(/[^A-Za-z\s\-]/g, "");
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
      newErrors.name = "Store name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Store name must be at least 2 characters";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }
    
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
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
    
    if (formData.gst && !/^[0-9A-Z]{15}$/.test(formData.gst)) {
      newErrors.gst = "GST number must be 15 characters (alphanumeric)";
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
      status: formData.status === "active",
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
              {isEdit ? "Edit Store" : "Add New Store"}
            </Text>
            <Text className="text-white/80 text-sm mt-1">
              {isEdit ? "Update store information" : "Enter store details to register new shop"}
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
        {/* Store Name */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Store Name <Text className="text-red-500">*</Text>
          </Text>
          <View className={`flex-row items-center rounded-xl border ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <Icon name="store" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
            <TextInput
              className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
              placeholder="Enter store name"
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
            Email <Text className="text-red-500">*</Text>
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

        {/* Mobile Number */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Mobile Number
          </Text>
          <View className={`flex-row items-center rounded-xl border ${errors.mobile ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <Icon name="phone" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
            <TextInput
              className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={formData.mobile}
              onChangeText={(value) => handleChange("mobile", value)}
              keyboardType="phone-pad"
            />
          </View>
          {errors.mobile && (
            <View className="flex-row items-center mt-1">
              <Icon name="alert-circle" size={14} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">{errors.mobile}</Text>
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
              placeholder="Enter store address"
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
            <View className={`flex-row items-center rounded-xl border ${errors.gst ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <Icon name="barcode" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
              <TextInput
                className={`flex-1 p-3 ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Enter GST number"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                value={formData.gst}
                onChangeText={(value) => handleChange("gst", value)}
                autoCapitalize="characters"
              />
            </View>
            {errors.gst && (
              <View className="flex-row items-center mt-1">
                <Icon name="alert-circle" size={14} color="#ef4444" />
                <Text className="text-red-500 text-xs ml-1">{errors.gst}</Text>
              </View>
            )}
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Format: 15 characters (e.g., 27ABCDE1234F2Z5)
            </Text>
          </View>
        </View>

        {/* Status Field */}
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Status <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleChange("status", "active")}
              className={`flex-1 py-3 rounded-xl items-center ${
                formData.status === "active"
                  ? "bg-green-500"
                  : isDarkMode
                  ? "bg-gray-800"
                  : "bg-gray-200"
              }`}
            >
              <Text
                className={`font-medium ${
                  formData.status === "active"
                    ? "text-white"
                    : isDarkMode
                    ? "text-gray-400"
                    : "text-gray-600"
                }`}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleChange("status", "inactive")}
              className={`flex-1 py-3 rounded-xl items-center ${
                formData.status === "inactive"
                  ? "bg-gray-500"
                  : isDarkMode
                  ? "bg-gray-800"
                  : "bg-gray-200"
              }`}
            >
              <Text
                className={`font-medium ${
                  formData.status === "inactive"
                    ? "text-white"
                    : isDarkMode
                    ? "text-gray-400"
                    : "text-gray-600"
                }`}
              >
                Inactive
              </Text>
            </TouchableOpacity>
          </View>
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
                  {isEdit ? "Update Store" : "Register Store"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default StoreForm;