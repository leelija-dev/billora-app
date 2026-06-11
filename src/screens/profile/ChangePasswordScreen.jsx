// screens/profile/ChangePasswordScreen.js
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../api/auth";

const ChangePasswordScreen = () => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.current_password) {
      newErrors.current_password = "Current password is required";
    }
    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = "Password must be at least 6 characters";
    }
    if (formData.new_password !== formData.new_password_confirmation) {
      newErrors.new_password_confirmation = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await authAPI.updatePassword(user.id, formData.current_password, formData.new_password);
      if (response.data.status) {
        Alert.alert("Success", "Password changed successfully");
        setFormData({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      } else {
        Alert.alert("Error", response.data.message || "Failed to change password");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `rounded-xl px-4 py-3 pr-12 ${isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"} border`;

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View className={`p-4 rounded-2xl mb-6 ${isDarkMode ? "bg-gray-800" : "bg-blue-50"}`}>
          <View className="flex-row items-center">
            <Icon name="information" size={24} color="#3B82F6" />
            <Text className={`flex-1 ml-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              For security reasons, please use a strong password with at least 6 characters.
            </Text>
          </View>
        </View>

        {/* Current Password */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Current Password
          </Text>
          <View className="relative">
            <TextInput
              value={formData.current_password}
              onChangeText={(value) => handleChange("current_password", value)}
              placeholder="Enter current password"
              secureTextEntry={!showCurrentPassword}
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={inputClasses}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-3"
            >
              <Icon name={showCurrentPassword ? "eye-off" : "eye"} size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </TouchableOpacity>
          </View>
          {errors.current_password && (
            <Text className="text-red-500 text-xs mt-1">{errors.current_password}</Text>
          )}
        </View>

        {/* New Password */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            New Password
          </Text>
          <View className="relative">
            <TextInput
              value={formData.new_password}
              onChangeText={(value) => handleChange("new_password", value)}
              placeholder="Enter new password"
              secureTextEntry={!showNewPassword}
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={inputClasses}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-3"
            >
              <Icon name={showNewPassword ? "eye-off" : "eye"} size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </TouchableOpacity>
          </View>
          {errors.new_password && (
            <Text className="text-red-500 text-xs mt-1">{errors.new_password}</Text>
          )}
        </View>

        {/* Confirm Password */}
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Confirm New Password
          </Text>
          <View className="relative">
            <TextInput
              value={formData.new_password_confirmation}
              onChangeText={(value) => handleChange("new_password_confirmation", value)}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={inputClasses}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3"
            >
              <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </TouchableOpacity>
          </View>
          {errors.new_password_confirmation && (
            <Text className="text-red-500 text-xs mt-1">{errors.new_password_confirmation}</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-indigo-500 py-4 rounded-xl mb-8 flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-base">Change Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;