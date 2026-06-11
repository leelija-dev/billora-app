// screens/profile/ProfileScreen.js
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../api/auth";

const ProfileScreen = () => {
  const { isDarkMode } = useThemeStore();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    company_name: user?.company_name || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    country: user?.country || "India",
    pincode: user?.pincode || "",
    gst_number: user?.gst_number || "",
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(user.id, formData);
      if (response.data.status) {
        updateUser(formData);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", response.data.message || "Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `rounded-xl px-4 py-3 ${isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"} border`;

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-indigo-500 items-center justify-center">
            <Text className="text-white text-3xl font-bold">
              {formData.name?.charAt(0) || "U"}
            </Text>
          </View>
          <TouchableOpacity className="mt-2">
            <Text className="text-indigo-500 text-sm font-medium">Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
          Personal Information
        </Text>

        <View className="mb-4">
          <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Full Name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(value) => handleChange("name", value)}
            placeholder="Enter your name"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={inputClasses}
          />
        </View>

        <View className="mb-4">
          <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Phone Number</Text>
          <TextInput
            value={formData.phone}
            onChangeText={(value) => handleChange("phone", value)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={inputClasses}
          />
        </View>

        <View className="mb-4">
          <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Email Address</Text>
          <TextInput
            value={formData.email}
            onChangeText={(value) => handleChange("email", value)}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={`${inputClasses} opacity-70`}
          />
          <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Email cannot be changed
          </Text>
        </View>

        {/* Company Information */}
        <Text className={`text-lg font-semibold mb-3 mt-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
          Company Information
        </Text>

        <View className="mb-4">
          <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Company Name</Text>
          <TextInput
            value={formData.company_name}
            onChangeText={(value) => handleChange("company_name", value)}
            placeholder="Enter company name"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={inputClasses}
          />
        </View>

        <View className="mb-4">
          <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>GST Number</Text>
          <TextInput
            value={formData.gst_number}
            onChangeText={(value) => handleChange("gst_number", value)}
            placeholder="Enter GST number"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={inputClasses}
          />
        </View>

        <View className="mb-4">
          <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Address</Text>
          <TextInput
            value={formData.address}
            onChangeText={(value) => handleChange("address", value)}
            placeholder="Enter address"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={`${inputClasses} min-h-[80px]`}
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 mb-4">
            <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>City</Text>
            <TextInput
              value={formData.city}
              onChangeText={(value) => handleChange("city", value)}
              placeholder="City"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={inputClasses}
            />
          </View>
          <View className="flex-1 mb-4">
            <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>State</Text>
            <TextInput
              value={formData.state}
              onChangeText={(value) => handleChange("state", value)}
              placeholder="State"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={inputClasses}
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 mb-4">
            <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Country</Text>
            <TextInput
              value={formData.country}
              onChangeText={(value) => handleChange("country", value)}
              placeholder="Country"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={inputClasses}
            />
          </View>
          <View className="flex-1 mb-4">
            <Text className={`text-sm mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Pincode</Text>
            <TextInput
              value={formData.pincode}
              onChangeText={(value) => handleChange("pincode", value)}
              placeholder="Pincode"
              keyboardType="numeric"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={inputClasses}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className="bg-indigo-500 py-4 rounded-xl mb-8 flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-base">Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;