// components/sellers/SellerProductList.js - COMPLETE CUSTOM VERSION
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "../../store/themeStore";

const SellerProductList = ({
  products = [],
  total = 0,
  loading = false,
  loadingMore = false,
  hasMore = true,
  currentPage = 1,
  lastPage = 1,
  searchTerm = "",
  onRefresh,
  onLoadMore,
  onScroll,
  isDarkMode,
}) => {
  const { isDarkMode: themeIsDark } = useThemeStore();
  const darkMode = isDarkMode !== undefined ? isDarkMode : themeIsDark;

  // Helper function to safely get numeric value
  const safeNumber = (value, defaultValue = 0) => {
    const num = typeof value === "number" ? value : parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper function to format currency
  const formatCurrency = (value) => {
    const num = safeNumber(value);
    return num.toFixed(2);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const renderEmptyState = () => (
    <View className="py-20 items-center">
      <Icon name="package-variant" size={80} color={darkMode ? "#334155" : "#D1D5DB"} />
      <Text className={`text-lg mt-4 text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
        No products found
      </Text>
      <Text className={`text-sm mt-2 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        {searchTerm ? "Try adjusting your search" : "This seller doesn't have any products yet"}
      </Text>
    </View>
  );

  const renderProductCard = (item, index) => {
    // Extract product data from the response structure
    const product = item.products || item;
    const stock = item.stocks || {};
    
    // Product details
    const productName = product.name || "N/A";
    const productSku = product.sku || "N/A";
    const quantity = safeNumber(item.qty || stock.quantity || 0);
    const purchasePrice = safeNumber(item.purchase_price || product.purchase_price || 0);
    const sellingPrice = safeNumber(product.selling_price || 0);
    const gstPercentage = safeNumber(item.gst_percentage || product.gst_percentage || 0);
    const totalAmount = safeNumber(item.total_amount || 0);
    const paidAmount = safeNumber(item.paid_amount || 0);
    const dueAmount = totalAmount - paidAmount;
    
    // Product images
    const imageUrl = product.image || null;
    const brandName = product.brand?.name || null;
    const categoryName = product.category?.name || null;
    const unitName = product.unit?.name || null;
    
    // Invoice details
    const invoiceNumber = item.invoice_number || null;
    const invoiceDate = item.invoice_date || null;
    const hasInvoice = invoiceNumber && invoiceNumber !== "0" && invoiceNumber !== "null";

    // Stock status
    const isFullyPaid = dueAmount <= 0 && totalAmount > 0;
    const isPartiallyPaid = dueAmount > 0 && paidAmount > 0;
    const isUnpaid = paidAmount === 0 && totalAmount > 0;
    const isZeroAmount = totalAmount === 0;

    const getStockStatus = () => {
      if (isZeroAmount) {
        return {
          label: "No Amount",
          color: "#6B7280",
          bg: darkMode ? "#374151" : "#F3F4F6",
          icon: "minus-circle",
        };
      }
      if (isFullyPaid) {
        return {
          label: "Fully Paid",
          color: "#10B981",
          bg: darkMode ? "#064E3B" : "#D1FAE5",
          icon: "check-circle",
        };
      }
      if (isPartiallyPaid) {
        return {
          label: "Partial Paid",
          color: "#F59E0B",
          bg: darkMode ? "#78350F" : "#FEF3C7",
          icon: "clock-outline",
        };
      }
      if (isUnpaid) {
        return {
          label: "Unpaid",
          color: "#EF4444",
          bg: darkMode ? "#7F1D1D" : "#FEE2E2",
          icon: "alert-circle",
        };
      }
      return {
        label: "Unknown",
        color: "#6B7280",
        bg: darkMode ? "#374151" : "#F3F4F6",
        icon: "help-circle",
      };
    };

    const stockStatus = getStockStatus();

    return (
      <View
        key={item.id || index}
        className={`rounded-2xl mb-4 overflow-hidden shadow-sm ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: darkMode ? 0.3 : 0.08,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {/* Product Image & Header */}
        <View className="relative">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-48"
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={darkMode ? ["#374151", "#1F2937"] : ["#F3F4F6", "#E5E7EB"]}
              className="w-full h-48 items-center justify-center"
            >
              <View className={`w-20 h-20 rounded-full items-center justify-center ${
                darkMode ? "bg-blue-900/50" : "bg-blue-100"
              }`}>
                <Text className={`text-3xl font-bold ${
                  darkMode ? "text-blue-400" : "text-blue-500"
                }`}>
                  {productName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Overlay Status Badge */}
          <View className="absolute bottom-0 left-0 right-0 flex-row justify-between items-center px-4 py-2 bg-black/60">
            <View className="flex-row items-center">
              <Icon name={stockStatus.icon} size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold ml-1.5">
                {stockStatus.label}
              </Text>
            </View>
            <Text className="text-white text-xs font-bold">
              Qty: {quantity} {unitName || "units"}
            </Text>
          </View>

          {/* Quantity Badge */}
          <View className="absolute top-3 right-3 bg-blue-500 rounded-full px-3 py-1 shadow-md">
            <Text className="text-white text-xs font-bold">
              {quantity} {unitName || "units"}
            </Text>
          </View>

          {/* Invoice Badge */}
          {hasInvoice && (
            <View className="absolute top-3 left-3 bg-green-500 rounded-full px-3 py-1 shadow-md">
              <Text className="text-white text-xs font-bold">
                <Icon name="file-document" size={10} color="#FFFFFF" />
                Invoice
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="p-4">
          {/* Product Name & SKU */}
          <Text className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {productName}
          </Text>
          <Text className={`text-xs font-mono mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            SKU: {productSku}
          </Text>

          {/* Brand & Category */}
          <View className="flex-row flex-wrap mt-2 gap-1">
            {brandName && (
              <View className={`flex-row items-center px-2 py-0.5 rounded-md ${
                darkMode ? "bg-purple-900/30" : "bg-purple-100"
              }`}>
                <Icon name="factory" size={10} color={darkMode ? "#A78BFA" : "#7C3AED"} />
                <Text className={`text-xs ml-1 ${darkMode ? "text-purple-400" : "text-purple-700"}`}>
                  {brandName}
                </Text>
              </View>
            )}
            {categoryName && (
              <View className={`flex-row items-center px-2 py-0.5 rounded-md ${
                darkMode ? "bg-blue-900/30" : "bg-blue-100"
              }`}>
                <Icon name="tag-outline" size={10} color={darkMode ? "#60A5FA" : "#2563EB"} />
                <Text className={`text-xs ml-1 ${darkMode ? "text-blue-400" : "text-blue-700"}`}>
                  {categoryName}
                </Text>
              </View>
            )}
            {unitName && (
              <View className={`flex-row items-center px-2 py-0.5 rounded-md ${
                darkMode ? "bg-green-900/30" : "bg-green-100"
              }`}>
                <Icon name="ruler" size={10} color={darkMode ? "#34D399" : "#059669"} />
                <Text className={`text-xs ml-1 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                  {unitName}
                </Text>
              </View>
            )}
          </View>

          {/* Price & GST */}
          <View className="flex-row items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <View className="flex-1">
              <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Purchase Price
              </Text>
              <Text className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                ₹{formatCurrency(purchasePrice)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Selling Price
              </Text>
              <Text className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                ₹{formatCurrency(sellingPrice)}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                GST
              </Text>
              <Text className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {formatCurrency(gstPercentage)}%
              </Text>
            </View>
          </View>

          {/* Total & Payment Summary */}
          <View className="flex-row items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <View className="flex-1">
              <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Total Amount
              </Text>
              <Text className={`text-base font-bold ${
                totalAmount > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-500"
              }`}>
                ₹{formatCurrency(totalAmount)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Paid Amount
              </Text>
              <Text className={`text-base font-bold text-green-600 dark:text-green-400`}>
                ₹{formatCurrency(paidAmount)}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Due Amount
              </Text>
              <Text className={`text-base font-bold ${
                dueAmount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
              }`}>
                ₹{formatCurrency(dueAmount)}
              </Text>
            </View>
          </View>

          {/* Invoice Details */}
          {hasInvoice && (
            <View className="flex-row items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Icon name="file-document" size={16} color={darkMode ? "#9CA3AF" : "#6B7280"} />
              <Text className={`text-sm ml-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Invoice: {invoiceNumber}
              </Text>
              {invoiceDate && (
                <Text className={`text-sm ml-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {formatDate(invoiceDate)}
                </Text>
              )}
            </View>
          )}

          {/* Created Date */}
          <View className="flex-row items-center mt-2">
            <Icon name="calendar" size={12} color={darkMode ? "#6B7280" : "#9CA3AF"} />
            <Text className={`text-xs ml-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Added: {formatDate(item.created_at)}
            </Text>
          </View>

          {/* Payment Progress Bar */}
          {totalAmount > 0 && (
            <View className="mt-3">
              <View className={`w-full h-1.5 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                <View
                  className={`h-1.5 rounded-full ${
                    dueAmount <= 0 ? "bg-green-500" : "bg-yellow-500"
                  }`}
                  style={{ width: `${(paidAmount / totalAmount) * 100}%` }}
                />
              </View>
              <Text className={`text-xs mt-1 text-right ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {Math.round((paidAmount / totalAmount) * 100)}% Paid
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && products.length === 0) {
    return (
      <View className="py-12 items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Loading products...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={onRefresh}
          colors={["#3B82F6"]}
          tintColor={darkMode ? "#F9FAFB" : "#3B82F6"}
        />
      }
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      className="p-4"
    >
      {products.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Page Indicator */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Showing {products.length} of {total} products
            </Text>
            <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Page {currentPage}/{lastPage}
            </Text>
          </View>

          {/* Product List - Full width cards */}
          <View className="flex-1">
            {products.map((item, index) => renderProductCard(item, index))}
          </View>

          {/* Loading More Indicator */}
          {loadingMore && (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading more products...
              </Text>
            </View>
          )}

          {/* No More Products */}
          {!hasMore && products.length > 0 && products.length === total && (
            <View className="py-4 items-center">
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No more products to load
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default SellerProductList;