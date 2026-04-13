import { useState, useEffect } from 'react';
import { dashboardAPI } from '../api';
import { useAuthStore } from '../store/authStore';

export const useDashboard = () => {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardAPI.getOverview(user.id);
      setDashboardData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  return {
    dashboardData,
    loading,
    error,
    refreshData,
  };
};
