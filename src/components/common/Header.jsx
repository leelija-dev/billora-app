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
  useColorScheme,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuth } from "../../hooks/useAuth";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.8;

const Header = ({
  title,
  leftComponent,
  rightComponent,
  showBackButton = false,
  onBackPress,
  backgroundColor,
  textColor,
  style = "",
  titleStyle = "",
  showSidebar = true,
  userAvatar,
  userName = "Guest User",
  userEmail = "guest@example.com",
  navigationItems = [], // Now receiving from props (from navigationItems.js)
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
  
  // Use theme store
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const systemColorScheme = useColorScheme();
  
  // Use auth hook for logout
  const { logout: authLogout } = useAuth();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const notificationAnim = useRef(new Animated.Value(0)).current;

  // Handle sidebar animations
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

  // Handle notification animations
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
    if (sidebarVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start(() => {
        setSidebarVisible(false);
      });
    } else {
      setSidebarVisible(false);
    }
  };

  const toggleNotifications = () => {
    setNotificationVisible(!notificationVisible);
    if (onNotificationPress) {
      onNotificationPress();
    }
  };

  const handleNavigation = (item) => {
    console.log('Navigation clicked:', item);
    
    // Close sidebar immediately
    setSidebarVisible(false);
    
    if (onNavigate) {
      console.log('Using custom navigation handler');
      onNavigate(item);
    } else {
      // Default navigation with improved logic
      try {
        if (item.parent) {
          // If it's a stack navigator, navigate to the stack with the screen
          console.log('Navigating to parent stack:', item.parent, 'screen:', item.screen);
          
          // Navigate to the stack and specify the screen
          navigation.navigate(item.parent, {
            screen: item.screen,
          });
        } else if (item.screen) {
          // Direct screen navigation
          console.log('Navigating to direct screen:', item.screen);
          navigation.navigate(item.screen);
        } else {
          // Fallback - try to navigate by title
          console.log('Navigating by title:', item.title);
          navigation.navigate(item.title);
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
    
    // Start closing animation after navigation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start();
  };

  const handleLogout = async () => {
    try {
      // Close sidebar first
      setSidebarVisible(false);
      
      // Call the real logout function from useAuth hook
      await authLogout();
      
      // Call the onLogout prop if provided (for additional cleanup)
      if (onLogout) {
        onLogout();
      }
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      setSidebarVisible(false);
      if (onLogout) {
        onLogout();
      }
    }
  };

  const handleThemeToggle = () => {
    toggleDarkMode();
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
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-[20px] justify-center items-center border-2 border-white dark:border-gray-900 shadow-sm shadow-red-500/50">
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
                  transform: [
                    {
                      translateY: notificationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                }}
                className={`absolute top-16 right-4 w-[80%] max-w-[350px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg`}
              >
                {/* Header */}
                <View className="rounded-t-2xl overflow-hidden">
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="flex-row justify-between items-center p-4 w-full h-auto"
                  >
                    <Text className="text-white font-bold text-lg">
                      Notifications
                    </Text>
                    <TouchableOpacity
                      onPress={() => setNotificationVisible(false)}
                    >
                      <Icon name="close" size={22} color="white" />
                    </TouchableOpacity>
                  </LinearGradient>
                </View>

                {/* Notifications List */}
                <ScrollView
                  className="max-h-96"
                  showsVerticalScrollIndicator={false}
                >
                  {notifications.map((notif) => (
                    <TouchableOpacity
                      key={notif.id}
                      className={`flex-row p-4 border-b border-gray-200 dark:border-gray-700 ${
                        !notif.read ? 'bg-blue-50/50 dark:bg-purple-900/20' : 'bg-white dark:bg-gray-800'
                      }`}
                      onPress={() => {
                        console.log("Notification pressed:", notif.id);
                        setNotificationVisible(false);
                      }}
                    >
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${notif.color}20` }}
                      >
                        <Icon name={notif.icon} size={20} color={notif.color} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row justify-between items-center">
                          <Text className="font-semibold text-gray-900 dark:text-white">
                            {notif.title}
                          </Text>
                          <Text className="text-xs text-gray-400 dark:text-gray-500">
                            {notif.time}
                          </Text>
                        </View>
                        <Text className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                          {notif.message}
                        </Text>
                      </View>
                      {!notif.read && (
                        <View className="w-2 h-2 rounded-full bg-blue-500 ml-2 self-center" />
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* View All Button */}
                  <TouchableOpacity
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl"
                    onPress={() => {
                      console.log("View all notifications");
                      setNotificationVisible(false);
                    }}
                  >
                    <Text className="text-center text-indigo-600 dark:text-indigo-400 font-semibold">
                      View All Notifications
                    </Text>
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
              backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
            }}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={{
                  transform: [{ translateX: slideAnim }],
                  width: DRAWER_WIDTH,
                  height: '100%',
                  backgroundColor: isDarkMode ? '#1F2937' : 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 2, height: 0 },
                  shadowOpacity: isDarkMode ? 0.5 : 0.25,
                  shadowRadius: 5,
                  elevation: 5,
                }}
              >
                {/* Main container */}
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
                        <Image
                          source={{ uri: userAvatar }}
                          className="w-14 h-14 rounded-full border-2 border-white"
                        />
                      ) : (
                        <View className="w-14 h-14 rounded-full bg-white/30 justify-center items-center border-2 border-white">
                          <Text className="text-2xl font-bold text-white">
                            {userName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View className="ml-4 flex-1">
                        <Text className="text-lg font-bold text-white" numberOfLines={1}>
                          {userName}
                        </Text>
                        <Text className="text-sm text-white/80 mt-1" numberOfLines={1}>
                          {userEmail}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Navigation Items - Now using props */}
                  {navigationItems.length > 0 ? (
                    <ScrollView 
                      className="flex-1" 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingVertical: 8 }}
                    >
                      {navigationItems.map((item) => {
                        const isActive = 
                          activeScreen === item.title || 
                          activeScreen === item.screen ||
                          activeScreen === item.parent ||
                          (item.parent && activeScreen.includes(item.title)) ||
                          (item.title === "Dashboard" && activeScreen === "Dashboard") ||
                          (item.title === "Settings" && activeScreen === "Settings") ||
                          (item.title === "Profile" && activeScreen === "Profile");

                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => handleNavigation(item)}
                            className={`mx-3 my-1 px-4 py-3.5 rounded-xl ${
                              isActive 
                                ? isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'
                                : ''
                            }`}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center flex-1">
                                <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                                  isActive 
                                    ? isDarkMode ? 'bg-purple-800' : 'bg-purple-100'
                                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                }`}>
                                  <Icon
                                    name={isActive ? item.iconActive || item.icon : item.icon}
                                    size={20}
                                    color={isActive ? "#667eea" : (isDarkMode ? "#9CA3AF" : "#666")}
                                  />
                                </View>
                                <Text
                                  className={`text-base ml-3 flex-1 ${
                                    isActive
                                      ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                      : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                  }`}
                                  numberOfLines={1}
                                >
                                  {item.title}
                                </Text>
                              </View>
                              {item.badge && (
                                <View
                                  className={`px-2 py-1 rounded-full ml-2 ${
                                    item.badge === "Low Stock" || item.badge?.includes("Low")
                                      ? "bg-orange-500"
                                      : "bg-purple-600"
                                  }`}
                                >
                                  <Text className="text-white text-[10px] font-bold">
                                    {item.badge}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    // Fallback if no navigation items provided
                    <View className="flex-1 items-center justify-center">
                      <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        No navigation items
                      </Text>
                    </View>
                  )}

                  {/* Footer */}
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
                      
                      {/* Fixed Toggle Switch */}
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
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 1,
                            elevation: 2,
                            transform: [{
                              translateX: isDarkMode ? 24 : 0,
                            }],
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

                    {/* Logout */}
                    <TouchableOpacity
                      className="flex-row items-center py-3"
                      onPress={handleLogout}
                      activeOpacity={0.7}
                    >
                      <View className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 items-center justify-center">
                        <Icon name="logout" size={20} color="#ff4444" />
                      </View>
                      <Text className="text-base ml-3 text-red-500 dark:text-red-400">Logout</Text>
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
        className={`
          border-b 
          ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-white bg-white'} 
          shadow-[0px_7px_20px_black] dark:shadow-none 
          ${style}
        `}
        edges={["top", "left", "right"]}
      >
        <View className="flex-row items-center justify-between px-4 py-3 min-h-[60px]">
          {renderLeftComponent()}
          <Text
            className={`flex-1 text-center mx-2 font-semibold text-lg ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            } ${titleStyle}`}
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