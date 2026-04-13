import { useState, useEffect } from 'react';
import { billsAPI } from '../api/bills';

export const useBills = (params = {}) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsAPI.getAll(params);
      console.log('useBills response:', response);
      
      // Handle API response structure: { data: { data: [...bills] } }
      let billsData = [];
      
      if (response?.data?.data?.data) {
        // Laravel pagination: { data: { data: [...bills], ...pagination } }
        billsData = response.data.data.data;
      } else if (response?.data?.data) {
        // Handle array of arrays - flatten if needed
        const dataArray = response.data.data;
        if (Array.isArray(dataArray) && dataArray.length > 0 && Array.isArray(dataArray[0])) {
          // If it's an array of arrays, flatten it
          billsData = dataArray.flat();
        } else {
          // Simple nested: { data: { data: [...bills] } }
          billsData = Array.isArray(response.data.data) ? response.data.data : [];
        }
      } else if (response?.data) {
        // Direct array: { data: [...bills] }
        billsData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        billsData = response;
      }
      
      setBills(billsData);
      
      // Calculate totals - only if we have valid bills data
      if (billsData.length > 0) {
        const total = billsData.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);
        const paid = billsData.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0);
        
        setTotalAmount(total);
        setTotalPaid(paid);
      } else {
        setTotalAmount(0);
        setTotalPaid(0);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const refreshBills = async () => {
    await fetchBills();
  };

  const searchBills = async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsAPI.search(query, filters);
      
      let billsData = [];
      
      if (response?.data?.data?.data) {
        // Laravel pagination: { data: { data: [...bills], ...pagination } }
        billsData = response.data.data.data;
      } else if (response?.data?.data) {
        // Simple nested: { data: { data: [...bills] } }
        billsData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (response?.data) {
        // Direct array: { data: [...bills] }
        billsData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        billsData = response;
      }
      
      setBills(billsData);
      
      // Calculate totals
      const total = billsData.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);
      const paid = billsData.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0);
      
      setTotalAmount(total);
      setTotalPaid(paid);
      
    } catch (err) {
      setError(err.message || 'Failed to search bills');
    } finally {
      setLoading(false);
    }
  };

  const filterByDateRange = async (startDate, endDate, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsAPI.getByDateRange(startDate, endDate, filters);
      
      let billsData = [];
      if (response?.data?.data?.data) {
        billsData = response.data.data.data;
      } else if (response?.data?.data) {
        billsData = response.data.data;
      } else if (response?.data) {
        billsData = response.data;
      } else if (Array.isArray(response)) {
        billsData = response;
      }
      
      setBills(billsData);
      
      // Calculate totals
      const total = billsData.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);
      const paid = billsData.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0);
      
      setTotalAmount(total);
      setTotalPaid(paid);
      
    } catch (err) {
      setError(err.message || 'Failed to filter bills by date');
    } finally {
      setLoading(false);
    }
  };

  const createBill = async (billData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsAPI.create(billData);
      
      // Refresh bills after creation
      await fetchBills();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to create bill');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateBill = async (id, billData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsAPI.update(id, billData);
      
      // Refresh bills after update
      await fetchBills();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to update bill');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteBill = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await billsAPI.delete(id);
      
      // Refresh bills after deletion
      await fetchBills();
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete bill');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getBillById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsAPI.getById(id);
      return response?.data?.data || response?.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch bill');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const printBill = async (id, format = 'a4') => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsAPI.printBill(id, format);
      return response?.data?.data || response?.data || response;
    } catch (err) {
      setError(err.message || 'Failed to print bill');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return {
    bills,
    loading,
    error,
    totalAmount,
    totalPaid,
    refreshBills,
    searchBills,
    filterByDateRange,
    createBill,
    updateBill,
    deleteBill,
    getBillById,
    printBill,
    fetchBills,
  };
};