// screens/stocks/StocksScreen.js
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../../components/common/Header";
import StockList from "../../components/stocks/StockList";
import StockForm from "../../components/stocks/StockForm";
import AddStockModal from "../../components/stocks/AddStockModal";
import { SuccessModal, ConfirmationModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useStockStore from "../../store/stockStore";
import useProductStore from "../../store/productStore";
import useUnitStore from "../../store/unitStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";

const StocksScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  const { stocks = [], totalStocks, loading, loadingMore, hasMore, filters, fetchStocks, loadMoreStocks, createStock, updateStock, deleteStock, addStockQuantity, setFilters, currentPage, lastPage } = useStockStore();
  const { products = [], fetchProducts } = useProductStore();
  const { units = [], fetchUnits } = useUnitStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedStockForModal, setSelectedStockForModal] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);

  const scrollViewRef = useRef(null);

  const searchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  const menuItems = useMemo(() => {
    const filtered = getFilteredMenuItems();
    return filtered.map(item => ({ id: item.id, title: item.name, screen: item.screen, icon: item.icon, iconActive: item.iconActive, badge: item.badge || null }));
  }, [getFilteredMenuItems]);

  const getUserId = useCallback(() => user && user.id ? user.id.toString() : "1", [user]);

  useEffect(() => {
    const loadInitialData = async () => {
      try { await Promise.all([fetchStocks(1, '', false), fetchProducts(), fetchUnits()]); } catch (error) { console.error("Failed to load stocks:", error); } finally { if (isMounted.current) setInitialLoading(false); } };
    loadInitialData();
    return () => { isMounted.current = false; if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

  // Reset trigger flag when loading more is complete
  useEffect(() => {
    if (!isLoadingMore && !loadingMore) {
      setHasTriggeredLoadMore(false);
    }
  }, [isLoadingMore, loadingMore]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { setFilters({ search: searchQuery }); fetchStocks(1, searchQuery, false); }, 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  useFocusEffect(useCallback(() => { fetchStocks(1, '', false); return () => {}; }, []));

  const handleRefresh = async () => { setRefreshing(true); await fetchStocks(1, '', false); setRefreshing(false); };

  // Handle load more with proper conditions
  const handleLoadMore = useCallback(async () => {
    // Check conditions properly
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

    console.log(`📜 Triggering loadMoreStocks - currentPage: ${currentPage}, lastPage: ${lastPage}`);
    setIsLoadingMore(true);
    await loadMoreStocks(searchQuery);
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, loadingMore, loading, hasMore, currentPage, lastPage, loadMoreStocks, searchQuery]);

  // Handle scroll for pagination
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    
    // Calculate scroll percentage
    const maxScroll = totalContentHeight - scrollViewHeight;
    const scrollPercentage = maxScroll > 0 ? (currentScrollPosition / maxScroll) * 100 : 0;
    
    // Check if user has scrolled 50% of the screen height
    const triggerThreshold = 50;
    const shouldLoadMore = scrollPercentage >= triggerThreshold;
    
    if (shouldLoadMore && !hasTriggeredLoadMore && !isLoadingMore && !loadingMore && hasMore && !loading) {
      console.log(`🎯 Triggering load more at ${Math.floor(scrollPercentage)}% scroll`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, hasMore, loading, handleLoadMore]);
  const handleAddStock = () => { setSelectedStock(null); setIsEditing(false); setShowFormModal(true); };
  const handleEditStock = (stock) => { setSelectedStock(stock); setIsEditing(true); setShowFormModal(true); };
  const handleCancelForm = () => { setShowFormModal(false); setSelectedStock(null); setIsEditing(false); };

  const handleSubmitStock = async (stockData) => {
    setFormSubmitting(true);
    try {
      const userId = getUserId();
      const payload = { ...stockData, user_id: userId, created_by: userId };
      let result;
      if (isEditing && selectedStock) result = await updateStock(selectedStock.id, payload);
      else result = await createStock(payload);
      if (result.success) { setSuccessMessage(isEditing ? "Stock updated successfully" : "Stock created successfully"); setShowSuccessModal(true); setTimeout(() => setShowSuccessModal(false), 2000); handleCancelForm(); await fetchStocks(1, searchQuery, false); }
      else setSuccessMessage(result.error || "Operation failed");
    } catch (error) { console.error("Submit error:", error); setSuccessMessage(error.message || "An error occurred"); setShowSuccessModal(true); setTimeout(() => setShowSuccessModal(false), 2000); } finally { setFormSubmitting(false); }
  };

  const handleDeleteStock = (stock) => { setStockToDelete(stock); setShowDeleteConfirm(true); };
  const confirmDelete = async () => {
    if (!stockToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteStock(stockToDelete.id, getUserId());
      if (result.success) { setSuccessMessage("Stock deleted successfully"); setShowSuccessModal(true); setTimeout(() => setShowSuccessModal(false), 2000); await fetchStocks(1, searchQuery, false); }
      setShowDeleteConfirm(false); setStockToDelete(null);
    } catch (error) { console.error("Delete error:", error); } finally { setDeleting(false); }
  };

  const handleOpenAddStockModal = (stock) => { setSelectedStockForModal(stock); setShowAddStockModal(true); };
  const handleAddStockFromModal = async (stockId, quantity) => {
    const result = await addStockQuantity(stockId, getUserId(), quantity);
    if (result.success) { setSuccessMessage("Stock quantity added successfully"); setShowSuccessModal(true); setTimeout(() => setShowSuccessModal(false), 2000); await fetchStocks(1, searchQuery, false); }
    setShowAddStockModal(false); setSelectedStockForModal(null);
  };

  const handleSearch = (query) => setSearchQuery(query);
  const toggleViewMode = () => setViewMode(viewMode === "grid" ? "list" : "grid");
  const handleSort = (sortKey) => { setSortBy(sortKey); setFilters({ sortBy: sortKey }); };

  const safeStocks = Array.isArray(stocks) ? stocks : [];
  const totalStocksCount = totalStocks || safeStocks.length;

  if (initialLoading) {
    return (<View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}><ActivityIndicator size="large" color="#3b82f6" /><Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading stocks...</Text></View>);
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />
      <Header title="Stock Management" userName={user?.name || "User"} userEmail={user?.email || "guest@example.com"} activeScreen="Stocks" navigationItems={menuItems} rightComponent={
        <View className="flex-row items-center">
          <TouchableOpacity onPress={toggleViewMode} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}><Icon name={viewMode === "grid" ? "view-grid" : "view-list"} size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} /></TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}><Icon name="refresh" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} /></TouchableOpacity>
          <TouchableOpacity onPress={handleAddStock} className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30"><Icon name="plus" size={24} color="#ffffff" /></TouchableOpacity>
        </View>
      } />

      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`} placeholder="Search stocks by product name or SKU..." placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={handleSearch} />
          {searchQuery.length > 0 && (<TouchableOpacity onPress={() => handleSearch("")}><Icon name="close-circle" size={20} color="#9ca3af" /></TouchableOpacity>)}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3b82f6"]} tintColor={isDarkMode ? "#ffffff" : "#3b82f6"} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="flex-row flex-wrap px-4 py-3">
          <LinearGradient colors={["#3b82f6", "#2563eb"]} className="rounded-xl p-4 flex-1 mr-2" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text className="text-white/80 text-xs">Total Stock Items</Text>
            <Text className="text-white text-2xl font-bold">{safeStocks.length}</Text>
            <View className="flex-row items-center mt-1"><Icon name="warehouse" size={16} color="#86efac" /><Text className="text-white/80 text-xs ml-1">Inventory items</Text></View>
          </LinearGradient>
          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Quantity</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{safeStocks.reduce((sum, s) => sum + (s.quantity || 0), 0).toLocaleString()}</Text>
            <View className="flex-row items-center mt-1"><Icon name="package-variant" size={16} color="#F59E0B" /><Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} ml-1`}>Units in stock</Text></View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Value</Text>
            <Text className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹{safeStocks.reduce((sum, s) => sum + ((s.quantity || 0) * (s.selling_price || 0)), 0).toLocaleString()}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Inventory value</Text>
          </View>
          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Low Stock Items</Text>
            <Text className={`text-xl font-bold ${safeStocks.filter(s => s.quantity < 10 && s.quantity > 0).length > 0 ? "text-orange-500" : isDarkMode ? "text-white" : "text-gray-800"}`}>{safeStocks.filter(s => s.quantity < 10 && s.quantity > 0).length}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Below 10 units</Text>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {[{ id: "name", label: "Name", icon: "sort-alphabetical-ascending" }, { id: "quantity", label: "Quantity", icon: "counter" }, { id: "price", label: "Price", icon: "currency-usd" }, { id: "date", label: "Date", icon: "calendar" }].map((option) => (
                <TouchableOpacity key={option.id} onPress={() => handleSort(option.id)} className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${sortBy === option.id ? "bg-blue-500 border-blue-500" : isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <Icon name={option.icon} size={16} color={sortBy === option.id ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"} />
                  <Text className={`ml-2 text-sm ${sortBy === option.id ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Page Indicator */}
        <View className={`px-4 py-2 flex-row justify-between items-center border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-100'
        }`}>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {totalStocks > 0 ? `Showing ${safeStocks.length} of ${totalStocks} stocks` : `${safeStocks.length} stocks`}
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {currentPage}/{lastPage}
          </Text>
        </View>

        <StockList stocks={safeStocks} viewMode={viewMode} searchQuery={searchQuery} sortBy={sortBy} loading={loading} onRefresh={handleRefresh} onEdit={handleEditStock} onDelete={handleDeleteStock} onAddQuantity={handleOpenAddStockModal} />

        {/* Loading More Indicator */}
        {(isLoadingMore || loadingMore) && (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading more stocks...
            </Text>
          </View>
        )}

        {/* No More Stocks */}
        {!hasMore && safeStocks.length > 0 && safeStocks.length === totalStocks && (
          <View className="py-4 items-center">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No more stocks to load
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showFormModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancelForm}>
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <View className={`px-4 pt-12 pb-4 flex-row items-center border-b ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
            <TouchableOpacity onPress={handleCancelForm} className="p-2"><Icon name="arrow-left" size={24} color={isDarkMode ? "#FFFFFF" : "#1F2937"} /></TouchableOpacity>
            <Text className={`flex-1 text-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{isEditing ? "Edit Stock" : "Add New Stock"}</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView className="flex-1 px-4 pt-4">
            <StockForm initialData={selectedStock} mode={isEditing ? "edit" : "add"} onSubmit={handleSubmitStock} onCancel={handleCancelForm} isSubmitting={formSubmitting} products={products} units={units} />
          </ScrollView>
        </View>
      </Modal>

      <ConfirmationModal visible={showDeleteConfirm} title="Delete Stock" message={`Are you sure you want to delete stock for "${stockToDelete?.product?.name || stockToDelete?.product_name}"? This action cannot be undone.`} onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(false)} confirmText="Delete" cancelText="Cancel" confirmButtonColor="#ef4444" loading={deleting} />
      <SuccessModal visible={showSuccessModal} message={successMessage} onClose={() => setShowSuccessModal(false)} autoClose={true} autoCloseDelay={2000} />
      <AddStockModal visible={showAddStockModal} onClose={() => { setShowAddStockModal(false); setSelectedStockForModal(null); }} stock={selectedStockForModal} onAddStock={handleAddStockFromModal} isSubmitting={loading} isDarkMode={isDarkMode} />
    </View>
  );
};

export default StocksScreen;