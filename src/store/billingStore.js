// src/store/billingStore.js
import { create } from 'zustand';
import billingAPI from '../api/billing';

const useBillingStore = create((set, get) => ({
  // State
  plans: [],
  subscription: null,
  payments: [],
  paymentsCount: 0,
  recentPlanData: null,
  businessTypes: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10
  },

  // Fetch all plans
  fetchPlans: async () => {
    set({ loading: true, error: null });
    try {
      const response = await billingAPI.getAllPlans();
      set({
        plans: response.data || response || [],
        loading: false
      });
      return response.data || response;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch plans',
        loading: false
      });
      throw error;
    }
  },

  // Fetch single plan by ID
  fetchPlanById: async (planId) => {
    set({ loading: true, error: null });
    try {
      const response = await billingAPI.getPlanById(planId);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch plan details',
        loading: false
      });
      throw error;
    }
  },

  // Fetch user plan purchase history
  fetchPaymentHistory: async (userId, page = 1, perPage = 10, search = '') => {
    set({ loading: true, error: null });
    try {
      const response = await billingAPI.getPlanPurchaseHistory(userId, page, perPage, search);
      let historyData = [];
      let totalRecords = 0;

      if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
        historyData = response.data.data.data;
        totalRecords = response.data.data.total || 0;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        historyData = response.data.data;
        totalRecords = response.data.total || response.data.data.length;
      } else if (response?.data && Array.isArray(response.data)) {
        historyData = response.data;
        totalRecords = response.data.length;
      }

      set({
        payments: historyData,
        paymentsCount: totalRecords,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / perPage),
          totalItems: totalRecords,
          perPage: perPage
        },
        loading: false
      });
      return historyData;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch payment history',
        loading: false
      });
      throw error;
    }
  },

  // Fetch recent plan data
  fetchRecentPlan: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await billingAPI.getRecentPlan(userId);
      const recentData = response?.data || response;

      if (recentData && (recentData.remainingAmount !== undefined || recentData.remainingDays !== undefined)) {
        set({
          recentPlanData: {
            remainingAmount: parseFloat(recentData.remainingAmount) || 0,
            remainingDays: parseInt(recentData.remainingDays) || 0,
            perDayPrice: parseFloat(recentData.perDayPrice) || 0,
            totalDuration: recentData.total_duration || 0,
            startDay: recentData.start_day,
            endDay: recentData.end_day,
            plan: recentData?.plan || null,
          },
          loading: false
        });
        return recentData;
      }
      set({ loading: false });
      return null;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch recent plan',
        loading: false
      });
      throw error;
    }
  },

  // Renew plan
  renewPlan: async (renewData) => {
    set({ loading: true, error: null });
    try {
      const response = await billingAPI.renewPlan(renewData);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to renew plan',
        loading: false
      });
      throw error;
    }
  },

  // Create Cashfree order
  createCashfreeOrder: async (orderData) => {
    set({ loading: true, error: null });
    try {
      const response = await billingAPI.createCashfreeOrder(orderData);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create order',
        loading: false
      });
      throw error;
    }
  },

  // Upgrade plan
  upgradePlan: async (upgradeData) => {
    set({ loading: true, error: null });
    try {
      const response = await billingAPI.upgradePlan(upgradeData);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to upgrade plan',
        loading: false
      });
      throw error;
    }
  },

  // Fetch business types
  fetchBusinessTypes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await billingAPI.getBusinessTypes();
      set({
        businessTypes: response.data || response || [],
        loading: false
      });
      return response.data || response;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch business types',
        loading: false
      });
      throw error;
    }
  },

  // Fetch subscription data
  fetchSubscription: async (userId) => {
    set({ loading: true, error: null });
    try {
      const historyRes = await billingAPI.getPlanPurchaseHistory(userId, 1, 100);
      
      let historyData = [];
      if (historyRes?.data?.data?.data && Array.isArray(historyRes.data.data.data)) {
        historyData = historyRes.data.data.data;
      } else if (historyRes?.data?.data && Array.isArray(historyRes.data.data)) {
        historyData = historyRes.data.data;
      } else if (historyRes?.data && Array.isArray(historyRes.data)) {
        historyData = historyRes.data;
      }

      const successfulPurchases = historyData.filter(
        (p) => p.payment_status === "success" && p.status === "active"
      );

      if (successfulPurchases.length > 0) {
        const latestPurchase = successfulPurchases.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0];

        if (latestPurchase.plan_id) {
          if (latestPurchase.plan) {
            set({
              subscription: {
                id: latestPurchase.id,
                plan: latestPurchase.plan.name || `Plan ${latestPurchase.plan_id}`,
                planId: latestPurchase.plan_id,
                status: latestPurchase.status || "active",
                currentPeriodStart: latestPurchase.start_date,
                currentPeriodEnd: latestPurchase.end_date,
                amount: parseFloat(latestPurchase.price) || 0,
                interval: latestPurchase.plan.interval || "month",
                planDetails: latestPurchase.plan,
                paymentId: latestPurchase.payment_id,
              },
              loading: false
            });
          } else {
            const planRes = await billingAPI.getPlanById(latestPurchase.plan_id);
            const planData = planRes?.data?.data || planRes?.data;
            if (planData) {
              set({
                subscription: {
                  id: latestPurchase.id,
                  plan: planData.name || `Plan ${latestPurchase.plan_id}`,
                  planId: latestPurchase.plan_id,
                  status: latestPurchase.status || "active",
                  currentPeriodStart: latestPurchase.start_date,
                  currentPeriodEnd: latestPurchase.end_date,
                  amount: parseFloat(latestPurchase.price) || 0,
                  interval: planData.interval || "month",
                  planDetails: planData,
                  paymentId: latestPurchase.payment_id,
                },
                loading: false
              });
            }
          }
        }
      } else {
        set({ subscription: null, loading: false });
      }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch subscription',
        loading: false
      });
      throw error;
    }
  },

  // Set subscription manually
  setSubscription: (subscriptionData) => {
    set({ subscription: subscriptionData });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset state
  reset: () => set({
    plans: [],
    subscription: null,
    payments: [],
    paymentsCount: 0,
    recentPlanData: null,
    businessTypes: [],
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      perPage: 10
    }
  })
}));

export default useBillingStore;
