// hooks/useReports.js
import { useState, useCallback } from 'react';
import { reportsAPI } from '../api/reports';

export const useReports = (initialParams = {}) => {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalProfit: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(false); // Changed from true to false
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Default to today if no dates provided
      const today = new Date().toISOString().split('T')[0];
      const queryParams = {
        start_date: params.start_date || today,
        end_date: params.end_date || today,
        ...params
      };

      console.log('Fetching reports with params:', queryParams);
      const response = await reportsAPI.getReports(queryParams);
      
      console.log('Raw API Response:', response);

      // Handle different API response structures
      let reportsData = [];
      let summaryData = {};

      // Handle real API response structure (based on actual API response)
      if (response?.data && response?.salesItem_details) {
        const apiData = response.data;
        const salesItems = response.salesItem_details;
        
        console.log('API Data:', apiData);
        console.log('Sales Items:', salesItems);
        
        // Extract reports from salesItem_details
        if (Array.isArray(salesItems) && salesItems.length > 0) {
          reportsData = salesItems.map((item, index) => ({
            id: item.id || index + 1,
            title: `Sales Report - ${new Date(item.created_at).toLocaleDateString()}`,
            type: 'sales',
            amount: parseFloat(item.total_amount) || 0,
            count: parseInt(item.total_items) || 1,
            date: item.created_at,
            description: `Sales report for order #${item.id}`,
            status: item.status || 'completed',
            details: [
              { label: 'Order ID', value: `#${item.id}` },
              { label: 'Customer', value: `Customer ${item.customer_id}` },
              { label: 'Store', value: `Store ${item.store_id}` },
              { label: 'Paid Amount', value: `$${parseFloat(item.paid_amount || 0).toFixed(2)}` },
              { label: 'Total Items', value: item.total_items || '1' }
            ]
          }));
        }
        
        // Extract summary from real API structure
        summaryData = {
          totalSales: parseFloat(apiData.total_sales_amount) || 0,
          totalPurchases: 0, // Not provided by real API
          totalProfit: 0, // Not provided by real API  
          totalOrders: parseInt(apiData.total_sales_items) || 0,
          totalDue: parseFloat(apiData.total_due) || 0,
          averageOrderValue: apiData.total_sales_amount && apiData.total_sales_items > 0 
            ? parseFloat(apiData.total_sales_amount) / parseInt(apiData.total_sales_items) 
            : 0,
          topProducts: [], // Not provided by real API
          lowStockItems: 0, // Not provided by real API
          customerDues: apiData.customer_dues || []
        };
        
        console.log('Processed Reports Data:', reportsData);
        console.log('Processed Summary Data:', summaryData);
      }
      // Handle mock API response structure
      else if (response?.data?.data && Array.isArray(response.data.data)) {
        reportsData = response.data.data;
        summaryData = response.data.summary || {};
      }
      // Fallback for other structures
      else if (response?.data) {
        if (Array.isArray(response.data)) {
          reportsData = response.data;
        } else {
          reportsData = response.data.reports || [];
          summaryData = response.data.summary || {};
        }
      } else if (Array.isArray(response)) {
        reportsData = response;
      }

      // Calculate summary if not provided by API
      if (Object.keys(summaryData).length === 0 && reportsData.length > 0) {
        summaryData = calculateSummary(reportsData);
      }

      setReports(reportsData);
      setSummary(summaryData);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch reports');
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false); // Make sure loading is set to false even on error
    }
  }, []);

  const refreshReports = useCallback(async (params = {}) => {
    try {
      await fetchReports(params);
    } catch (err) {
      console.error('Refresh reports error:', err);
    }
  }, [fetchReports]);

  const getReportsByDateRange = useCallback(async (startDate, endDate) => {
    return fetchReports({ start_date: startDate, end_date: endDate });
  }, [fetchReports]);

  const getReportSummary = useCallback(async (params = {}) => {
    try {
      const response = await reportsAPI.getReportSummary(params);
      let summaryData = {};

      if (response?.data?.data) {
        summaryData = response.data.data;
      } else if (response?.data) {
        summaryData = response.data;
      }

      return summaryData;
    } catch (err) {
      console.error('Get report summary error:', err);
      throw err;
    }
  }, []);

  const exportReports = useCallback(async (format = 'pdf', params = {}) => {
    try {
      const response = await reportsAPI.exportReports(format, params);
      return response.data;
    } catch (err) {
      console.error('Export reports error:', err);
      throw err;
    }
  }, []);

  // Helper function to calculate summary from reports data
  const calculateSummary = (data) => {
    return data.reduce((acc, report) => {
      if (report.type === 'sales') {
        acc.totalSales += report.amount || 0;
        acc.totalOrders += report.count || 0;
      } else if (report.type === 'purchases') {
        acc.totalPurchases += report.amount || 0;
      } else if (report.type === 'profits') {
        acc.totalProfit += report.amount || 0;
      }
      
      if (report.top_products) {
        acc.topProducts = [...acc.topProducts, ...(report.top_products || [])];
      }
      
      return acc;
    }, {
      totalSales: 0,
      totalPurchases: 0,
      totalProfit: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      topProducts: [],
      lowStockItems: 0,
    });
  };

  return {
    reports,
    summary,
    loading,
    error,
    fetchReports,
    refreshReports,
    getReportsByDateRange,
    getReportSummary,
    exportReports,
  };
};