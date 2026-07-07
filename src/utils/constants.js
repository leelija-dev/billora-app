export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    PROFILE: '/auth/profile',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:id',
    CREATE: '/products',
    UPDATE: '/products/:id',
    DELETE: '/products/:id',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    STOCK: '/products/:id/stock',
  },
  ORDERS: {
    LIST: '/orders',
    DETAIL: '/orders/:id',
    CREATE: '/orders',
    UPDATE: '/orders/:id',
    DELETE: '/orders/:id',
    UPDATE_STATUS: '/orders/:id/status',
    STATS: '/orders/stats',
    SEARCH: '/orders/search',
    INVOICE: '/orders/:id/invoice',
  },
  CUSTOMERS: {
    LIST: '/customers',
    DETAIL: '/customers/:id',
    CREATE: '/customers',
    UPDATE: '/customers/:id',
    DELETE: '/customers/:id',
    SEARCH: '/customers/search',
    ORDERS: '/customers/:id/orders',
    STATS: '/customers/:id/stats',
  },
  INVENTORY: {
    LIST: '/inventory',
    DETAIL: '/inventory/:id',
    UPDATE: '/inventory/:id',
    MOVEMENTS: '/inventory/movements',
    CREATE_MOVEMENT: '/inventory/movements',
    LOW_STOCK: '/inventory/low-stock',
    STATS: '/inventory/stats',
    ADJUST: '/inventory/:id/adjust',
    TRANSFER: '/inventory/transfer',
  },
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    REVENUE: '/dashboard/revenue',
    SALES: '/dashboard/sales',
    TOP_PRODUCTS: '/dashboard/top-products',
    TOP_CUSTOMERS: '/dashboard/top-customers',
    RECENT_ORDERS: '/dashboard/recent-orders',
    INVENTORY_ALERTS: '/dashboard/inventory-alerts',
    ORDER_STATS: '/dashboard/order-stats',
    CUSTOMER_GROWTH: '/dashboard/customer-growth',
  },
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.REFUNDED]: 'Refunded',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.PAID]: 'Paid',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
};

export const STOCK_MOVEMENT_TYPE = {
  IN: 'in',
  OUT: 'out',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment',
};

export const STOCK_MOVEMENT_TYPE_LABELS = {
  [STOCK_MOVEMENT_TYPE.IN]: 'Stock In',
  [STOCK_MOVEMENT_TYPE.OUT]: 'Stock Out',
  [STOCK_MOVEMENT_TYPE.TRANSFER]: 'Transfer',
  [STOCK_MOVEMENT_TYPE.ADJUSTMENT]: 'Adjustment',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer',
};

export const USER_ROLES_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.EMPLOYEE]: 'Employee',
  [USER_ROLES.CUSTOMER]: 'Customer',
};

export const NAVIGATION_SCREENS = {
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
  },
  MAIN: {
    DASHBOARD: 'Dashboard',

     // Store screens
    STORES: 'Stores',
    STORE_DETAIL: 'StoreDetail',
    ADD_STORE: 'AddStore',
    
    // Products
    PRODUCTS: 'Products',
    PRODUCT_DETAIL: 'ProductDetail',
    ADD_PRODUCT: 'AddProduct',
    
    // Categories
    CATEGORIES: 'Categories',
    CATEGORY_DETAIL: 'CategoryDetail',
    ADD_CATEGORY: 'AddCategory',
    
    // Brands
    BRANDS: 'Brands',
    BRAND_DETAIL: 'BrandDetail',
    ADD_BRAND: 'AddBrand',
    
    // Units
    UNITS: 'Units',
    UNIT_DETAIL: 'UnitDetail',
    ADD_UNIT: 'AddUnit',
    
    // Medicine Types
    MEDICINE_TYPES: 'MedicineTypes',
    MEDICINE_TYPE_DETAIL: 'MedicineTypeDetail',
    ADD_MEDICINE_TYPE: 'AddMedicineType',
    
    // Packages
    PACKAGES: 'Packages',
    PACKAGE_DETAIL: 'PackageDetail',
    ADD_PACKAGE: 'AddPackage',
    
    BILLS: 'Bills',
    BILL_DETAIL: 'BillDetail',
    CREATE_BILL: 'CreateBill',
    
    // Invoices
    INVOICES: 'Invoices',
    INVOICE_DETAIL: 'InvoiceDetail',
    INVOICE_FORM: 'InvoiceForm',
    
    // Reports
    REPORTS: 'Reports',
    REPORT_DETAIL: 'ReportDetail',
    
    // Customers
    CUSTOMERS: 'Customers',
    CUSTOMER_DETAIL: 'CustomerDetail',
    ADD_CUSTOMER: 'AddCustomer',

    STOCKS: 'Stocks',
    STOCK_DETAIL: 'StockDetail',
    ADD_STOCK: 'AddStock',
    ADD_STOCK_QUANTITY: 'AddStockQuantity',
    
    // Inventory
    INVENTORY: 'Inventory',
    STOCK_MOVEMENT: 'StockMovement',
    
    
    // Settings
    SETTINGS: 'Settings',
    PROFILE: 'Profile',
  },
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PRODUCT_NAME_MAX_LENGTH: 100,
  PRODUCT_DESCRIPTION_MAX_LENGTH: 1000,
  CUSTOMER_NAME_MAX_LENGTH: 100,
  ORDER_NOTES_MAX_LENGTH: 500,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
};
