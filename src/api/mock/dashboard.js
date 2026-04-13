// Mock dashboard data and functions
const mockDashboardData = {
  stats: {
    totalRevenue: 125890,
    totalOrders: 1256,
    totalCustomers: 892,
    totalProducts: 342,
    revenueTrend: 12.5,
    ordersTrend: 8.2,
    customersTrend: 5.7,
    productsTrend: 3.1,
  },
  revenueData: {
    daily: [
      { date: "Mon", revenue: 4500 },
      { date: "Tue", revenue: 6200 },
      { date: "Wed", revenue: 5800 },
      { date: "Thu", revenue: 7100 },
      { date: "Fri", revenue: 8900 },
      { date: "Sat", revenue: 10500 },
      { date: "Sun", revenue: 8200 },
    ],
    weekly: [
      { week: "W1", revenue: 45200 },
      { week: "W2", revenue: 48900 },
      { week: "W3", revenue: 52300 },
      { week: "W4", revenue: 57800 },
    ],
    monthly: [
      { month: "Jan", revenue: 45200 },
      { month: "Feb", revenue: 48900 },
      { month: "Mar", revenue: 52300 },
      { month: "Apr", revenue: 57800 },
      { month: "May", revenue: 61200 },
      { month: "Jun", revenue: 65800 },
    ],
  },
  orderStatus: {
    pending: 45,
    processing: 78,
    shipped: 123,
    delivered: 890,
    cancelled: 34,
  },
  topProducts: [
    {
      id: 1,
      name: "Classic White T-Shirt",
      sales: 245,
      revenue: 7350,
      trend: "+12%",
    },
    { id: 2, name: "Slim Fit Jeans", sales: 189, revenue: 15120, trend: "+8%" },
    {
      id: 3,
      name: "Leather Sneakers",
      sales: 156,
      revenue: 14040,
      trend: "+15%",
    },
    {
      id: 4,
      name: "Cashmere Sweater",
      sales: 134,
      revenue: 13400,
      trend: "+5%",
    },
    { id: 5, name: "Sports Watch", sales: 98, revenue: 7840, trend: "+22%" },
  ],
  recentOrders: [
    {
      id: "ORD-001",
      orderNumber: "ORD-001",
      customer: { name: "John Smith" },
      total: 299.99,
      status: "delivered",
      items: [{ quantity: 3 }],
      createdAt: "2024-03-15T10:30:00Z",
    },
    {
      id: "ORD-002",
      orderNumber: "ORD-002",
      customer: { name: "Emma Wilson" },
      total: 189.5,
      status: "processing",
      items: [{ quantity: 2 }],
      createdAt: "2024-03-14T14:20:00Z",
    },
    {
      id: "ORD-003",
      orderNumber: "ORD-003",
      customer: { name: "Michael Brown" },
      total: 79.99,
      status: "pending",
      items: [{ quantity: 1 }],
      createdAt: "2024-03-14T09:15:00Z",
    },
    {
      id: "ORD-004",
      orderNumber: "ORD-004",
      customer: { name: "Sarah Davis" },
      total: 459.99,
      status: "shipped",
      items: [{ quantity: 4 }],
      createdAt: "2024-03-13T16:45:00Z",
    },
    {
      id: "ORD-005",
      orderNumber: "ORD-005",
      customer: { name: "David Lee" },
      total: 129.99,
      status: "delivered",
      items: [{ quantity: 2 }],
      createdAt: "2024-03-13T11:30:00Z",
    },
  ],
};

const mockDashboard = {
  get: async (endpoint) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    switch (endpoint) {
      case '/dashboard/overview':
        return {
          data: {
            success: true,
            stats: mockDashboardData.stats,
            revenueData: mockDashboardData.revenueData,
            orderStatus: mockDashboardData.orderStatus,
            topProducts: mockDashboardData.topProducts,
            recentOrders: mockDashboardData.recentOrders,
          }
        };

      case '/dashboard/revenue':
        return {
          data: {
            success: true,
            revenueData: mockDashboardData.revenueData,
          }
        };

      case '/dashboard/sales':
        return {
          data: {
            success: true,
            stats: mockDashboardData.stats,
          }
        };

      case '/dashboard/top-products':
        return {
          data: {
            success: true,
            products: mockDashboardData.topProducts,
          }
        };

      case '/dashboard/top-customers':
        return {
          data: {
            success: true,
            customers: [
              { name: "John Smith", orders: 45, spent: 5432.50 },
              { name: "Emma Wilson", orders: 32, spent: 3210.00 },
              { name: "Michael Brown", orders: 28, spent: 2890.75 },
              { name: "Sarah Davis", orders: 41, spent: 4156.25 },
              { name: "David Lee", orders: 19, spent: 1876.50 },
            ],
          }
        };

      case '/dashboard/recent-orders':
        return {
          data: {
            success: true,
            orders: mockDashboardData.recentOrders,
          }
        };

      case '/dashboard/inventory-alerts':
        return {
          data: {
            success: true,
            alerts: [
              { product: "Classic White T-Shirt", currentStock: 15, minStock: 20 },
              { product: "Slim Fit Jeans", currentStock: 8, minStock: 15 },
              { product: "Leather Sneakers", currentStock: 12, minStock: 10 },
            ],
          }
        };

      case '/dashboard/order-stats':
        return {
          data: {
            success: true,
            status: mockDashboardData.orderStatus,
          }
        };

      case '/dashboard/customer-growth':
        return {
          data: {
            success: true,
            growth: {
              newCustomers: 45,
              returningCustomers: 892,
              growthRate: 5.7,
            },
          }
        };

      default:
        throw {
          response: {
            data: { message: 'Endpoint not found' }
          }
        };
    }
  },

  post: async (endpoint, data) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (endpoint) {
      default:
        throw {
          response: {
            data: { message: 'Endpoint not found' }
          }
        };
    }
  },

  put: async (endpoint, data) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    switch (endpoint) {
      default:
        throw {
          response: {
            data: { message: 'Endpoint not found' }
          }
        };
    }
  },
};

export { mockDashboard };
