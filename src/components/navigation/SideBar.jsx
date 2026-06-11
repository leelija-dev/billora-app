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

  // Custom drawer item renderer to fix dark mode colors
  const renderDrawerItem = ({ item, index }) => {
    const isFocused = props.state.index === index;
    
    return (
      <TouchableOpacity
        key={item.key}
        onPress={() => {
          props.navigation.navigate(item.name);
          props.navigation.closeDrawer();
        }}
        className={`flex-row items-center px-4 py-3 mx-2 my-1 rounded-xl ${
          isFocused 
            ? "bg-indigo-100 dark:bg-indigo-900/30" 
            : "active:bg-gray-100 dark:active:bg-gray-800"
        }`}
      >
        <Icon 
          name={item.options?.drawerIcon?.({ color: isFocused ? "#6366F1" : (isDarkMode ? "#9CA3AF" : "#6B7280"), size: 22 }).props.name} 
          size={22} 
          color={isFocused ? "#6366F1" : (isDarkMode ? "#9CA3AF" : "#6B7280")} 
        />
        <Text 
          className={`ml-3 text-base font-medium ${
            isFocused 
              ? "text-indigo-600 dark:text-indigo-400" 
              : isDarkMode 
                ? "text-gray-200" 
                : "text-gray-700"
          }`}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
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
            className={`text-sm mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}
          >
            {user?.email || "user@example.com"}
          </Text>
        </View>
      </View>

      {/* Custom Drawer Items for better dark mode support */}
      <DrawerContentScrollView {...props}>
        {props.state.routes.map((route, index) => {
          const isFocused = props.state.index === index;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                props.navigation.navigate(route.name);
                props.navigation.closeDrawer();
              }}
              className={`flex-row items-center px-4 py-3 mx-2 my-1 rounded-xl ${
                isFocused 
                  ? "bg-indigo-100 dark:bg-indigo-900/30" 
                  : ""
              }`}
            >
              <Icon 
                name={ALL_ICONS[route.name] || "circle"} 
                size={22} 
                color={isFocused ? "#6366F1" : (isDarkMode ? "#9CA3AF" : "#6B7280")} 
              />
              <Text 
                className={`ml-3 text-base font-medium ${
                  isFocused 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : isDarkMode 
                      ? "text-gray-200" 
                      : "text-gray-700"
                }`}
              >
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
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
          className={`text-center text-xs mt-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
        >
          Version 1.0.0
        </Text>
      </View>
    </View>
  );
};

// Icon mapping for drawer items
const ALL_ICONS = {
  'Dashboard': 'view-dashboard',
  'Products': 'package-variant',
  'Stocks': 'warehouse',
  'Bills': 'file-document',
  'Reports': 'chart-bar',
  'Customers': 'account-group',
  'Categories': 'shape',
  'Brands': 'trademark',
  'Units': 'ruler',
  'Stores': 'store',
  'Settings': 'cog',
};

export default Sidebar;