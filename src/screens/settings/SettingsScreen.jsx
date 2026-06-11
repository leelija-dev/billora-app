// screens/settings/SettingsScreen.js
import { useNavigation } from "@react-navigation/native";
import { ScrollView, Text, TouchableOpacity, View, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { LinearGradient } from "expo-linear-gradient";

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: "account-circle",
          label: "Profile",
          description: "View and edit your profile",
          onPress: () => navigation.navigate("Profile"),
          color: "#3B82F6",
        },
        {
          icon: "lock",
          label: "Change Password",
          description: "Update your password",
          onPress: () => navigation.navigate("ChangePassword"),
          color: "#8B5CF6",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "bell",
          label: "Notifications",
          description: "Manage notification settings",
          onPress: () => navigation.navigate("NotificationSettings"),
          color: "#F59E0B",
        },
        {
          icon: "theme-light-dark",
          label: "Appearance",
          description: "Dark / Light mode",
          onPress: () => navigation.navigate("AppearanceSettings"),
          color: "#10B981",
          isToggle: true,
          toggleValue: isDarkMode,
          onToggle: toggleTheme,
        },
        {
          icon: "translate",
          label: "Language",
          description: "Change app language",
          onPress: () => navigation.navigate("LanguageSettings"),
          color: "#06B6D4",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "information",
          label: "About",
          description: "App version and info",
          onPress: () => navigation.navigate("About"),
          color: "#6366F1",
        },
        {
          icon: "file-document",
          label: "Privacy Policy",
          description: "Read our privacy policy",
          onPress: () => navigation.navigate("PrivacyPolicy"),
          color: "#6B7280",
        },
        {
          icon: "file-document-outline",
          label: "Terms of Service",
          description: "Read our terms",
          onPress: () => navigation.navigate("TermsOfService"),
          color: "#6B7280",
        },
      ],
    },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={isDarkMode ? ["#4f46e5", "#7c3aed"] : ["#6366F1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-6 pt-12 pb-8"
        >
          <Text className="text-white text-3xl font-bold">Settings</Text>
          <Text className="text-white/70 text-sm mt-1">
            Customize your app experience
          </Text>
        </LinearGradient>

        {/* User Info Card */}
        <View className={`mx-4 -mt-6 p-4 rounded-2xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-indigo-500 items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {user?.name?.charAt(0) || "U"}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {user?.name || "User"}
              </Text>
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {user?.email}
              </Text>
              {user?.company_name && (
                <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {user.company_name}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mt-6">
            <Text className={`px-4 text-sm font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {section.title}
            </Text>
            <View className={`mx-4 rounded-2xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  className={`flex-row items-center p-4 ${itemIndex !== section.items.length - 1 ? (isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100") : ""}`}
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <Icon name={item.icon} size={22} color={item.color} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className={`text-base font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                      {item.label}
                    </Text>
                    <Text className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {item.description}
                    </Text>
                  </View>
                  {item.isToggle ? (
                    <Switch
                      value={item.toggleValue}
                      onValueChange={item.onToggle}
                      trackColor={{ false: "#D1D5DB", true: "#6366F1" }}
                      thumbColor="#FFFFFF"
                    />
                  ) : (
                    <Icon name="chevron-right" size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View className="p-4 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Icon name="logout" size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base ml-2">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;