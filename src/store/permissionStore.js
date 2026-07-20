// store/permissionStore.js - UPDATED for new client response
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/auth';

// Permission constants for type safety and scalability
export const PERMISSIONS = {
  STOCK_MANAGEMENT: 'stock-management',
  BILL_GENERATION: 'bill-generation',
  REPORTS: 'reports',
  CUSTOMER_MANAGEMENT: 'customer-management',
  PRODUCT_MANAGEMENT: 'product-management',
  DASHBOARD: 'dashboard',
  SETTINGS: 'settings',
  ORDERS: 'orders',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  UNITS: 'units',
  STORES: 'stores',
  SELLER: 'seller',
  INVOICES: 'invoices',
  GST: 'gst',
  PLANS: 'plans',
  STOCK: 'stock',
  SOCIAL_LINK: 'social-link',
};

export const PERMISSION_GROUPS = {
  BASIC: [PERMISSIONS.DASHBOARD],
  STANDARD: [PERMISSIONS.DASHBOARD, PERMISSIONS.PRODUCT_MANAGEMENT, PERMISSIONS.CUSTOMER_MANAGEMENT],
  PREMIUM: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.PRODUCT_MANAGEMENT,
    PERMISSIONS.CUSTOMER_MANAGEMENT,
    PERMISSIONS.STOCK_MANAGEMENT,
    PERMISSIONS.BILL_GENERATION,
    PERMISSIONS.REPORTS
  ],
  ENTERPRISE: Object.values(PERMISSIONS)
};

// Menu items configuration (matching desktop pathMap)
export const MENU_ITEMS = {
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'view-dashboard',
    iconActive: 'view-dashboard',
    label: 'Home',
    order: 1,
    screen: 'Dashboard',
    slug: 'dashboard',
  },
  products: {
    id: 'products',
    name: 'Products',
    icon: 'package-variant',
    iconActive: 'package-variant',
    label: 'Products',
    order: 2,
    screen: 'Products',
    stack: 'ProductsStack',
    slug: 'products',
  },
  categories: {
    id: 'categories',
    name: 'Categories',
    icon: 'shape',
    iconActive: 'shape',
    label: 'Categories',
    order: 3,
    screen: 'Categories',
    stack: 'CategoriesStack',
    slug: 'categories',
  },
  brands: {
    id: 'brands',
    name: 'Brands',
    icon: 'trademark',
    iconActive: 'trademark',
    label: 'Brands',
    order: 4,
    screen: 'Brands',
    stack: 'BrandsStack',
    slug: 'brands',
  },
  units: {
    id: 'units',
    name: 'Units',
    icon: 'ruler',
    iconActive: 'ruler',
    label: 'Units',
    order: 5,
    screen: 'Units',
    stack: 'UnitsStack',
    slug: 'units',
  },
  'medicine-types': {
    id: 'medicine-types',
    name: 'Medicine Types',
    icon: 'medical-bag',
    iconActive: 'medical-bag',
    label: 'Medicine Types',
    order: 6,
    screen: 'MedicineTypes',
    stack: 'MedicineTypesStack',
    slug: 'medicine-types',
  },
  packages: {
    id: 'packages',
    name: 'Packages',
    icon: 'package-variant-closed',
    iconActive: 'package-variant-closed',
    label: 'Packages',
    order: 7,
    screen: 'Packages',
    stack: 'PackagesStack',
    slug: 'packages',
  },
  stores: {
    id: 'stores',
    name: 'Stores',
    icon: 'store',
    iconActive: 'store',
    label: 'Stores',
    order: 8,
    screen: 'Stores',
    stack: 'StoresStack',
    slug: 'stores',
  },
  seller: {
    id: 'seller',
    name: 'Sellers',
    icon: 'account-group',
    iconActive: 'account-group',
    label: 'Sellers',
    order: 9,
    screen: 'Sellers',
    stack: 'SellersStack',
    slug: 'seller',
  },
  stock: {
    id: 'stock',
    name: 'Stock',
    icon: 'warehouse',
    iconActive: 'warehouse',
    label: 'Stock',
    order: 10,
    screen: 'Stocks',
    stack: 'StocksStack',
    slug: 'stock',
  },
  orders: {
    id: 'orders',
    name: 'Orders',
    icon: 'cart',
    iconActive: 'cart',
    label: 'Orders',
    order: 11,
    screen: 'Orders',
    stack: 'OrdersStack',
    slug: 'orders',
  },
  customers: {
    id: 'customers',
    name: 'Customers',
    icon: 'account-group',
    iconActive: 'account-group',
    label: 'Customers',
    order: 12,
    screen: 'Customers',
    stack: 'CustomersStack',
    slug: 'customers',
  },
  invoices: {
    id: 'invoices',
    name: 'Invoices',
    icon: 'file-document',
    iconActive: 'file-document',
    label: 'Invoices',
    order: 13,
    screen: 'Invoices',
    stack: 'InvoicesStack',
    slug: 'invoices',
  },
  reports: {
    id: 'reports',
    name: 'Reports',
    icon: 'chart-bar',
    iconActive: 'chart-bar',
    label: 'Reports',
    order: 14,
    screen: 'Reports',
    stack: 'ReportsStack',
    slug: 'reports',
  },
  gst: {
    id: 'gst',
    name: 'GST',
    icon: 'currency-inr',
    iconActive: 'currency-inr',
    label: 'GST',
    order: 15,
    screen: 'GST',
    stack: null,
    slug: 'gst',
  },
  plans: {
    id: 'plans',
    name: 'Plans',
    icon: 'credit-card',
    iconActive: 'credit-card',
    label: 'Billing',
    order: 16,
    screen: 'Plans',
    stack: null,
    slug: 'plans',
  },
  'social-link': {
    id: 'social-link',
    name: 'Social Link',
    icon: 'share-variant',
    iconActive: 'share-variant',
    label: 'Social Link',
    order: 17,
    screen: 'SocialLink',
    stack: null,
    slug: 'social-link',
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    icon: 'cog',
    iconActive: 'cog',
    label: 'Settings',
    order: 18,
    screen: 'Settings',
    stack: 'SettingsStack',
    slug: 'settings',
  },
};

export const usePermissionStore = create(
  persist(
    (set, get) => ({
      user: null,
      plan: null,
      permissions: [],
      sidebarPermissions: [],
      loading: false,
      error: null,
      permissionsFetched: false,
      lastFetched: null,
      retryCount: 0,
      maxRetries: 3,

      // Helper to extract data from response (since interceptor no longer unwraps)
      _extractDataFromResponse: (response) => {
        const responseData = response?.data || response;
        
        // If response has status and data structure
        if (responseData?.status === true && responseData?.data) {
          return responseData.data;
        }
        
        // If response has data property
        if (responseData?.data) {
          return responseData.data;
        }
        
        // If response is the data itself
        return responseData;
      },

      setUser: (userData) => {
        set({ 
          user: userData,
          error: null,
          retryCount: 0
        });
      },

      fetchUserPermissions: async (userId, planId, retryAttempt = 0) => {
        try {
          const state = get();
          
          if (state.loading && retryAttempt === 0) {
            console.log('🔄 Permission fetch already in progress');
            return;
          }

          set({ loading: true, error: null });
          
          if (!planId) {
            console.warn('⚠️ No plan_id found for user');
            set({ 
              loading: false,
              permissionsFetched: true,
              lastFetched: new Date().toISOString()
            });
            return;
          }
          
          console.log(`🔐 Fetching permissions (attempt ${retryAttempt + 1}/${state.maxRetries + 1})`);
          
          const response = await authAPI.getUserPermissions(userId, planId);
          console.log('📦 Permissions API Response:', response);
          
          // ✅ Extract data from response using helper
          const data = get()._extractDataFromResponse(response);
          
          // Check if we have valid data
          if (data && typeof data === 'object') {
            // Get permissions from API
            let permissions = data.permissionNames || [];
            
            // Get sidebar permissions from API response (like desktop)
            let sidebarPermissions = data.customer_sidebar_permission || [];
            
            // Validate and filter sidebar permissions
            const validatedSidebarPermissions = sidebarPermissions.filter(p => 
              p && typeof p === 'object' && p.slug && typeof p.slug === 'string' && p.status === 1
            );
            
            set({
              plan: data['Single Plan'] || null,
              permissions: permissions,
              sidebarPermissions: validatedSidebarPermissions,
              loading: false,
              permissionsFetched: true,
              lastFetched: new Date().toISOString(),
              retryCount: 0,
              error: null
            });
            
            console.log(`✅ Successfully loaded ${permissions.length} permissions and ${validatedSidebarPermissions.length} sidebar permissions`);
          } else {
            throw new Error('Invalid plan response structure');
          }
        } catch (error) {
          console.error(`❌ Failed to fetch permissions:`, error);
          
          const state = get();
          
          if (retryAttempt < state.maxRetries) {
            console.log(`🔄 Retrying in ${1000 * (retryAttempt + 1)}ms...`);
            setTimeout(() => {
              get().fetchUserPermissions(userId, planId, retryAttempt + 1);
            }, 1000 * (retryAttempt + 1));
            set({ retryCount: retryAttempt + 1 });
            return;
          }
          
          set({ 
            error: `Failed to fetch permissions: ${error.message}`,
            loading: false,
            permissionsFetched: true,
            retryCount: state.maxRetries
          });
        }
      },

      hasPermission: (permissionSlug) => {
        const { permissions } = get();
        if (!permissionSlug) return false;
        return permissions.some(p => p.slug === permissionSlug);
      },

      // Check if user can access sidebar menu (matching desktop canAccess)
      canAccessSidebar: (menuSlug) => {
        const { sidebarPermissions } = get();
        
        if (!sidebarPermissions || sidebarPermissions.length === 0) {
          return true; // Allow access if no permissions loaded yet
        }
        
        return sidebarPermissions.some(p => p.slug === menuSlug);
      },

      // Get menu items filtered by user permissions
      getFilteredMenuItems: () => {
        const { sidebarPermissions } = get();
        const menuItems = Object.values(MENU_ITEMS);
        
        if (!sidebarPermissions || sidebarPermissions.length === 0) {
          return menuItems;
        }
        
        const allowedSlugs = sidebarPermissions.map(p => p.slug);
        return menuItems.filter(item => allowedSlugs.includes(item.slug));
      },

      clearPermissions: () => {
        set({
          user: null,
          plan: null,
          permissions: [],
          sidebarPermissions: [],
          loading: false,
          error: null,
          permissionsFetched: false,
          lastFetched: null,
          retryCount: 0
        });
      }
    }),
    {
      name: 'permission-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        permissions: state.permissions,
        sidebarPermissions: state.sidebarPermissions,
        permissionsFetched: state.permissionsFetched,
        lastFetched: state.lastFetched
      })
    }
  )
);