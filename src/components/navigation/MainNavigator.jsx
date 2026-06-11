// components/navigation/MainNavigator.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import { usePermissionStore, MENU_ITEMS } from "../../store/permissionStore";
import ModernTabBar from "./ModernTabBar";

// Import all screen components
import DashboardScreen from "../../screens/dashboard/DashboardScreen";
import ProductsStackNavigator from "./stacks/ProductsStack";
import StocksStackNavigator from "./stacks/StocksStack";
import BillsStackNavigator from "./stacks/BillsStack";
import ReportsStackNavigator from "./stacks/ReportsStack";
import CustomersStackNavigator from "./stacks/CustomersStack";
import CategoriesStackNavigator from "./stacks/CategoriesStack";
import BrandsStackNavigator from "./stacks/BrandsStack";
import UnitsStackNavigator from "./stacks/UnitsStack";
import StoresStackNavigator from "./stacks/StoresStack";
import SettingsStackNavigator from "./stacks/SettingsStack";

const Tab = createBottomTabNavigator();

// Map menu items to actual components
const COMPONENT_MAP = {
  Dashboard: DashboardScreen,
  Products: ProductsStackNavigator,
  Stocks: StocksStackNavigator,
  Bills: BillsStackNavigator,
  Reports: ReportsStackNavigator,
  Customers: CustomersStackNavigator,
  Categories: CategoriesStackNavigator,
  Brands: BrandsStackNavigator,
  Units: UnitsStackNavigator,
  Stores: StoresStackNavigator,
  Settings: SettingsStackNavigator,
};

const MainNavigator = () => {
  const { getFilteredMenuItems, sidebarPermissions } = usePermissionStore();

  // Get menu items filtered by user permissions (like desktop)
  const visibleTabs = useMemo(() => {
    const filteredItems = getFilteredMenuItems();
    
    // Convert to tab format and filter by permission
    return filteredItems
      .filter(item => item.screen && COMPONENT_MAP[item.screen])
      .map(item => ({
        name: item.screen,
        component: COMPONENT_MAP[item.screen],
        icon: item.icon,
        iconActive: item.iconActive,
        label: item.label,
        permission: item.slug,
      }));
  }, [sidebarPermissions]);

  console.log('📱 Visible tabs:', visibleTabs.map(t => t.name));

  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar tabs={visibleTabs} {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {visibleTabs.map((tab) => (
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