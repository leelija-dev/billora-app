// screens/settings/AboutScreen.js
import { ScrollView, Text, View, Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const AboutScreen = () => {
  const { isDarkMode } = useThemeStore();
  const appVersion = "1.0.0";

  const infoItems = [
    { icon: "tag", label: "Version", value: appVersion },
    { icon: "calendar", label: "Build Date", value: "June 2024" },
    { icon: "developer-board", label: "Developer", value: "The Fast Bill Team" },
  ];

  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-2xl bg-indigo-500 items-center justify-center mb-4">
            <Icon name="storefront" size={48} color="#FFFFFF" />
          </View>
          <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            The Fast Bill
          </Text>
          <Text className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Business Management Solution
          </Text>
        </View>

        {/* Info Cards */}
        <View className={`rounded-2xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm mb-6`}>
          {infoItems.map((item, index) => (
            <View
              key={index}
              className={`flex-row items-center p-4 ${index !== infoItems.length - 1 ? (isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100") : ""}`}
            >
              <View className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center">
                <Icon name={item.icon} size={20} color="#6366F1" />
              </View>
              <View className="flex-1 ml-3">
                <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {item.label}
                </Text>
                <Text className={`text-base font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Links */}
        <View className={`rounded-2xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm mb-6`}>
          <TouchableOpacity
            onPress={() => handleLinkPress("https://thefastbill.com/privacy")}
            className={`flex-row items-center p-4 ${isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}`}
          >
            <Icon name="shield-account" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              Privacy Policy
            </Text>
            <Icon name="open-in-new" size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleLinkPress("https://thefastbill.com/terms")}
            className={`flex-row items-center p-4 ${isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}`}
          >
            <Icon name="file-document" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              Terms of Service
            </Text>
            <Icon name="open-in-new" size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleLinkPress("mailto:support@thefastbill.com")}
            className="flex-row items-center p-4"
          >
            <Icon name="email" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              Contact Support
            </Text>
            <Icon name="open-in-new" size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <Text className={`text-center text-xs mb-8 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
          © {new Date().getFullYear()} The Fast Bill. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;