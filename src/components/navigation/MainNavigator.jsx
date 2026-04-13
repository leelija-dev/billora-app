import { Animated } from "react-native";
import { useState, useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Text, TouchableOpacity, View, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

// Import all screens
import AddCustomerScreen from "../../screens/customers/AddCustomerScreen";
import CustomerDetailScreen from "../../screens/customers/CustomerDetailScreen";
import CustomersScreen from "../../screens/customers/CustomersScreen";
import DashboardScreen from "../../screens/dashboard/DashboardScreen";

import AddProductScreen from "../../screens/products/AddProductScreen";
import ProductDetailScreen from "../../screens/products/ProductDetailScreen";
import ProductsScreen from "../../screens/products/ProductsScreen";
import ProfileScreen from "../../screens/profile/ProfileScreen";
import SettingsScreen from "../../screens/settings/SettingsScreen";

// Import Report Screens
import ReportsScreen from "../../screens/reports/ReportsScreen";
import ReportDetailScreen from "../../screens/reports/ReportDetailScreen";

// Import Category Screens
import CategoriesScreen from "../../screens/categories/CategoriesScreen";
import AddCategoryScreen from "../../screens/categories/AddCategoryScreen";
import CategoryDetailScreen from "../../screens/categories/CategoryDetailScreen";

// Import Brand Screens
import BrandsScreen from "../../screens/brands/BrandsScreen";
import AddBrandScreen from "../../screens/brands/AddBrandScreen";
import BrandDetailScreen from "../../screens/brands/BrandDetailScreen";

// Import Unit Screens
import UnitsScreen from "../../screens/units/UnitsScreen";
import AddUnitScreen from "../../screens/units/AddUnitScreen";
import UnitDetailScreen from "../../screens/units/UnitDetailScreen";

// Import Stock Screens
import StocksScreen from "../../screens/stocks/StocksScreen";
import AddStockScreen from "../../screens/stocks/AddStockScreen";
import StockDetailScreen from "../../screens/stocks/StockDetailScreen";
import AddStockQuantityScreen from "../../screens/stocks/AddStockQuantityScreen";

// Import Store Screens
import StoresScreen from "../../screens/stores/StoresScreen";
import AddStoreScreen from "../../screens/stores/AddStoreScreen";
import StoreDetailScreen from "../../screens/stores/StoreDetailScreen";

// Import Bill Screens
import BillsScreen from "../../screens/bills/BillsScreen";
import CreateBillScreen from "../../screens/bills/CreateBillScreen";
import BillDetailScreen from "../../screens/bills/BillDetailScreen";

import { NAVIGATION_SCREENS } from "../../utils/constants";

const { width } = Dimensions.get("window");
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Modern Header with Gradient (Dark Mode Aware)
const StackHeader = ({ title, navigation, showBack = true }) => {
  const { isDarkMode } = useThemeStore();

  return (
    <LinearGradient
      colors={isDarkMode ? ["#4f46e5", "#7c3aed"] : ["#6366F1", "#8B5CF6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="pt-12 pb-4 px-4"
      style={{
        shadowColor: isDarkMode ? "#4f46e5" : "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View className="flex-row items-center">
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 w-10 h-10 rounded-2xl bg-white/20 items-center justify-center"
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text className="text-2xl font-bold text-white flex-1">{title}</Text>
        {!showBack && (
          <View className="flex-row">
            <TouchableOpacity
              className="mr-3 w-10 h-10 rounded-2xl bg-white/20 items-center justify-center"
              activeOpacity={0.7}
            >
              <Icon name="bell-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center"
              activeOpacity={0.7}
            >
              <Icon name="magnify" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

// Products Stack with Dark Mode
const ProductsStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.PRODUCTS}
        component={ProductsScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Products"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.PRODUCT_DETAIL}
        component={ProductDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Product Details" navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.ADD_PRODUCT}
        component={AddProductScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Add Product" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Categories Stack with Dark Mode
const CategoriesStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.CATEGORIES}
        component={CategoriesScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Categories"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.CATEGORY_DETAIL}
        component={CategoryDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Category Details" navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.ADD_CATEGORY}
        component={AddCategoryScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Add Category" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Brands Stack with Dark Mode
const BrandsStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.BRANDS}
        component={BrandsScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Brands"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.BRAND_DETAIL}
        component={BrandDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Brand Details" navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.ADD_BRAND}
        component={AddBrandScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Add Brand" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Units Stack with Dark Mode
const UnitsStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.UNITS}
        component={UnitsScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Units"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.UNIT_DETAIL}
        component={UnitDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Unit Details" navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.ADD_UNIT}
        component={AddUnitScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Add Unit" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Stores Stack with Dark Mode
const StoresStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.STORES}
        component={StoresScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Stores"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.STORE_DETAIL}
        component={StoreDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Store Details" navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.ADD_STORE}
        component={AddStoreScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Add Store" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Customers Stack with Dark Mode
const CustomersStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.CUSTOMERS}
        component={CustomersScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Customers"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.CUSTOMER_DETAIL}
        component={CustomerDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Customer Profile" navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.ADD_CUSTOMER}
        component={AddCustomerScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Add Customer" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Stock Stack with Dark Mode
const StocksStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.STOCKS}
        component={StocksScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Stock Management"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.STOCK_DETAIL}
        component={StockDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Stock Details" navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.ADD_STOCK}
        component={AddStockScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Add Stock Entry" navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.ADD_STOCK_QUANTITY}
        component={AddStockQuantityScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Add Stock Quantity" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Bills Stack with Dark Mode
const BillsStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.BILLS}
        component={BillsScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Bills & Invoices"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.BILL_DETAIL}
        component={BillDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Bill Details" navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.CREATE_BILL}
        component={CreateBillScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Create Bill" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Reports Stack with Dark Mode
const ReportsStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.REPORTS}
        component={ReportsScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Reports & Analytics"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.REPORT_DETAIL}
        component={ReportDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Report Details" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Settings Stack with Dark Mode
const SettingsStack = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.SETTINGS}
        component={SettingsScreen}
        options={{
          header: ({ navigation }) => (
            <StackHeader
              title="Settings"
              navigation={navigation}
              showBack={false}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.MAIN.PROFILE}
        component={ProfileScreen}
        options={({ navigation }) => ({
          header: () => <StackHeader title="Profile" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

// Modern Tab Bar Component with Dark Mode support
const ModernTabBar = ({ state, descriptors, navigation }) => {
  const { isDarkMode } = useThemeStore();
  const [tabPositions, setTabPositions] = useState({});
  const [sliderWidth, setSliderWidth] = useState(0);
  const [sliderLeft, setSliderLeft] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  // Define all tabs we want to show in bottom bar - Now with Reports added
  const tabs = [
    {
      name: "Home",
      icon: "view-dashboard-outline",
      iconActive: "view-dashboard",
      label: "Home",
      screen: "Dashboard",
    },
    {
      name: "Products",
      icon: "package-variant-closed",
      iconActive: "package-variant",
      label: "Products",
      screen: "ProductsStack",
    },
    {
      name: "Stocks",
      icon: "warehouse",
      iconActive: "warehouse",
      label: "Stocks",
      screen: "StocksStack",
    },
    {
      name: "Bills",
      icon: "file-document-outline",
      iconActive: "file-document",
      label: "Bills",
      screen: "BillsStack",
    },
    {
      name: "Reports",
      icon: "chart-bar",
      iconActive: "chart-bar",
      label: "Reports",
      screen: "ReportsStack",
    },
  ];

  // Update slider position when active tab changes
  useEffect(() => {
    if (tabPositions[state.index]) {
      const { x, width } = tabPositions[state.index];

      Animated.spring(animation, {
        toValue: x,
        useNativeDriver: false,
        tension: 300,
        friction: 25,
      }).start();

      setSliderWidth(width);
    }
  }, [state.index, tabPositions]);

  const handleTabPress = (index) => {
    const event = navigation.emit({
      type: "tabPress",
      target: state.routes[index].key,
      canPreventDefault: true,
    });

    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(tabs[index].screen);
    }
  };

  const onTabLayout = (index, event) => {
    const { x, width } = event.nativeEvent.layout;
    setTabPositions(prev => ({
      ...prev,
      [index]: { x, width }
    }));

    // Set initial slider position for the first tab
    if (index === 0 && !tabPositions[0]) {
      setSliderWidth(width);
      animation.setValue(x);
    }
  };

  return (
    <View className="absolute bottom-0 left-0 right-0">
      <View className="mx-4 mb-2 rounded-3xl overflow-hidden">
        <BlurView
          intensity={50}
          tint={isDarkMode ? "dark" : "light"}
          className="overflow-hidden"
          style={{
            borderWidth: 0,
            backgroundColor: isDarkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.8)",
            padding: 0,
            borderRadius: 30,
          }}
        >
          <View
            className="flex-row items-center"
            style={{
              backgroundColor: isDarkMode
                ? "rgba(31, 41, 55, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              position: 'relative',
              height: 50,
            }}
          >
            {/* Animated Sliding Background */}
            <Animated.View
              style={{
                position: 'absolute',
                left: animation,
                width: sliderWidth,
                height: 50,
                backgroundColor: isDarkMode ? "#4f46e5" : "#6366F1",
                borderRadius: 30,
                marginVertical: 6,
              }}
            />

            {tabs.map((tab, index) => {
              const isFocused = state.index === index;

              return (
                <TouchableOpacity
                  key={tab.name}
                  onPress={() => handleTabPress(index)}
                  onLayout={(event) => onTabLayout(index, event)}
                  activeOpacity={0.7}
                  className="items-center justify-center flex-1"
                  style={{
                    flexDirection: "row",
                    paddingVertical: 12,
                    paddingHorizontal: isFocused ? 18 : 12,
                    zIndex: 1,
                  }}
                >
                  <Icon
                    name={isFocused ? tab.iconActive : tab.icon}
                    size={22}
                    color={isFocused
                      ? "white"
                      : isDarkMode ? "#9CA3AF" : "#6B7280"
                    }
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>

      {/* Extra invisible padding that fills the bottom gap */}
      <View
        style={{
          height: 20,
          backgroundColor: isDarkMode ? "#111827" : "#F8FAFC",
          width: "100%",
        }}
      />
    </View>
  );
};

// Main Navigator with modern design
const MainNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="ProductsStack" component={ProductsStack} />
      <Tab.Screen name="StocksStack" component={StocksStack} />
      <Tab.Screen name="BillsStack" component={BillsStack} />
      <Tab.Screen name="ReportsStack" component={ReportsStack} />
      
      {/* Hidden screens - accessible via navigation only */}
      <Tab.Screen 
        name="CategoriesStack" 
        component={CategoriesStack} 
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }} 
      />
      <Tab.Screen 
        name="StoresStack" 
        component={StoresStack} 
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tab.Screen 
        name="BrandsStack" 
        component={BrandsStack} 
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }} 
      />
      <Tab.Screen 
        name="UnitsStack" 
        component={UnitsStack} 
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }} 
      />
      <Tab.Screen 
        name="CustomersStack" 
        component={CustomersStack} 
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }} 
      />
      <Tab.Screen
        name="SettingsStack"
        component={SettingsStack}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;