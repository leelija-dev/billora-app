// Mock Reports Data Generator
import { format, addDays, subDays } from 'date-fns';

// Helper function to generate random number between min and max
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to generate random decimal
const randomDecimal = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

// Helper function to generate random date within range
const randomDate = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date;
};

// Generate mock reports data
export const generateMockReports = (startDate, endDate) => {
  const reports = [];
  const defaultStartDate = startDate || subDays(new Date(), 30);
  const defaultEndDate = endDate || new Date();
  
  // Sales Reports
  for (let i = 0; i < 8; i++) {
    const date = randomDate(defaultStartDate, defaultEndDate);
    reports.push({
      id: i + 1,
      title: `Sales Report - ${format(date, 'MMM dd, yyyy')}`,
      type: 'sales',
      amount: parseFloat(randomDecimal(10000, 100000)),
      count: randomBetween(5, 50),
      date: date.toISOString(),
      description: `Daily sales report showing total revenue and order count`,
      status: 'completed',
      details: [
        { label: 'Total Orders', value: randomBetween(5, 50) },
        { label: 'Average Order Value', value: `$${randomDecimal(200, 2000)}` },
        { label: 'Top Product', value: 'Puma Long Boot' }
      ]
    });
  }
  
  // Purchase Reports
  for (let i = 0; i < 5; i++) {
    const date = randomDate(defaultStartDate, defaultEndDate);
    reports.push({
      id: i + 9,
      title: `Purchase Report - ${format(date, 'MMM dd, yyyy')}`,
      type: 'purchases',
      amount: parseFloat(randomDecimal(5000, 50000)),
      count: randomBetween(2, 20),
      date: date.toISOString(),
      description: `Purchase report showing supplier orders and costs`,
      status: 'completed',
      details: [
        { label: 'Total Purchases', value: randomBetween(2, 20) },
        { label: 'Average Cost', value: `$${randomDecimal(100, 1000)}` },
        { label: 'Top Supplier', value: 'Nike Supplier Inc.' }
      ]
    });
  }
  
  // Inventory Reports
  for (let i = 0; i < 6; i++) {
    const date = randomDate(defaultStartDate, defaultEndDate);
    reports.push({
      id: i + 14,
      title: `Inventory Report - ${format(date, 'MMM dd, yyyy')}`,
      type: 'inventory',
      amount: parseFloat(randomDecimal(100000, 500000)),
      count: randomBetween(10, 100),
      date: date.toISOString(),
      description: `Inventory levels and stock movement report`,
      status: 'completed',
      details: [
        { label: 'Total Items', value: randomBetween(10, 100) },
        { label: 'Low Stock Items', value: randomBetween(0, 5) },
        { label: 'Out of Stock', value: randomBetween(0, 3) }
      ]
    });
  }
  
  // Profit Reports
  for (let i = 0; i < 4; i++) {
    const date = randomDate(defaultStartDate, defaultEndDate);
    reports.push({
      id: i + 20,
      title: `Profit Report - ${format(date, 'MMM dd, yyyy')}`,
      type: 'profits',
      amount: parseFloat(randomDecimal(20000, 80000)),
      count: randomBetween(1, 10),
      date: date.toISOString(),
      description: `Profit and loss analysis report`,
      status: 'completed',
      details: [
        { label: 'Gross Profit', value: `$${randomDecimal(30000, 100000)}` },
        { label: 'Net Profit', value: `$${randomDecimal(20000, 80000)}` },
        { label: 'Profit Margin', value: `${randomBetween(10, 25)}%` }
      ]
    });
  }
  
  // Sort by date (newest first)
  return reports.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Generate mock summary data
export const generateMockSummary = (reports) => {
  const summary = {
    totalSales: 0,
    totalPurchases: 0,
    totalProfit: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    lowStockItems: 0,
    reportCounts: {
      sales: 0,
      purchases: 0,
      inventory: 0,
      profits: 0
    }
  };
  
  reports.forEach(report => {
    switch (report.type) {
      case 'sales':
        summary.totalSales += report.amount || 0;
        summary.totalOrders += report.count || 0;
        summary.reportCounts.sales++;
        break;
      case 'purchases':
        summary.totalPurchases += report.amount || 0;
        summary.reportCounts.purchases++;
        break;
      case 'inventory':
        summary.lowStockItems += report.count || 0;
        summary.reportCounts.inventory++;
        break;
      case 'profits':
        summary.totalProfit += report.amount || 0;
        summary.reportCounts.profits++;
        break;
    }
  });
  
  // Calculate average order value
  if (summary.totalOrders > 0) {
    summary.averageOrderValue = summary.totalSales / summary.totalOrders;
  }
  
  // Add some top products
  summary.topProducts = [
    { name: 'Puma Long Boot', sales: '$51,425.00', trend: '+12%' },
    { name: 'Nike Air Max', sales: '$35,200.00', trend: '+8%' },
    { name: 'Adidas Ultra Boost', sales: '$28,900.00', trend: '-3%' }
  ];
  
  return summary;
};
