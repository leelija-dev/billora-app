// components/navigation/Sidebar.js
import {
    DrawerContentScrollView,
    DrawerItemList,
} from "@react-navigation/drawer";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";

const Sidebar = (props) => {
  const { isDarkMode } = useThemeStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          props.navigation.closeDrawer();
        },
      },
    ]);
  };

  // Check if state and routes exist
  if (!props.state || !props.state.routes) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-white"} items-center justify-center`}
      >
        <Text className={isDarkMode ? "text-white" : "text-gray-800"}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      {/* Header */}
      <View
        className={`px-4 pt-12 pb-6 border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
      >
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-indigo-500 items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <Text
            className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
          >
            {user?.name || "User"}
          </Text>
          <Text
            className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            {user?.email || "user@example.com"}
          </Text>
        </View>
      </View>

      {/* Drawer Items */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Footer */}
      <View
        className={`p-4 border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
      >
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center p-3 rounded-xl bg-red-500/10"
        >
          <Icon name="logout" size={22} color="#EF4444" />
          <Text className="ml-3 text-red-500 font-medium">Logout</Text>
        </TouchableOpacity>

        <Text
          className={`text-center text-xs mt-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
        >
          Version 1.0.0
        </Text>
      </View>
    </View>
  );
};

export default Sidebar;
