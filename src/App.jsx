// App.jsx
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Sidebar from "./components/navigation/SideBar.jsx";
import { ThemeProvider, useTheme } from "./components/ThemeProvider";
import "./global.css";
import { navigationRef } from "./services/navigationService";
import { useAuthStore } from "./store/authStore";

// Import screens
import LoginScreen from "./screens/auth/LoginScreen";
import DashboardScreen from "./screens/dashboard/DashboardScreen";

// Import Stack Navigators
import BrandsStackNavigator from "./components/navigation/stacks/BrandsStack";
import CategoriesStackNavigator from "./components/navigation/stacks/CategoriesStack";
import CustomersStackNavigator from "./components/navigation/stacks/CustomersStack";
import BillsStackNavigator from "./components/navigation/stacks/InvoicesStack.jsx";
import OrdersStackNavigator from "./components/navigation/stacks/OrdersStack";
import ProductsStackNavigator from "./components/navigation/stacks/ProductsStack";
import ReportsStackNavigator from "./components/navigation/stacks/ReportsStack";
import SettingsStackNavigator from "./components/navigation/stacks/SettingsStack";
import StocksStackNavigator from "./components/navigation/stacks/StocksStack";
import StoresStackNavigator from "./components/navigation/stacks/StoresStack";
import UnitsStackNavigator from "./components/navigation/stacks/UnitsStack";

import MainNavigator from "./components/navigation/MainNavigator";

// Create Stack and Drawer instances
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Custom Splash Screen
const SplashScreen = ({ progress }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        backgroundColor: "#667eea",
      }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 128,
            height: 128,
            borderRadius: 24,
            backgroundColor: "rgba(255,255,255,0.2)",
            marginBottom: 32,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Image
              source={"./assets/icon.png"}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Text
          style={{
            fontSize: 36,
            fontWeight: "bold",
            color: "white",
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          The Fast Bill
        </Text>

        <Text
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.8)",
            marginBottom: 48,
            textAlign: "center",
          }}
        >
          Manage your business with ease
        </Text>

        <View
          style={{
            width: 256,
            height: 8,
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              width: progress.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
              height: "100%",
              backgroundColor: "white",
              borderRadius: 4,
            }}
          />
        </View>

        <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 16 }}>
          Setting things up...
        </Text>
      </Animated.View>

      <Text
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255,255,255,0.4)",
          fontSize: 14,
        }}
      >
        Version 1.0.0
      </Text>
    </View>
  );
};

const AppLoadingScreen = () => {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 100,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SplashScreen progress={progress} />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
};

// All screens definition (without permission filtering)
const ALL_SCREENS = [
  {
    name: "Dashboard",
    component: DashboardScreen,
    icon: "view-dashboard",
    permission: "dashboard",
  },
  {
    name: "Products",
    component: ProductsStackNavigator,
    icon: "package-variant",
    permission: "products",
  },
  {
    name: "Stocks",
    component: StocksStackNavigator,
    icon: "warehouse",
    permission: "inventory",
  },
  {
    name: "Orders",
    component: OrdersStackNavigator,
    icon: "cart",
    permission: "orders",
  },
  {
    name: "Bills",
    component: BillsStackNavigator,
    icon: "file-document",
    permission: "invoices",
  },
  {
    name: "Reports",
    component: ReportsStackNavigator,
    icon: "chart-bar",
    permission: "reports",
  },
  {
    name: "Customers",
    component: CustomersStackNavigator,
    icon: "account-group",
    permission: "customers",
  },
  {
    name: "Categories",
    component: CategoriesStackNavigator,
    icon: "shape",
    permission: "categories",
  },
  {
    name: "Brands",
    component: BrandsStackNavigator,
    icon: "trademark",
    permission: "brands",
  },
  {
    name: "Units",
    component: UnitsStackNavigator,
    icon: "ruler",
    permission: "units",
  },
  {
    name: "Stores",
    component: StoresStackNavigator,
    icon: "store",
    permission: "stores",
  },
  {
    name: "Settings",
    component: SettingsStackNavigator,
    icon: "cog",
    permission: "settings",
  },
];

// Main Drawer Navigator
const DrawerNavigator = () => {
  const { canAccessSidebar, sidebarPermissions, permissions } = useAuthStore();

  console.log("🔍 Sidebar Permissions:", sidebarPermissions);
  console.log("🔍 All Permissions:", permissions);

  // Filter screens based on permissions
  let visibleScreens = [];

  // If permissions are loaded, filter based on them
  if (sidebarPermissions && sidebarPermissions.length > 0) {
    visibleScreens = ALL_SCREENS.filter((screen) => {
      return canAccessSidebar(screen.permission);
    });
  }

  // Fallback: If no permissions or empty, show all screens
  if (visibleScreens.length === 0) {
    console.log("⚠️ No permissions found, showing all screens");
    visibleScreens = ALL_SCREENS;
  }

  console.log("📱 Visible screens count:", visibleScreens.length);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{
        headerShown: true,
        drawerType: "front",
        drawerStyle: { width: 280 },
        headerStyle: { backgroundColor: "#6366F1" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      {visibleScreens.map((screen) => (
        <Drawer.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            title: screen.name,
            drawerIcon: ({ color, size }) => (
              <Icon name={screen.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Drawer.Navigator>
  );
};

// Auth Stack Navigator
const AuthStackNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

// Main App Content
const AppContent = () => {
  const { isAuthenticated, hasHydrated, isLoading } = useAuthStore();
  const { colors } = useTheme();

  // Show loading screen while checking authentication
  if (!hasHydrated || isLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      {isAuthenticated ? <MainNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

// Main App Component
export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
