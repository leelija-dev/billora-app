// components/navigation/MainNavigator.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { usePermissionStore } from "../../store/permissionStore";

// Import all screen components
import DashboardScreen from "../../screens/dashboard/DashboardScreen";
import BrandsStackNavigator from "./stacks/BrandsStack";
import CategoriesStackNavigator from "./stacks/CategoriesStack";
import CustomersStackNavigator from "./stacks/CustomersStack";
import GstStackNavigator from "./stacks/GstStack";

import MedicineTypesStackNavigator from "./stacks/MedicineTypesStack";
import OrdersStackNavigator from "./stacks/OrdersStack";
import PackagesStackNavigator from "./stacks/PackagesStack";
import ProductsStackNavigator from "./stacks/ProductsStack";
import ReportsStackNavigator from "./stacks/ReportsStack";
import SellersStackNavigator from "./stacks/SellersStack";
import SettingsStackNavigator from "./stacks/SettingsStack";
import StocksStackNavigator from "./stacks/StocksStack";
import StoresStackNavigator from "./stacks/StoresStack";
import UnitsStackNavigator from "./stacks/UnitsStack";
import InvoicesStackNavigator from "./stacks/InvoicesStack";

const Tab = createBottomTabNavigator();

// Map menu items to actual components
const COMPONENT_MAP = {
  Dashboard: DashboardScreen,
  Products: ProductsStackNavigator,
  Stocks: StocksStackNavigator,
  Orders: OrdersStackNavigator,
  Invoices: InvoicesStackNavigator,
  Reports: ReportsStackNavigator,
  Customers: CustomersStackNavigator,
  Categories: CategoriesStackNavigator,
  Brands: BrandsStackNavigator,
  Units: UnitsStackNavigator,
  MedicineTypes: MedicineTypesStackNavigator,
  Packages: PackagesStackNavigator,
  Stores: StoresStackNavigator,
  Sellers: SellersStackNavigator,
  GST: GstStackNavigator,
  Settings: SettingsStackNavigator,
};

const MainNavigator = () => {
  const { getFilteredMenuItems, sidebarPermissions } = usePermissionStore();

  // Get menu items filtered by user permissions (like desktop)
  const visibleTabs = useMemo(() => {
    const filteredItems = getFilteredMenuItems();

    // Convert to tab format and filter by permission
    return filteredItems
      .filter((item) => item.screen && COMPONENT_MAP[item.screen])
      .map((item) => ({
        name: item.screen,
        component: COMPONENT_MAP[item.screen],
        icon: item.icon,
        iconActive: item.iconActive,
        label: item.label,
        permission: item.slug,
      }));
  }, [sidebarPermissions]);

  console.log(
    "📱 Visible tabs:",
    visibleTabs.map((t) => t.name),
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      {visibleTabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused, color, size }) => (
              <Icon
                name={focused ? tab.iconActive : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default MainNavigator;
