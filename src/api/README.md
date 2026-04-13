# API Layer Documentation

This API layer provides a comprehensive, scalable solution for your React Native Expo app with support for both real API endpoints and mock data.

## Features

- ✅ **Mock Mode Support**: Switch between mock and real API using environment variables
- ✅ **Dark Mode Compatible**: All APIs work with your existing theme system
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Type Safety**: Consistent data structures across all endpoints
- ✅ **Performance Optimized**: Efficient caching and request handling
- ✅ **Scalable Architecture**: Easy to extend with new endpoints

## Environment Configuration

Create a `.env` file in your project root:

```env
# Project Mode: 'mock' or 'real'
EXPO_PUBLIC_PROJECT_MODE=mock

# API Base URL (only used when PROJECT_MODE=real)
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

## API Modules

### 1. Authentication API (`authAPI`)

```javascript
import { authAPI } from '../api';

// Register new user
const registerUser = async (userData) => {
  try {
    const response = await authAPI.register({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      password: 'password123',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      pincode: '10001',
      companyName: 'ACME Corp',
      gstNumber: 'GST123456',
      address: '123 Main St',
    });
    console.log('User registered:', response.data);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    const response = await authAPI.login(email, password);
    // Store token and user data
    await AsyncStorage.setItem('authToken', response.data.token);
    await AsyncStorage.setItem('userId', response.data.user.id.toString());
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Logout user
const logoutUser = async (userId) => {
  try {
    await authAPI.logout(userId);
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

### 2. Products API (`productsAPI`)

```javascript
import { productsAPI } from '../api';

// Get all products
const getAllProducts = async () => {
  try {
    const response = await productsAPI.getAll({
      brand_id: 1,
      category_id: 2,
      search: 't-shirt',
    });
    return response.data.products;
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }
};

// Create new product
const createProduct = async (productData) => {
  try {
    const response = await productsAPI.create({
      userId: 1,
      sku: 'PRD003',
      name: 'New Product',
      brandId: 1,
      categoryId: 2,
      unitAmount: 1,
      unitId: 1,
      sellingPrice: 99.99,
      purchasePrice: 50.00,
      gstPercentage: 5,
      discountPercentage: 10,
      description: 'Product description',
      createdBy: 1,
    });
    return response.data.product;
  } catch (error) {
    console.error('Failed to create product:', error);
  }
};

// Update product
const updateProduct = async (productId, updateData) => {
  try {
    const response = await productsAPI.update(productId, updateData);
    return response.data.product;
  } catch (error) {
    console.error('Failed to update product:', error);
  }
};
```

### 3. Brands API (`brandsAPI`)

```javascript
import { brandsAPI } from '../api';

// Get all brands
const getAllBrands = async () => {
  try {
    const response = await brandsAPI.getAll();
    return response.data.brands;
  } catch (error) {
    console.error('Failed to fetch brands:', error);
  }
};

// Create new brand
const createBrand = async (brandData) => {
  try {
    const response = await brandsAPI.create({
      userId: 1,
      name: 'New Brand',
      description: 'Brand description',
      isActive: true,
      createdBy: 1,
    });
    return response.data.brand;
  } catch (error) {
    console.error('Failed to create brand:', error);
  }
};

// Get categories
const getCategories = async () => {
  try {
    const response = await brandsAPI.getCategories();
    return response.data.categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};

// Get units
const getUnits = async () => {
  try {
    const response = await brandsAPI.getUnits();
    return response.data.units;
  } catch (error) {
    console.error('Failed to fetch units:', error);
  }
};
```

### 4. Stocks API (`stocksAPI`)

```javascript
import { stocksAPI } from '../api';

// Get all stocks
const getAllStocks = async () => {
  try {
    const response = await stocksAPI.getAll({
      user_id: 1,
      low_stock: 10, // Get items with stock below 10
    });
    return response.data.stocks;
  } catch (error) {
    console.error('Failed to fetch stocks:', error);
  }
};

// Create new stock
const createStock = async (stockData) => {
  try {
    const response = await stocksAPI.create({
      userId: 1,
      productId: 1,
      quantity: 100,
      sellingPrice: 29.99,
      purchasePrice: 15.50,
      unitId: 1,
      createdBy: 1,
    });
    return response.data.stock;
  } catch (error) {
    console.error('Failed to create stock:', error);
  }
};

// Add stock to existing item
const addStock = async (stockId, quantity, price) => {
  try {
    const response = await stocksAPI.addStock(stockId, quantity, price);
    return response.data.stock;
  } catch (error) {
    console.error('Failed to add stock:', error);
  }
};
```

### 5. Invoices API (`invoicesAPI`)

```javascript
import { invoicesAPI } from '../api';

// Get all invoices
const getAllInvoices = async () => {
  try {
    const response = await invoicesAPI.getAll({
      customer_id: 1,
      store_id: 1,
      status: 'paid',
    });
    return response.data.invoices;
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
  }
};

// Create new invoice
const createInvoice = async (invoiceData) => {
  try {
    const response = await invoicesAPI.create({
      userId: 1,
      customerId: 1,
      storeId: 1,
      paidAmount: 500.00,
      createdBy: 1,
      items: [
        {
          productId: 1,
          quantity: 5,
          unitId: 1,
          price: 29.99,
          gst: 5,
          discount: 0,
          totalPrice: 149.95,
        },
      ],
    });
    return response.data.invoice;
  } catch (error) {
    console.error('Failed to create invoice:', error);
  }
};
```

### 6. Stores API (`storesAPI`)

```javascript
import { storesAPI } from '../api';

// Get all stores for a user
const getUserStores = async (userId) => {
  try {
    const response = await storesAPI.getAll(userId);
    return response.data.stores;
  } catch (error) {
    console.error('Failed to fetch stores:', error);
  }
};

// Create new store
const createStore = async (storeData) => {
  try {
    const response = await storesAPI.create({
      userId: 1,
      name: 'Main Store',
      email: 'store@example.com',
      mobile: '+1234567890',
      address: '123 Main St',
      city: 'New York',
      status: 'active',
      createdBy: 1,
    });
    return response.data.store;
  } catch (error) {
    console.error('Failed to create store:', error);
  }
};
```

### 7. Customers API (`customersAPI`)

```javascript
import { customersAPI } from '../api';

// Get all customers for admin
const getAdminCustomers = async (adminId) => {
  try {
    const response = await customersAPI.getAll(adminId, {
      status: 'active',
      search: 'john',
    });
    return response.data.customers;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
  }
};

// Create new customer
const createCustomer = async (customerData) => {
  try {
    const response = await customersAPI.create({
      adminId: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'New York',
      createdBy: 1,
    });
    return response.data.customer;
  } catch (error) {
    console.error('Failed to create customer:', error);
  }
};
```

## Error Handling

All API methods throw errors that you should catch and handle appropriately:

```javascript
try {
  const response = await productsAPI.create(productData);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Server Error:', error.response.data.message);
  } else if (error.request) {
    // Network error
    console.error('Network Error:', error.message);
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```

## Mock Data

When `EXPO_PUBLIC_PROJECT_MODE=mock`, all APIs will use realistic mock data with:
- Realistic data structures
- Simulated network delays (300-500ms)
- Full CRUD operations
- Data persistence within the session

## Utility Functions

```javascript
import { isMockMode, getApiBaseUrl } from '../api';

// Check if running in mock mode
if (isMockMode()) {
  console.log('Running in mock mode');
}

// Get API base URL
const apiUrl = getApiBaseUrl();
console.log('API URL:', apiUrl);
```

## Best Practices

1. **Always handle errors** with try-catch blocks
2. **Use the mock mode** for development and testing
3. **Store auth tokens** securely using AsyncStorage
4. **Handle loading states** in your UI components
5. **Use the provided data structures** for consistency
6. **Check network connectivity** before making requests

## File Structure

```
src/api/
├── index.js              # Central exports
├── client.js             # Axios client configuration
├── auth.js               # Authentication endpoints
├── products.js           # Product management
├── brands.js             # Brand, category, unit management
├── stocks.js             # Stock management
├── invoices.js           # Invoice/billing
├── stores.js             # Store/shop management
├── customers.js          # Customer management
└── mock/                 # Mock data implementations
    ├── auth.js
    ├── products.js
    ├── brands.js
    ├── stocks.js
    ├── invoices.js
    ├── stores.js
    └── customers.js
```

This API layer provides a solid foundation for your React Native Expo app with excellent developer experience and production-ready features.
