// constants/navigationItems.js
import { NAVIGATION_SCREENS } from "../utils/constants";

export const NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "view-dashboard",
    iconActive: "view-dashboard",
    parent: null,
    screen: NAVIGATION_SCREENS.MAIN.DASHBOARD,
    badge: null,
  },
  {
    id: "products",
    title: "Products",
    icon: "package-variant",
    iconActive: "package-variant",
    parent: "ProductsStack",
    screen: NAVIGATION_SCREENS.MAIN.PRODUCTS,
    badge: null,
  },
  {
    id: "categories",
    title: "Categories",
    icon: "shape",
    iconActive: "shape",
    parent: "CategoriesStack",
    screen: NAVIGATION_SCREENS.MAIN.CATEGORIES,
    badge: null,
  },
  {
    id: "brands",
    title: "Brands",
    icon: "trademark",
    iconActive: "trademark",
    parent: "BrandsStack",
    screen: NAVIGATION_SCREENS.MAIN.BRANDS,
    badge: null,
  },
  {
    id: "units",
    title: "Units",
    icon: "ruler",
    iconActive: "ruler",
    parent: "UnitsStack",
    screen: NAVIGATION_SCREENS.MAIN.UNITS,
    badge: null,
  },
  {
    id: "stores",
    title: "Stores",
    icon: "store",
    iconActive: "store",
    parent: "StoresStack",
    screen: NAVIGATION_SCREENS.MAIN.STORES,
    badge: null,
  },
  {
    id: "stocks",
    title: "Stocks",
    icon: "warehouse",
    iconActive: "warehouse",
    parent: "StocksStack",
    screen: NAVIGATION_SCREENS.MAIN.STOCKS,
    badge: null,
  },
  {
    id: "bills",
    title: "Bills",
    icon: "file-document",
    iconActive: "file-document",
    parent: "BillsStack",
    screen: NAVIGATION_SCREENS.MAIN.BILLS,
    badge: null,
  },
  {
    id: "customers",
    title: "Customers",
    icon: "account-group",
    iconActive: "account-group",
    parent: "CustomersStack",
    screen: NAVIGATION_SCREENS.MAIN.CUSTOMERS,
    badge: null,
  },
  
  {
    id: "settings",
    title: "Settings",
    icon: "cog",
    iconActive: "cog",
    parent: "SettingsStack",
    screen: NAVIGATION_SCREENS.MAIN.SETTINGS,
    badge: null,
  },
  {
    id: "profile",
    title: "Profile",
    icon: "account",
    iconActive: "account",
    parent: "SettingsStack",
    screen: NAVIGATION_SCREENS.MAIN.PROFILE,
    badge: null,
  },
];

// Helper function to get navigation items with dynamic badges
export const getNavigationItemsWithBadges = (badges = {}) => {
  return NAVIGATION_ITEMS.map(item => ({
    ...item,
    badge: badges[item.id] || item.badge || null,
  }));
};