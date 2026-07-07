// screens/sellers/SellerDetailsScreen.js - FIXED VERSION
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
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
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../../components/common/Header";
import { ConfirmationModal, SuccessModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useSellerStore from "../../store/sellerStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import SellerForm from "../../components/sellers/SellerForm";
import SellerProductList from "../../components/sellers/SellerProductList";
import DuePaymentModal from "../../components/sellers/DuePaymentModal";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

const SellerDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  const {
    sellerProducts,
    sellerProductsTotal,
    sellerProductsCurrentPage,
    sellerProductsLastPage,
    sellerProductsPageSize,
    sellerProductsLoading,
    sellerProductsLoadingMore,
    sellerProductsHasMore,
    sellerProductsSearch,
    currentSellerId,
    fetchSellerProducts,
    loadMoreSellerProducts,
    clearSellerProducts,
    getSellerById,
    updateSeller,
    fetchSellers,
    processDuePayment,
    paymentProcessing,
    paymentHistory,
    paymentHistoryPagination,
    paymentHistoryLoading,
  } = useSellerStore();

  // Seller state
  const [seller, setSeller] = useState(null);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Products state
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentSeller, setSelectedPaymentSeller] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const scrollViewRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Get filtered menu items
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

  // Fetch seller details - FIXED
  const fetchSellerDetails = useCallback(async () => {
    if (!id) {
      console.log("⚠️ No seller ID provided");
      return;
    }
    
    console.log("🔍 Fetching seller details for ID:", id);
    setSellerLoading(true);
    
    try {
      const result = await getSellerById(id);
      console.log("📝 Received seller result:", result);
      
      // ✅ FIX: Extract seller data from result
      const sellerData = result?.data || result;
      console.log("📝 Extracted seller data:", sellerData);
      
      if (sellerData && sellerData.id) {
        setSeller(sellerData);
        setEditFormData({
          name: sellerData.name || "",
          email: sellerData.email || "",
          phone: sellerData.phone || "",
          address: sellerData.address || "",
          city: sellerData.city || "",
          state: sellerData.state || "",
          pincode: sellerData.pincode || "",
          gst_number: sellerData.gst_number || "",
          due_amount: sellerData.due_amount || 0,
        });
        console.log("✅ Seller data set successfully");
      } else {
        console.log("⚠️ No seller data received");
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Seller not found',
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch seller details:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load seller details',
      });
    } finally {
      setSellerLoading(false);
    }
  }, [id, getSellerById]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!id) return;
    
    console.log("📦 Fetching products for seller:", id);
    try {
      await fetchSellerProducts(id, 1, searchTerm);
      console.log("✅ Products fetched successfully");
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
    } finally {
      setInitialLoading(false);
    }
  }, [id, fetchSellerProducts, searchTerm]);

  // Load more products
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || sellerProductsLoadingMore || !sellerProductsHasMore) {
      console.log('⏭️ Skipping load more products - already loading or no more data');
      return;
    }
    if (sellerProductsCurrentPage >= sellerProductsLastPage) {
      console.log('⏭️ Skipping - reached last page');
      return;
    }
    
    console.log(`📜 Triggering loadMoreProducts - currentPage: ${sellerProductsCurrentPage}, lastPage: ${sellerProductsLastPage}`);
    setIsLoadingMore(true);
    await loadMoreSellerProducts(id);
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, sellerProductsLoadingMore, sellerProductsHasMore, sellerProductsCurrentPage, sellerProductsLastPage, loadMoreSellerProducts, id]);

  // Handle scroll for product pagination
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    
    const maxScroll = totalContentHeight - scrollViewHeight;
    const scrollPercentage = maxScroll > 0 ? (currentScrollPosition / maxScroll) * 100 : 0;
    
    const triggerThreshold = 50;
    const shouldLoadMore = scrollPercentage >= triggerThreshold;
    
    if (shouldLoadMore && !hasTriggeredLoadMore && !isLoadingMore && !sellerProductsLoadingMore && sellerProductsHasMore && !sellerProductsLoading) {
      console.log(`🎯 Triggering load more at ${Math.floor(scrollPercentage)}% scroll`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, sellerProductsLoadingMore, sellerProductsHasMore, sellerProductsLoading, handleLoadMore]);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      if (id) {
        console.log("📱 Screen focused - fetching seller details and products");
        fetchSellerDetails();
        fetchProducts();
      }
      return () => {
        console.log("🔄 Clearing seller products");
        clearSellerProducts();
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [id])
  );

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!id) return;

    searchTimeoutRef.current = setTimeout(() => {
      console.log("🔍 Searching products with term:", searchTerm);
      if (id) {
        fetchSellerProducts(id, 1, searchTerm);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, id, fetchSellerProducts]);

  // Reset trigger flag when loading more is complete
  useEffect(() => {
    if (!isLoadingMore && !sellerProductsLoadingMore) {
      setHasTriggeredLoadMore(false);
    }
  }, [isLoadingMore, sellerProductsLoadingMore]);

  // Handle edit toggle
  const handleEditToggle = () => {
    if (isEditing) {
      setValidationErrors({});
      setEditFormData({
        name: seller.name || "",
        email: seller.email || "",
        phone: seller.phone || "",
        address: seller.address || "",
        city: seller.city || "",
        state: seller.state || "",
        pincode: seller.pincode || "",
        gst_number: seller.gst_number || "",
        due_amount: seller.due_amount || 0,
      });
    }
    setIsEditing(!isEditing);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!editFormData.name || editFormData.name.trim() === "") {
      errors.name = "Name is required";
    }
    if (editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = "Invalid email format";
    }
    if (editFormData.phone && !/^[0-9]{10}$/.test(editFormData.phone)) {
      errors.phone = "Phone number must be 10 digits";
    }
    if (editFormData.pincode && !/^[0-9]{6}$/.test(editFormData.pincode)) {
      errors.pincode = "Pincode must be 6 digits";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmitEdit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors in the form',
      });
      return;
    }

    setEditLoading(true);
    setIsRefreshing(true);
    
    try {
      const data = {
        ...editFormData,
        user_id: getUserId(),
      };

      const result = await updateSeller(id, data);
      console.log("✅ Seller updated successfully", result);
      
      // Extract updated seller data
      const updatedSeller = result?.data || result;
      
      setSuccessMessage("Seller updated successfully");
      setShowSuccessModal(true);
      
      // Update local seller data
      setSeller(prev => ({
        ...prev,
        ...updatedSeller
      }));
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Seller updated successfully',
      });
      
      setTimeout(() => {
        setShowSuccessModal(false);
        setIsEditing(false);
        setEditLoading(false);
        setIsRefreshing(false);
      }, 2000);
      
    } catch (error) {
      console.error("❌ Error updating seller:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update seller',
      });
      setEditLoading(false);
      setIsRefreshing(false);
    }
  };

  const handlePaymentSuccess = useCallback(async (amount) => {
    console.log("💳 Payment success handler called with amount:", amount);
    try {
      const result = await processDuePayment(id, {
        user_id: getUserId(),
        paid_amount: amount,
      });
      
      if (result && result.success) {
        setShowPaymentModal(false);
        setSelectedPaymentSeller(null);
        
        setPaymentSuccess(true);
        
        // Refresh seller details
        await fetchSellerDetails();
        // Refresh products
        await fetchProducts();
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Payment of ₹${amount.toFixed(2)} processed successfully`,
        });
        
        setTimeout(() => {
          setPaymentSuccess(false);
        }, 3000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result?.error || 'Failed to process payment',
        });
      }
    } catch (error) {
      console.error("❌ Payment failed:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to process payment',
      });
    }
  }, [id, getUserId, processDuePayment, fetchSellerDetails, fetchProducts]);

  const handleRefresh = async () => {
    console.log("🔄 Refreshing products");
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const clearSearch = () => {
    console.log("🔍 Clearing search");
    setSearchTerm("");
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render Payment History
  const renderPaymentHistory = () => {
    if (paymentHistoryLoading) {
      return (
        <View className="py-8 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Loading payment history...
          </Text>
        </View>
      );
    }

    if (!paymentHistory || paymentHistory.length === 0) {
      return (
        <View className="py-8 items-center">
          <Icon name="credit-card" size={40} color={isDarkMode ? "#4B5563" : "#D1D5DB"} />
          <Text className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            No payment history found
          </Text>
        </View>
      );
    }

    return paymentHistory.map((payment, index) => (
      <View
        key={payment.id || index}
        className={`flex-row justify-between items-center py-3 ${
          index < paymentHistory.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""
        }`}
      >
        <View className="flex-1">
          <Text className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            ₹{parseFloat(payment.paid_amount || 0).toFixed(2)}
          </Text>
          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {payment.remarks || "Payment"}
          </Text>
        </View>
        <View className="items-end">
          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {formatDate(payment.created_at)}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
            <Text className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
              {payment.payment_method || "cash"}
            </Text>
          </View>
        </View>
      </View>
    ));
  };

  // Loading state
  if (sellerLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />
        <Header
          title="Seller Details"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Loading seller details...
          </Text>
        </View>
      </View>
    );
  }

  if (!seller) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />
        <Header
          title="Seller Details"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Icon name="account-off" size={80} color={isDarkMode ? "#4B5563" : "#9CA3AF"} />
          <Text className={`text-lg mt-4 text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Seller not found
          </Text>
          <Text className={`text-sm mt-2 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            The seller you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-6 bg-blue-500 px-6 py-3 rounded-xl flex-row items-center"
          >
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">Back to Sellers</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const dueAmount = parseFloat(seller.due_amount) || 0;

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />

      <Header
        title="Seller Details"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightComponent={
          <View className="flex-row items-center">
            {dueAmount > 0 && (
              <TouchableOpacity
                onPress={() => {
                  console.log("💰 Opening payment modal for seller:", seller.id);
                  setSelectedPaymentSeller(seller);
                  setShowPaymentModal(true);
                }}
                className="bg-green-500 px-3 py-1.5 rounded-full mr-2 flex-row items-center"
              >
                <Icon name="currency-inr" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold ml-1">Pay Due</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleEditToggle}
              className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon name="pencil" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
          </View>
        }
      />

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
      >
        {/* Seller Info Card */}
        <View className={`mx-4 mt-4 rounded-2xl p-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          {isEditing ? (
            // Edit Form
            <View>
              <Text className={`text-lg font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Edit Seller
              </Text>
              
              <View className="space-y-3">
                {/* Name */}
                <View>
                  <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Name <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className={`border rounded-xl px-4 py-3 text-base ${
                      validationErrors.name
                        ? "border-red-500"
                        : isDarkMode
                        ? "border-gray-600 text-white bg-gray-700"
                        : "border-gray-300 text-gray-800 bg-gray-50"
                    }`}
                    placeholder="Enter seller name"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                    value={editFormData?.name || ""}
                    onChangeText={(value) => handleInputChange("name", value)}
                  />
                  {validationErrors.name && (
                    <Text className="mt-1 text-xs text-red-500">{validationErrors.name}</Text>
                  )}
                </View>

                {/* GST Number */}
                <View>
                  <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    GST Number
                  </Text>
                  <TextInput
                    className={`border rounded-xl px-4 py-3 text-base ${
                      isDarkMode
                        ? "border-gray-600 text-white bg-gray-700"
                        : "border-gray-300 text-gray-800 bg-gray-50"
                    }`}
                    placeholder="Enter GST number"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                    value={editFormData?.gst_number || ""}
                    onChangeText={(value) => handleInputChange("gst_number", value)}
                  />
                </View>

                {/* Email */}
                <View>
                  <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Email
                  </Text>
                  <TextInput
                    className={`border rounded-xl px-4 py-3 text-base ${
                      validationErrors.email
                        ? "border-red-500"
                        : isDarkMode
                        ? "border-gray-600 text-white bg-gray-700"
                        : "border-gray-300 text-gray-800 bg-gray-50"
                    }`}
                    placeholder="Enter email address"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={editFormData?.email || ""}
                    onChangeText={(value) => handleInputChange("email", value)}
                  />
                  {validationErrors.email && (
                    <Text className="mt-1 text-xs text-red-500">{validationErrors.email}</Text>
                  )}
                </View>

                {/* Phone */}
                <View>
                  <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Phone
                  </Text>
                  <TextInput
                    className={`border rounded-xl px-4 py-3 text-base ${
                      validationErrors.phone
                        ? "border-red-500"
                        : isDarkMode
                        ? "border-gray-600 text-white bg-gray-700"
                        : "border-gray-300 text-gray-800 bg-gray-50"
                    }`}
                    placeholder="Enter 10-digit phone number"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={editFormData?.phone || ""}
                    onChangeText={(value) => handleInputChange("phone", value)}
                  />
                  {validationErrors.phone && (
                    <Text className="mt-1 text-xs text-red-500">{validationErrors.phone}</Text>
                  )}
                </View>

                {/* Address */}
                <View>
                  <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Address
                  </Text>
                  <TextInput
                    className={`border rounded-xl px-4 py-3 text-base ${
                      isDarkMode
                        ? "border-gray-600 text-white bg-gray-700"
                        : "border-gray-300 text-gray-800 bg-gray-50"
                    }`}
                    placeholder="Enter street address"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                    value={editFormData?.address || ""}
                    onChangeText={(value) => handleInputChange("address", value)}
                  />
                </View>

                {/* City and State Row */}
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                      City
                    </Text>
                    <TextInput
                      className={`border rounded-xl px-4 py-3 text-base ${
                        isDarkMode
                          ? "border-gray-600 text-white bg-gray-700"
                          : "border-gray-300 text-gray-800 bg-gray-50"
                      }`}
                      placeholder="Enter city"
                      placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                      value={editFormData?.city || ""}
                      onChangeText={(value) => handleInputChange("city", value)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                      State
                    </Text>
                    <TextInput
                      className={`border rounded-xl px-4 py-3 text-base ${
                        isDarkMode
                          ? "border-gray-600 text-white bg-gray-700"
                          : "border-gray-300 text-gray-800 bg-gray-50"
                      }`}
                      placeholder="Enter state"
                      placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                      value={editFormData?.state || ""}
                      onChangeText={(value) => handleInputChange("state", value)}
                    />
                  </View>
                </View>

                {/* Pincode */}
                <View>
                  <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Pincode
                  </Text>
                  <TextInput
                    className={`border rounded-xl px-4 py-3 text-base ${
                      validationErrors.pincode
                        ? "border-red-500"
                        : isDarkMode
                        ? "border-gray-600 text-white bg-gray-700"
                        : "border-gray-300 text-gray-800 bg-gray-50"
                    }`}
                    placeholder="Enter 6-digit pincode"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                    keyboardType="numeric"
                    maxLength={6}
                    value={editFormData?.pincode || ""}
                    onChangeText={(value) => handleInputChange("pincode", value)}
                  />
                  {validationErrors.pincode && (
                    <Text className="mt-1 text-xs text-red-500">{validationErrors.pincode}</Text>
                  )}
                </View>

                {/* Due Amount (Read-only) */}
                <View>
                  <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Due Amount
                  </Text>
                  <View className={`border rounded-xl px-4 py-3 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`}>
                    <Text className={`text-base ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      ₹{parseFloat(editFormData?.due_amount || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <TouchableOpacity
                    onPress={handleEditToggle}
                    className={`flex-1 py-3 rounded-xl border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                  >
                    <Text className={`text-center font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmitEdit}
                    disabled={editLoading}
                    className="flex-1 py-3 rounded-xl bg-blue-500 flex-row items-center justify-center"
                  >
                    {editLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="content-save" size={18} color="#FFFFFF" />
                        <Text className="text-white font-semibold ml-2">Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            // View Mode
            <>
              {/* Header */}
              <View className="flex-row items-center">
                <LinearGradient
                  colors={["#3B82F6", "#8B5CF6"]}
                  className="w-16 h-16 rounded-2xl items-center justify-center"
                >
                  <Text className="text-2xl font-bold text-white">
                    {seller.name?.charAt(0).toUpperCase() || "S"}
                  </Text>
                </LinearGradient>
                <View className="ml-4 flex-1">
                  <Text className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {seller.name}
                  </Text>
                  {seller.gst_number && (
                    <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      GST: {seller.gst_number}
                    </Text>
                  )}
                  <View className="flex-row items-center mt-1">
                    <Text className={`text-sm font-medium ${dueAmount > 0 ? "text-red-500" : "text-green-500"}`}>
                      Due Amount: {formatCurrency(dueAmount)}
                    </Text>
                    {dueAmount > 0 && (
                      <View className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <Text className="text-xs text-red-600 dark:text-red-400">Payment Due</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Contact & Address */}
              <View className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <View className="flex-row flex-wrap">
                  {seller.email && (
                    <View className="w-full flex-row items-center mb-2">
                      <Icon name="email" size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                      <Text className={`ml-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {seller.email}
                      </Text>
                    </View>
                  )}
                  {seller.phone && (
                    <View className="w-full flex-row items-center mb-2">
                      <Icon name="phone" size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                      <Text className={`ml-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {seller.phone}
                      </Text>
                    </View>
                  )}
                  {seller.address && (
                    <View className="w-full flex-row items-start mb-2">
                      <Icon name="map-marker" size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                      <View className="ml-3 flex-1">
                        <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {seller.address}
                        </Text>
                        {(seller.city || seller.state) && (
                          <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {[seller.city, seller.state].filter(Boolean).join(", ")}
                            {seller.pincode && ` - ${seller.pincode}`}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Meta Info */}
              <View className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-row">
                <View className="flex-1">
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Products</Text>
                  <Text className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {sellerProductsTotal || 0}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Payments</Text>
                  <Text className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {paymentHistory?.length || 0}
                  </Text>
                </View>
                {seller.created_at && (
                  <View className="flex-1">
                    <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Joined</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {formatDate(seller.created_at)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Payment Success Animation */}
              {paymentSuccess && (
                <View className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex-row items-center">
                  <Icon name="check-circle" size={20} color="#16A34A" />
                  <Text className="ml-2 text-green-700 dark:text-green-300 font-medium">
                    Payment processed successfully!
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Tab Navigation */}
        <View className={`mx-4 mt-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm overflow-hidden`}>
          <View className="flex-row border-b border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => setActiveTab("products")}
              className={`flex-1 py-3 px-4 items-center ${
                activeTab === "products"
                  ? "border-b-2 border-blue-500"
                  : ""
              }`}
            >
              <Text className={`text-sm font-medium ${
                activeTab === "products"
                  ? "text-blue-500"
                  : isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                Products
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("payments")}
              className={`flex-1 py-3 px-4 items-center ${
                activeTab === "payments"
                  ? "border-b-2 border-blue-500"
                  : ""
              }`}
            >
              <Text className={`text-sm font-medium ${
                activeTab === "payments"
                  ? "text-blue-500"
                  : isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                Payment History
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Products Section */}
        {activeTab === "products" && (
          <View className={`mx-4 mt-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm overflow-hidden`}>
            {/* Products Header */}
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Products & Inventory
                  </Text>
                  <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {sellerProductsTotal || 0} products available
                  </Text>
                </View>
              </View>

              {/* Search */}
              <View className="mt-3">
                <View className={`flex-row items-center rounded-xl px-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <Icon name="magnify" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                  <TextInput
                    className={`flex-1 ml-2 py-2 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
                    placeholder="Search products..."
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                  {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={clearSearch}>
                      <Icon name="close-circle" size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Products List */}
            <SellerProductList
              products={sellerProducts}
              total={sellerProductsTotal}
              loading={sellerProductsLoading}
              loadingMore={sellerProductsLoadingMore || isLoadingMore}
              hasMore={sellerProductsHasMore}
              currentPage={sellerProductsCurrentPage}
              lastPage={sellerProductsLastPage}
              searchTerm={searchTerm}
              onRefresh={handleRefresh}
              onLoadMore={handleLoadMore}
              onScroll={handleScroll}
              isDarkMode={isDarkMode}
            />
          </View>
        )}

        {/* Payment History Section */}
        {activeTab === "payments" && (
          <View className={`mx-4 mt-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm overflow-hidden`}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Payment History
                  </Text>
                  <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {paymentHistory?.length || 0} payment records
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment History List */}
            <View className="p-4">
              {renderPaymentHistory()}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <DuePaymentModal
        seller={selectedPaymentSeller || seller}
        isOpen={showPaymentModal}
        onClose={() => {
          console.log("🔒 Closing payment modal");
          setShowPaymentModal(false);
          setSelectedPaymentSeller(null);
        }}
        onSuccess={handlePaymentSuccess}
        processing={paymentProcessing}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </View>
  );
};

export default SellerDetailsScreen;