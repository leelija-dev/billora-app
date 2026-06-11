// screens/settings/AppearanceSettingsScreen.js
import { ScrollView, Text, TouchableOpacity, View, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const AppearanceSettingsScreen = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();

  const options = [
    {
      id: "light",
      title: "Light Mode",
      description: "Use light theme",
      icon: "white-balance-sunny",
      isSelected: !isDarkMode,
    },
    {
      id: "dark",
      title: "Dark Mode",
      description: "Use dark theme",
      icon: "moon-waning-crescent",
      isSelected: isDarkMode,
    },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <Text className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Choose your preferred appearance
        </Text>

        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => {
              if (option.id === "dark" && !isDarkMode) toggleTheme();
              if (option.id === "light" && isDarkMode) toggleTheme();
            }}
            className={`flex-row items-center p-4 rounded-2xl mb-3 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
          >
            <View className={`w-12 h-12 rounded-xl items-center justify-center ${option.isSelected ? "bg-indigo-500" : isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <Icon name={option.icon} size={24} color={option.isSelected ? "#FFFFFF" : isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </View>
            <View className="flex-1 ml-3">
              <Text className={`text-base font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {option.title}
              </Text>
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {option.description}
              </Text>
            </View>
            {option.isSelected && (
              <Icon name="check-circle" size={24} color="#10B981" />
            )}
          </TouchableOpacity>
        ))}

        {/* Preview Card */}
        <View className={`mt-6 p-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Preview
          </Text>
          <View className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <View className="flex-row items-center">
              <View className={`w-8 h-8 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`} />
              <View className="ml-2 flex-1">
                <View className={`h-2 rounded-full w-24 ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`} />
                <View className={`h-2 rounded-full w-16 mt-1 ${isDarkMode ? "bg-gray-600/60" : "bg-gray-300/60"}`} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AppearanceSettingsScreen;