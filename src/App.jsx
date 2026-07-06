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
import { usePermissionStore } from "./store/permissionStore";

// Import screens
import LoginScreen from "./screens/auth/LoginScreen";
import DashboardScreen from "./screens/dashboard/DashboardScreen";

// Import Stack Navigators
import BrandsStackNavigator from "./components/navigation/stacks/BrandsStack";
import CategoriesStackNavigator from "./components/navigation/stacks/CategoriesStack";
import CustomersStackNavigator from "./components/navigation/stacks/CustomersStack";

import MedicineTypesStackNavigator from "./components/navigation/stacks/MedicineTypesStack";
import OrdersStackNavigator from "./components/navigation/stacks/OrdersStack";
import PackagesStackNavigator from "./components/navigation/stacks/PackagesStack";
import ProductsStackNavigator from "./components/navigation/stacks/ProductsStack";
import ReportsStackNavigator from "./components/navigation/stacks/ReportsStack";
import SellersStackNavigator from "./components/navigation/stacks/SellersStack";
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

// All screens definition (component mapping)
const SCREEN_COMPONENTS = {
  Dashboard: DashboardScreen,
  Products: ProductsStackNavigator,
  Stocks: StocksStackNavigator,
  Orders: OrdersStackNavigator,
  Invoices: DashboardScreen,
  Reports: ReportsStackNavigator,
  Customers: CustomersStackNavigator,
  Categories: CategoriesStackNavigator,
  Brands: BrandsStackNavigator,
  Units: UnitsStackNavigator,
  MedicineTypes: MedicineTypesStackNavigator,
  Packages: PackagesStackNavigator,
  Stores: StoresStackNavigator,
  Sellers: SellersStackNavigator,
  GST: DashboardScreen,
  Plans: DashboardScreen,
  SocialLink: DashboardScreen,
  Settings: SettingsStackNavigator,
};

// Dynamic icon mapping
const ICON_MAP = {
  dashboard: 'view-dashboard',
  products: 'package-variant',
  categories: 'shape',
  brands: 'trademark',
  units: 'ruler',
  'medicine-types': 'medical-bag',
  stores: 'store',
  packages: 'package-variant-closed',
  stock: 'warehouse',
  seller: 'account-group',
  orders: 'cart',
  customers: 'account-group',
  invoices: 'file-document',
  reports: 'chart-bar',
  gst: 'currency-inr',
  plans: 'credit-card',
  'social-link': 'share-variant',
  settings: 'cog',
};

// Screen name mapping from slug to screen name
const SCREEN_MAP = {
  dashboard: 'Dashboard',
  products: 'Products',
  categories: 'Categories',
  brands: 'Brands',
  units: 'Units',
  'medicine-types': 'MedicineTypes',
  stores: 'Stores',
  packages: 'Packages',
  stock: 'Stocks',
  seller: 'Sellers',
  orders: 'Orders',
  customers: 'Customers',
  invoices: 'Invoices',
  reports: 'Reports',
  gst: 'GST',
  plans: 'Plans',
  'social-link': 'SocialLink',
  settings: 'Settings',
};

// Main Drawer Navigator
const DrawerNavigator = () => {
  const { sidebarPermissions } = usePermissionStore();

  console.log("🔍 Sidebar Permissions:", sidebarPermissions);

  // Generate screens dynamically from API permissions
  const visibleScreens = sidebarPermissions
    .filter(p => p && p.status === 1)
    .map(permission => {
      const screenName = SCREEN_MAP[permission.slug] || permission.name;
      const component = SCREEN_COMPONENTS[screenName] || DashboardScreen;
      const icon = ICON_MAP[permission.slug] || 'circle';

      return {
        name: screenName,
        component: component,
        icon: icon,
        title: permission.name,
      };
    });

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
            title: screen.title,
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
