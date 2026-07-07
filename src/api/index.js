// Central API exports with mock support
import { authAPI } from './auth';
import { productsAPI } from './products';
import { brandsAPI } from './brands';
import { categoriesAPI } from './categories';
import { unitsAPI } from './units';
import { stocksAPI } from './stocks';

import { storesAPI } from './stores';
import { customersAPI } from './customers';
import { dashboardAPI } from './dashboard';
import { reportsAPI } from './reports';
import { invoiceAPI } from './invoices';

// API Configuration
export const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
export const PROJECT_MODE = process.env.EXPO_PUBLIC_PROJECT_MODE || 'mock';
export const TIMEOUT = process.env.EXPO_PUBLIC_API_TIMEOUT || 30000;

// Utility functions
export const isMockMode = () => PROJECT_MODE === 'mock';
export const getApiBaseUrl = () => BASE_URL;

// Export all APIs
export {
  // Authentication
  authAPI,
  
  // Products
  productsAPI,
  
  // Brands, Categories, Units
  brandsAPI,
  categoriesAPI,
  unitsAPI,
  
  // Stocks
  stocksAPI,

  // Stores
  storesAPI,
  
  // Customers
  customersAPI,
  
  // Dashboard
  dashboardAPI,
  
  // Reports
  reportsAPI,
  
  // Invoices
  invoiceAPI,
};

// Legacy exports for backward compatibility
export { authAPI as default };
