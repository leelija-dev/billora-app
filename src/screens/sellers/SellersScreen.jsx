// screens/sellers/SellersScreen.js - WITH SUCCESS MODAL AFTER PAYMENT
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/common/Header";
import { ConfirmationModal, SuccessModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useSellerStore from "../../store/sellerStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import SellerForm from "../../components/sellers/SellerForm";
import SellerList from "../../components/sellers/SellerList";
import DuePaymentModal from "../../components/sellers/DuePaymentModal";
import Toast from "react-native-toast-message";

const SellersScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  const {
    sellers = [],
    totalSellers,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    lastPage,
    filters,
    fetchSellers,
    loadMoreSellers,
    createSeller,
    updateSeller,
    deleteSeller,
    setFilters,
    getSellerById,
    processDuePayment,
    paymentProcessing,
  } = useSellerStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentSeller, setSelectedPaymentSeller] = useState(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  
  // Payment success modal state
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");
  const [paymentSuccessAmount, setPaymentSuccessAmount] = useState(0);

  const scrollViewRef = useRef(null);

  // Get filtered menu items from permission store
  const menuItems = useMemo(() => {
    const filtered = getFilteredMenuItems();
    return filtered.map(item => ({
      id: item.id,
      title: item.name,
      screen: item.screen,
      icon: item.icon,
      iconActive: item.iconActive,
      badge: item.badge || null,
    }));
  }, [getFilteredMenuItems]);

  // Get current user ID
  const getUserId = useCallback(() => {
    if (user && user.id) return user.id.toString();
    return "1";
  }, [user]);

  // Load sellers on mount
  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      fetchSellers(getUserId(), 1, filters.search, false).finally(() => {
        setInitialLoading(false);
      });
      return () => {};
    }, [fetchSellers, getUserId, filters.search]),
  );

  // Reset trigger flag when loading more is complete
  useEffect(() => {
    if (!isLoadingMore && !loadingMore) {
      setHasTriggeredLoadMore(false);
    }
  }, [isLoadingMore, loadingMore]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery !== filters.search) {
        setFilters({ search: searchQuery });
        fetchSellers(getUserId(), 1, searchQuery, false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filters.search, setFilters, fetchSellers, getUserId]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSellers(getUserId(), 1, filters.search, false);
    setRefreshing(false);
  }, [fetchSellers, getUserId, filters.search]);

  // Handle load more with proper conditions
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || loadingMore || loading) {
      console.log('⏭️ Skipping - already loading');
      return;
    }
    
    if (!hasMore) {
      console.log('⏭️ Skipping - no more data');
      return;
    }

    if (currentPage >= lastPage) {
      console.log('⏭️ Skipping - reached last page');
      return;
    }

    console.log(`📜 Triggering loadMoreSellers - currentPage: ${currentPage}, lastPage: ${lastPage}`);
    setIsLoadingMore(true);
    await loadMoreSellers(getUserId());
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, loadingMore, loading, hasMore, currentPage, lastPage, loadMoreSellers, getUserId]);

  // Handle scroll for pagination
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    
    const maxScroll = totalContentHeight - scrollViewHeight;
    const scrollPercentage = maxScroll > 0 ? (currentScrollPosition / maxScroll) * 100 : 0;
    
    const triggerThreshold = 50;
    const shouldLoadMore = scrollPercentage >= triggerThreshold;
    
    if (shouldLoadMore && !hasTriggeredLoadMore && !isLoadingMore && !loadingMore && hasMore && !loading) {
      console.log(`🎯 Triggering load more at ${Math.floor(scrollPercentage)}% scroll`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, hasMore, loading, handleLoadMore]);

  const handleAddSeller = () => {
    setSelectedSeller(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditSeller = async (seller) => {
    try {
      const sellerData = await getSellerById(seller.id);
      setSelectedSeller(sellerData || seller);
      setIsEditing(true);
      setShowFormModal(true);
    } catch (error) {
      console.error("Failed to fetch seller data:", error);
      setSelectedSeller(seller);
      setIsEditing(true);
      setShowFormModal(true);
    }
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    setSelectedSeller(null);
    setIsEditing(false);
  };

  const handleSubmitSeller = async (sellerData) => {
    setFormSubmitting(true);
    try {
      const userId = getUserId();
      const payload = {
        ...sellerData,
        user_id: userId,
      };

      if (isEditing && selectedSeller) {
        const result = await updateSeller(selectedSeller.id, payload);
        if (result && result.success) {
          setSuccessMessage("Seller updated successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      } else {
        const result = await createSeller(payload);
        if (result && result.success) {
          setSuccessMessage("Seller created successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      }

      handleCancelForm();
      await fetchSellers(getUserId(), 1, filters.search, false);
    } catch (error) {
      console.error("Submit error:", error);
      setSuccessMessage(error.message || "An error occurred");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClick = (seller) => {
    setSellerToDelete(seller);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!sellerToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteSeller(sellerToDelete.id);
      if (result.success) {
        setSuccessMessage("Seller deleted successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        await fetchSellers(getUserId(), 1, filters.search, false);
      } else {
        setSuccessMessage(result.error || "Failed to delete seller");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setSuccessMessage(error.message || "Failed to delete seller");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setSellerToDelete(null);
    }
  };

  // ============ PAYMENT HANDLERS ============
  
  const handlePaymentClick = (seller) => {
    console.log("💰 Opening payment modal for seller:", seller.id);
    setSelectedPaymentSeller(seller);
    setShowPaymentModal(true);
    setIsPaymentProcessing(false);
  };

  const handlePaymentSuccess = async (amount) => {
    if (!selectedPaymentSeller) return;
    
    console.log("💳 Processing payment for seller:", selectedPaymentSeller.id, "Amount:", amount);
    setIsPaymentProcessing(true);
    
    try {
      const result = await processDuePayment(selectedPaymentSeller.id, {
        user_id: getUserId(),
        paid_amount: amount,
      });
      
      console.log("💰 Payment result:", result);
      
      if (result && result.success) {
        // Close payment modal
        setShowPaymentModal(false);
        setSelectedPaymentSeller(null);
        setIsPaymentProcessing(false);
        
        // Show payment success modal
        setPaymentSuccessAmount(amount);
        setPaymentSuccessMessage(`Payment of ₹${amount.toFixed(2)} processed successfully for ${selectedPaymentSeller.name}`);
        setShowPaymentSuccessModal(true);
        
        // Refresh sellers list to update due amounts
        await fetchSellers(getUserId(), 1, filters.search, false);
        
        // Auto close success modal after 2.5 seconds
        setTimeout(() => {
          setShowPaymentSuccessModal(false);
        }, 2500);
      } else {
        setIsPaymentProcessing(false);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result?.error || 'Failed to process payment',
        });
      }
    } catch (error) {
      console.error("❌ Payment failed:", error);
      setIsPaymentProcessing(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to process payment',
      });
    }
  };

  const handlePaymentModalClose = () => {
    console.log("🔒 Closing payment modal");
    setShowPaymentModal(false);
    setSelectedPaymentSeller(null);
    setIsPaymentProcessing(false);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const safeSellers = Array.isArray(sellers) ? sellers : [];
  
  // Calculate stats
  const totalSellersCount = totalSellers || safeSellers.length;
  const totalDueAmount = useMemo(() => {
    return safeSellers.reduce((sum, seller) => sum + (parseFloat(seller.due_amount) || 0), 0);
  }, [safeSellers]);
  const uniqueCities = useMemo(() => {
    const cities = new Set();
    safeSellers.forEach(s => {
      if (s.city) cities.add(s.city);
    });
    return cities.size;
  }, [safeSellers]);

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading sellers...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />

      <Header
        title="Sellers"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Sellers"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={handleRefresh} 
              disabled={loading}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon 
                name="refresh" 
                size={20} 
                color={loading ? (isDarkMode ? "#4B5563" : "#9CA3AF") : (isDarkMode ? "#9CA3AF" : "#4b5563")} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={toggleViewMode} 
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon 
                name={viewMode === "grid" ? "view-list" : "view-grid"} 
                size={22} 
                color={isDarkMode ? "#9CA3AF" : "#4b5563"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleAddSeller} 
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30"
            >
              <Icon name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
            placeholder="Search sellers by name, phone, city, or GST..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Page Indicator */}
      <View className={`px-4 py-2 flex-row justify-between items-center border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {totalSellersCount > 0 ? `Showing ${safeSellers.length} of ${totalSellersCount} sellers` : `${safeSellers.length} sellers`}
        </Text>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Page {currentPage}/{lastPage}
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1">
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={["#3b82f6"]} 
              tintColor={isDarkMode ? "#F9FAFB" : "#3b82f6"} 
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Stats Cards */}
          <View className="flex-row flex-wrap px-4 py-3">
            <LinearGradient 
              style={{borderRadius: 12}} 
              colors={["#3b82f6", "#2563eb"]} 
              className="rounded-xl p-4 flex-1 mr-2" 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }}
            >
              <Text className="text-white/80 text-xs">Total Sellers</Text>
              <Text className="text-white text-2xl font-bold">{totalSellersCount}</Text>
              <View className="flex-row items-center mt-1">
                <Icon name="account-group" size={16} color="#86efac" />
                <Text className="text-white/80 text-xs ml-1">All sellers</Text>
              </View>
            </LinearGradient>

            <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Due Amount</Text>
              <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹{totalDueAmount.toLocaleString()}</Text>
              <View className="flex-row items-center mt-1">
                <View className="w-2 h-2 rounded-full bg-orange-500 mr-1" />
                <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Pending payments
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row px-4 mb-4">
            <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <View className="flex-row items-center">
                <Icon name="city" size={20} color="#8b5cf6" />
                <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Cities</Text>
              </View>
              <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{uniqueCities}</Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Unique locations</Text>
            </View>

            <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <View className="flex-row items-center">
                <Icon name="account" size={20} color="#f97316" />
                <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Active Sellers</Text>
              </View>
              <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{totalSellersCount}</Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Registered</Text>
            </View>
          </View>

          {/* Seller List */}
          <View className="flex-1 px-4 pb-4">
            {loading && safeSellers.length === 0 ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading sellers...
                </Text>
              </View>
            ) : safeSellers.length === 0 ? (
              <View className="py-20 items-center">
                <Icon name="account-group" size={80} color={isDarkMode ? '#334155' : '#D1D5DB'} />
                <Text className={`text-lg mt-4 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  No sellers found
                </Text>
                <Text className={`text-sm mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchQuery ? 'Try adjusting your search' : 'Tap the + button to add your first seller'}
                </Text>
              </View>
            ) : (
              <SellerList
                sellers={safeSellers}
                viewMode={viewMode}
                loading={loading}
                searchQuery={searchQuery}
                onEdit={handleEditSeller}
                onDelete={handleDeleteClick}
                onPayment={handlePaymentClick}
                onRefresh={handleRefresh}
              />
            )}

            {/* Loading More Indicator */}
            {(isLoadingMore || loadingMore) && (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading more sellers...
                </Text>
              </View>
            )}

            {/* No More Sellers */}
            {!hasMore && safeSellers.length > 0 && safeSellers.length === totalSellersCount && (
              <View className="py-4 items-center">
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No more sellers to load
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* ============ MODALS ============ */}
      
      {/* Add/Edit Seller Modal */}
      <Modal 
        visible={showFormModal} 
        animationType="slide" 
        presentationStyle="pageSheet" 
        onRequestClose={handleCancelForm}
      >
        <SellerForm
          seller={selectedSeller}
          onSubmit={handleSubmitSeller}
          onCancel={handleCancelForm}
          isSubmitting={formSubmitting}
          isEdit={isEditing}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Seller"
        message={`Are you sure you want to delete "${sellerToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={deleting}
      />

      {/* Success Modal for CRUD operations */}
      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />

      {/* ✅ Payment Success Modal */}
      <SuccessModal
        visible={showPaymentSuccessModal}
        message={paymentSuccessMessage}
        onClose={() => setShowPaymentSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2500}
      />

      {/* Payment Modal */}
      <DuePaymentModal
        seller={selectedPaymentSeller}
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        onSuccess={handlePaymentSuccess}
        processing={isPaymentProcessing || paymentProcessing}
      />
    </View>
  );
};

export default SellersScreen;