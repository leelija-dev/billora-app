import { SafeAreaView, Text } from "react-native";
import { useThemeStore } from "../../store/themeStore";

export default function NotificationSettingsScreen() {
  const { isDarkMode } = useThemeStore();
  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
      <Text className={isDarkMode ? "text-white" : "text-gray-800"}>Notification Settings</Text>
    </SafeAreaView>
  );
}