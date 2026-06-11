// components/navigation/MainNavigator.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import ModernTabBar from "./ModernTabBar";

// Import all screens
import DashboardScreen from "../../screens/dashboard/DashboardScreen";
import ProductsScreen from "../../screens/products/ProductsScreen";
import AddProductScreen from "../../screens/products/AddProductScreen";
import ProductDetailScreen from "../../screens/products/ProductDetailScreen";
import StocksScreen from "../../screens/stocks/StocksScreen";
import AddStockScreen from "../../screens/stocks/AddStockScreen";
import StockDetailScreen from "../../screens/stocks/StockDetailScreen";
import BillsScreen from "../../screens/bills/BillsScreen";
import CreateBillScreen from "../../screens/bills/CreateBillScreen";
import BillDetailScreen from "../../screens/bills/BillDetailScreen";
import ReportsScreen from "../../screens/reports/ReportsScreen";
import ReportDetailScreen from "../../screens/reports/ReportDetailScreen";
import CustomersScreen from "../../screens/customers/CustomersScreen";
import AddCustomerScreen from "../../screens/customers/AddCustomerScreen";
import CustomerDetailScreen from "../../screens/customers/CustomerDetailScreen";
import CategoriesScreen from "../../screens/categories/CategoriesScreen";
import AddCategoryScreen from "../../screens/categories/AddCategoryScreen";
import CategoryDetailScreen from "../../screens/categories/CategoryDetailScreen";
import BrandsScreen from "../../screens/brands/BrandsScreen";
import AddBrandScreen from "../../screens/brands/AddBrandScreen";
import BrandDetailScreen from "../../screens/brands/BrandDetailScreen";
import UnitsScreen from "../../screens/units/UnitsScreen";
import AddUnitScreen from "../../screens/units/AddUnitScreen";
import UnitDetailScreen from "../../screens/units/UnitDetailScreen";
import StoresScreen from "../../screens/stores/StoresScreen";
import AddStoreScreen from "../../screens/stores/AddStoreScreen";
import StoreDetailScreen from "../../screens/stores/StoreDetailScreen";
import SettingsScreen from "../../screens/settings/SettingsScreen";
import ProfileScreen from "../../screens/profile/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Products Stack Navigator
const ProductsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
};

// Stocks Stack Navigator
const StocksStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="StocksList" component={StocksScreen} />
      <Stack.Screen name="AddStock" component={AddStockScreen} />
      <Stack.Screen name="StockDetail" component={StockDetailScreen} />
    </Stack.Navigator>
  );
};

// Bills Stack Navigator
const BillsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="BillsList" component={BillsScreen} />
      <Stack.Screen name="CreateBill" component={CreateBillScreen} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} />
    </Stack.Navigator>
  );
};

// Reports Stack Navigator
const ReportsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="ReportsList" component={ReportsScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
    </Stack.Navigator>
  );
};

// Customers Stack Navigator
const CustomersStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="CustomersList" component={CustomersScreen} />
      <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    </Stack.Navigator>
  );
};

// Categories Stack Navigator
const CategoriesStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="CategoriesList" component={CategoriesScreen} />
      <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
      <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
    </Stack.Navigator>
  );
};

// Brands Stack Navigator
const BrandsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="BrandsList" component={BrandsScreen} />
      <Stack.Screen name="AddBrand" component={AddBrandScreen} />
      <Stack.Screen name="BrandDetail" component={BrandDetailScreen} />
    </Stack.Navigator>
  );
};

// Units Stack Navigator
const UnitsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="UnitsList" component={UnitsScreen} />
      <Stack.Screen name="AddUnit" component={AddUnitScreen} />
      <Stack.Screen name="UnitDetail" component={UnitDetailScreen} />
    </Stack.Navigator>
  );
};

// Stores Stack Navigator
const StoresStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="StoresList" component={StoresScreen} />
      <Stack.Screen name="AddStore" component={AddStoreScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

// Define all available tabs with their permissions
const ALL_TABS = [
  {
    name: "Dashboard",
    component: DashboardScreen,
    icon: "view-dashboard-outline",
    iconActive: "view-dashboard",
    label: "Home",
    sidebarPermission: "dashboard",
  },
  {
    name: "Products",
    component: ProductsStackNavigator,
    icon: "package-variant-closed",
    iconActive: "package-variant",
    label: "Products",
    sidebarPermission: "products",
  },
  {
    name: "Stocks",
    component: StocksStackNavigator,
    icon: "warehouse",
    iconActive: "warehouse",
    label: "Stocks",
    sidebarPermission: "inventory",
  },
  {
    name: "Bills",
    component: BillsStackNavigator,
    icon: "file-document-outline",
    iconActive: "file-document",
    label: "Bills",
    sidebarPermission: "orders",
  },
  {
    name: "Reports",
    component: ReportsStackNavigator,
    icon: "chart-bar",
    iconActive: "chart-bar",
    label: "Reports",
    sidebarPermission: "reports",
  },
  {
    name: "Customers",
    component: CustomersStackNavigator,
    icon: "account-group-outline",
    iconActive: "account-group",
    label: "Customers",
    sidebarPermission: "customers",
  },
  {
    name: "Categories",
    component: CategoriesStackNavigator,
    icon: "shape-outline",
    iconActive: "shape",
    label: "Categories",
    sidebarPermission: "categories",
  },
  {
    name: "Brands",
    component: BrandsStackNavigator,
    icon: "trademark",
    iconActive: "trademark",
    label: "Brands",
    sidebarPermission: "brands",
  },
  {
    name: "Units",
    component: UnitsStackNavigator,
    icon: "ruler",
    iconActive: "ruler",
    label: "Units",
    sidebarPermission: "units",
  },
  {
    name: "Stores",
    component: StoresStackNavigator,
    icon: "store",
    iconActive: "store",
    label: "Stores",
    sidebarPermission: "stores",
  },
  {
    name: "Settings",
    component: SettingsStackNavigator,
    icon: "cog-outline",
    iconActive: "cog",
    label: "Settings",
    sidebarPermission: "settings",
  },
];

const MainNavigator = () => {
  const { canAccessSidebar } = useAuthStore();

  // Filter tabs based on user permissions
  const visibleTabs = ALL_TABS.filter(tab => {
    return canAccessSidebar(tab.sidebarPermission);
  });

  // If no tabs are visible, show at least Dashboard
  const tabsToShow = visibleTabs.length > 0 ? visibleTabs : ALL_TABS.slice(0, 1);

  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar tabs={tabsToShow} {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabsToShow.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
        />
      ))}
    </Tab.Navigator>
  );
};

export default MainNavigator;