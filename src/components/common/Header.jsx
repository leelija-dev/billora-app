// components/common/Header.js
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { usePermissionStore, MENU_ITEMS } from "../../store/permissionStore";


const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.8;

const Header = ({
  title,
  leftComponent,
  rightComponent,
  showBackButton = false,
  onBackPress,
  style = "",
  titleStyle = "",
  showSidebar = true,
  userAvatar,
  userName = "Guest User",
  userEmail = "guest@example.com",
  onNavigate,
  activeScreen = "Dashboard",
  notificationCount = 3,
  onNotificationPress,
  onSearchPress,
  onLogout,
}) => {
  const navigation = useNavigation();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { getFilteredMenuItems, sidebarPermissions } = usePermissionStore();
  
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const notificationAnim = useRef(new Animated.Value(0)).current;

  // Get filtered menu items based on user permissions (like desktop)
  const menuItems = getFilteredMenuItems();
  
  // Sort menu items by order
  const sortedMenuItems = [...menuItems].sort((a, b) => a.order - b.order);

  // Debug logs
  useEffect(() => {
    if (sidebarPermissions) {
      console.log('📋 Sidebar Permissions:', sidebarPermissions.map(p => p.slug));
      console.log('📱 Filtered Menu Items:', sortedMenuItems.map(m => m.name));
    }
  }, [sidebarPermissions]);

  useEffect(() => {
    if (sidebarVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start();
    }
  }, [sidebarVisible]);

  useEffect(() => {
    if (notificationVisible) {
      Animated.spring(notificationAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    } else {
      Animated.timing(notificationAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [notificationVisible]);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const toggleNotifications = () => {
    setNotificationVisible(!notificationVisible);
    if (onNotificationPress) {
      onNotificationPress();
    }
  };

  const handleNavigation = (item) => {
    console.log('📱 Navigation clicked:', item);
    setSidebarVisible(false);
    
    if (onNavigate) {
      onNavigate(item);
    } else {
      try {
        // Navigate to the screen
        if (item.screen) {
          navigation.navigate(item.screen);
        } else if (item.stack) {
          navigation.navigate(item.stack);
        } else {
          navigation.navigate(item.name);
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };

  const handleLogout = async () => {
    setSidebarVisible(false);
    await logout();
    if (onLogout) {
      onLogout();
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const renderLeftComponent = () => {
    if (leftComponent) {
      return <View className="min-w-[40px] items-start">{leftComponent}</View>;
    }

    if (showSidebar) {
      return (
        <TouchableOpacity
          onPress={toggleSidebar}
          activeOpacity={0.7}
          className="rounded-xl overflow-hidden shadow-lg shadow-purple-500/30"
        >
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-2.5 rounded-xl"
          >
            <Icon name="menu" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (showBackButton) {
      return (
        <TouchableOpacity
          onPress={onBackPress || (() => navigation.goBack())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="p-2"
        >
          <Icon
            name="arrow-left"
            size={24}
            color={isDarkMode ? "#FFFFFF" : "#1f2937"}
          />
        </TouchableOpacity>
      );
    }

    return <View className="min-w-[40px]" />;
  };

  const renderRightComponent = () => {
    if (rightComponent) {
      return <View className="min-w-[40px] items-end">{rightComponent}</View>;
    }

    return (
      <View className="flex-row items-center">
        {/* Notification Bell with Badge */}
        <TouchableOpacity
          className="p-2 relative"
          onPress={toggleNotifications}
          activeOpacity={0.7}
        >
          <Icon
            name="bell-outline"
            size={24}
            color={isDarkMode ? "#FFFFFF" : "#1f2937"}
          />
          {notificationCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-[20px] justify-center items-center border-2 border-white dark:border-gray-900">
              <Text className="text-white text-[10px] font-bold">
                {notificationCount > 9 ? "9+" : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Search Icon */}
        <TouchableOpacity
          className="p-2"
          onPress={onSearchPress}
          activeOpacity={0.7}
        >
          <Icon
            name="magnify"
            size={24}
            color={isDarkMode ? "#FFFFFF" : "#1f2937"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderNotifications = () => {
    if (!notificationVisible) return null;

    const notifications = [
      {
        id: 1,
        title: "New Order",
        message: "Order #ORD-1234 has been placed",
        time: "5 min ago",
        read: false,
        icon: "clipboard-list",
        color: "#6366F1",
      },
      {
        id: 2,
        title: "Low Stock Alert",
        message: "Classic White T-Shirt is running low",
        time: "1 hour ago",
        read: false,
        icon: "alert",
        color: "#F59E0B",
      },
      {
        id: 3,
        title: "Payment Received",
        message: "Payment of $299.99 from John Smith",
        time: "2 hours ago",
        read: true,
        icon: "cash",
        color: "#10B981",
      },
    ];

    return (
      <Modal
        transparent
        visible={notificationVisible}
        animationType="none"
        onRequestClose={() => setNotificationVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setNotificationVisible(false)}>
          <View className="flex-1">
            <TouchableWithoutFeedback>
              <Animated.View
                style={{
                  opacity: notificationAnim,
                  transform: [{ translateY: notificationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }) }],
                }}
                className={`absolute top-16 right-4 w-[80%] max-w-[350px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg z-50`}
              >
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-row justify-between items-center p-4 rounded-t-2xl"
                >
                  <Text className="text-white font-bold text-lg">Notifications</Text>
                  <TouchableOpacity onPress={() => setNotificationVisible(false)}>
                    <Icon name="close" size={22} color="white" />
                  </TouchableOpacity>
                </LinearGradient>

                <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                  {notifications.map((notif) => (
                    <TouchableOpacity
                      key={notif.id}
                      className={`flex-row p-4 border-b border-gray-200 dark:border-gray-700 ${
                        !notif.read ? 'bg-blue-50/50 dark:bg-purple-900/20' : ''
                      }`}
                      onPress={() => setNotificationVisible(false)}
                    >
                      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${notif.color}20` }}>
                        <Icon name={notif.icon} size={20} color={notif.color} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row justify-between items-center">
                          <Text className="font-semibold text-gray-900 dark:text-white">{notif.title}</Text>
                          <Text className="text-xs text-gray-400 dark:text-gray-500">{notif.time}</Text>
                        </View>
                        <Text className="text-sm mt-1 text-gray-600 dark:text-gray-300">{notif.message}</Text>
                      </View>
                      {!notif.read && <View className="w-2 h-2 rounded-full bg-blue-500 ml-2 self-center" />}
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity className="p-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl" onPress={() => setNotificationVisible(false)}>
                    <Text className="text-center text-indigo-600 dark:text-indigo-400 font-semibold">View All Notifications</Text>
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderSidebar = () => {
    if (!sidebarVisible) return null;

    return (
      <Modal
        transparent
        visible={sidebarVisible}
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <Animated.View
            style={{ 
              opacity: fadeAnim,
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={{
                  transform: [{ translateX: slideAnim }],
                  width: DRAWER_WIDTH,
                  height: '100%',
                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 2, height: 0 },
                  shadowOpacity: 0.25,
                  shadowRadius: 5,
                  elevation: 5,
                }}
              >
                <View className="flex-1">
                  {/* User Profile Section */}
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="pt-12 pb-6 px-5"
                  >
                    <View className="flex-row items-center">
                      {userAvatar ? (
                        <Image source={{ uri: userAvatar }} className="w-14 h-14 rounded-full border-2 border-white" />
                      ) : (
                        <View className="w-14 h-14 rounded-full bg-white/30 justify-center items-center border-2 border-white">
                          <Text className="text-2xl font-bold text-white">
                            {(user?.name || userName).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View className="ml-4 flex-1">
                        <Text className="text-lg font-bold text-white" numberOfLines={1}>
                          {user?.name || userName}
                        </Text>
                        <Text className="text-sm text-white/80 mt-1" numberOfLines={1}>
                          {user?.email || userEmail}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Navigation Items - Filtered by permissions */}
                  {sortedMenuItems.length > 0 && (
                    <ScrollView 
                      className="flex-1" 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingVertical: 8 }}
                    >
                      {sortedMenuItems.map((item) => {
                        const isActive = activeScreen === item.screen || activeScreen === item.name;
                        
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => handleNavigation(item)}
                            className={`mx-3 my-1 px-4 py-3.5 rounded-xl ${
                              isActive ? (isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50') : ''
                            }`}
                            activeOpacity={0.7}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center flex-1">
                                <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                                  isActive 
                                    ? (isDarkMode ? 'bg-purple-800' : 'bg-purple-100')
                                    : (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')
                                }`}>
                                  <Icon
                                    name={isActive ? (item.iconActive || item.icon) : item.icon}
                                    size={20}
                                    color={isActive ? "#667eea" : (isDarkMode ? "#9CA3AF" : "#666")}
                                  />
                                </View>
                                <Text 
                                  className={`text-base ml-3 flex-1 ${
                                    isActive
                                      ? (isDarkMode ? 'text-purple-400' : 'text-purple-600')
                                      : (isDarkMode ? 'text-gray-300' : 'text-gray-600')
                                  }`}
                                  numberOfLines={1}
                                >
                                  {item.name}
                                </Text>
                              </View>
                              {item.badge && (
                                <View className={`px-2 py-1 rounded-full ml-2 ${
                                  item.badge === "Low Stock" ? "bg-orange-500" : "bg-purple-600"
                                }`}>
                                  <Text className="text-white text-[10px] font-bold">{item.badge}</Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* Footer Section */}
                  <View className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-4 pb-8 px-5`}>
                    {/* Dark Mode Toggle */}
                    <TouchableOpacity 
                      className="flex-row items-center py-3 justify-between" 
                      onPress={handleThemeToggle} 
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center">
                        <View className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} items-center justify-center`}>
                          <Icon 
                            name={isDarkMode ? "weather-night" : "white-balance-sunny"} 
                            size={20} 
                            color={isDarkMode ? "#9CA3AF" : "#666"} 
                          />
                        </View>
                        <Text className={`text-base ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Dark Mode
                        </Text>
                      </View>
                      <View 
                        style={{
                          width: 48,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: isDarkMode ? '#667eea' : '#e5e7eb',
                          padding: 2,
                        }}
                      >
                        <Animated.View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: 'white',
                            transform: [{ translateX: isDarkMode ? 24 : 0 }],
                          }}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Help & Support */}
                    <TouchableOpacity 
                      className="flex-row items-center py-3"
                      activeOpacity={0.7}
                    >
                      <View className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} items-center justify-center`}>
                        <Icon name="help-circle-outline" size={20} color={isDarkMode ? "#9CA3AF" : "#666"} />
                      </View>
                      <Text className={`text-base ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Help & Support
                      </Text>
                    </TouchableOpacity>

                    {/* Logout Button */}
                    <TouchableOpacity
                      className="flex-row items-center py-3"
                      onPress={handleLogout}
                      activeOpacity={0.7}
                    >
                      <View className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 items-center justify-center">
                        <Icon name="logout" size={20} color="#ff4444" />
                      </View>
                      <Text className="text-base ml-3 text-red-500 dark:text-red-400">
                        Logout
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <>
      <SafeAreaView 
        className={`border-b ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'} shadow-sm ${style}`} 
        edges={["top", "left", "right"]}
      >
        <View className="flex-row items-center justify-between px-4 py-3 min-h-[60px]">
          {renderLeftComponent()}
          <Text 
            className={`flex-1 text-center mx-2 font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'} ${titleStyle}`} 
            numberOfLines={1}
          >
            {title}
          </Text>
          {renderRightComponent()}
        </View>
      </SafeAreaView>
      {renderSidebar()}
      {renderNotifications()}
    </>
  );
};

export default Header;