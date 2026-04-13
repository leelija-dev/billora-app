// screens/products/ProductDetailScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useProductDetail } from "../../hooks/useProductDetail";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import { formatCurrency } from "../../utils/helpers";

const ProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { 
    product, 
    loading, 
    error, 
    updateProduct, 
    deleteProduct, 
    updateStock 
  } = useProductDetail(productId);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdate, setStockUpdate] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  const handleEdit = () => {
    navigation.navigate("AddProduct", { productId });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteProduct();
            if (result.success) {
              Alert.alert("Success", "Product deleted successfully");
              navigation.goBack();
            } else {
              Alert.alert("Error", result.error || "Failed to delete product");
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product?.name}\nPrice: ${formatCurrency(product?.selling_price || product?.price)}\nSKU: ${product?.sku}`,
        title: product?.name,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleUpdateStock = () => {
    setShowStockModal(true);
  };

  const confirmStockUpdate = async () => {
    const newStock = parseInt(stockUpdate);
    if (isNaN(newStock) || newStock < 0) {
      Alert.alert("Invalid Stock", "Please enter a valid stock number");
      return;
    }

    const result = await updateStock({ stock: newStock });
    if (result.success) {
      Alert.alert("Success", `Stock updated to ${newStock} units`);
      setShowStockModal(false);
    } else {
      Alert.alert("Error", result.error || "Failed to update stock");
    }
  };

  const getStockStatus = () => {
    if (!product)
      return { label: "Unknown", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" };
    const stock = product.stock || 0;
    const minStock = product.minStock || 5;
    if (stock === 0)
      return { 
        label: "Out of Stock", 
        color: "text-red-600 dark:text-red-400", 
        bg: "bg-red-100 dark:bg-red-900/30" 
      };
    if (stock <= minStock)
      return {
        label: "Low Stock",
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/30",
      };
    return {
      label: "In Stock",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    };
  };

  const stockStatus = getStockStatus();

  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
          {/* Custom Header for Loading State */}
          <View className={`px-4 py-3 flex-row items-center border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon name="arrow-left" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
            <Text className={`flex-1 text-center text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Product Details
            </Text>
            <View className="w-10" />
          </View>
          <Loading text="Loading product..." />
        </SafeAreaView>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
          {/* Custom Header for Error State */}
          <View className={`px-4 py-3 flex-row items-center border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon name="arrow-left" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
            <Text className={`flex-1 text-center text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Product Details
            </Text>
            <View className="w-10" />
          </View>
          <ErrorState
            title="Product Not Found"
            description="The product you're looking for doesn't exist."
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1 pb-16" edges={["top", "left", "right"]}>
        {/* Custom Header with Back, Share, and Edit Buttons */}
        <View className={`px-4 py-3 flex-row items-center border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <Icon 
              name="arrow-left" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#1F2937'} 
            />
          </TouchableOpacity>

          {/* Title */}
          <Text className={`flex-1 text-center text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Product Details
          </Text>

          {/* Action Buttons */}
          <View className="flex-row items-center gap-2">
            {/* Share Button */}
            <TouchableOpacity
              onPress={handleShare}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon 
                name="share-variant" 
                size={22} 
                color={isDarkMode ? '#FFFFFF' : '#1F2937'} 
              />
            </TouchableOpacity>

            {/* Edit Button */}
            <TouchableOpacity
              onPress={handleEdit}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}
            >
              <Icon 
                name="pencil" 
                size={22} 
                color="#3b82f6" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image Section */}
          <View className={`rounded-2xl p-4 mb-4 mt-4 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row">
              <View className={`w-24 h-24 rounded-xl overflow-hidden ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                {product.image ? (
                  <Image
                    source={{ uri: product.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Icon name="image-off" size={30} color="#9ca3af" />
                  </View>
                )}
              </View>

              <View className="flex-1 ml-4">
                <Text className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {product.name}
                </Text>
                
                {/* Category */}
                {product.category_id && (
                  <View className="flex-row items-center mt-1">
                    <Icon name="tag" size={14} color="#9ca3af" />
                    <Text className={`text-sm ml-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Category: {product.category_name || `ID: ${product.category_id}`}
                    </Text>
                  </View>
                )}

                {/* Brand */}
                {product.brand_id && (
                  <View className="flex-row items-center mt-1">
                    <Icon name="factory" size={14} color="#9ca3af" />
                    <Text className={`text-sm ml-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Brand: {product.brand_name || `ID: ${product.brand_id}`}
                    </Text>
                  </View>
                )}

                {/* SKU */}
                <View className="flex-row items-center mt-1">
                  <Icon name="barcode" size={14} color="#9ca3af" />
                  <Text className={`text-sm ml-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    SKU: {product.sku || "Not Set"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View className={`flex-row rounded-2xl p-1 mb-4 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {["details", "history", "stats"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl ${
                  activeTab === tab ? "bg-blue-500" : ""
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    activeTab === tab 
                      ? "text-white" 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "details" && (
            <>
              {/* Price Card */}
              <LinearGradient
                colors={["#3b82f6", "#2563eb"]}
                className="rounded-2xl p-4 mb-4"
                style={{borderRadius:13}}
              >
                <Text className="text-white/80 text-sm mb-1">
                  Selling Price
                </Text>
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-white text-3xl font-bold">
                    {formatCurrency(product.selling_price || product.price || 0)}
                  </Text>
                  {product.purchase_price > 0 && (
                    <View>
                      <Text className="text-white/60 text-sm line-through">
                        {formatCurrency(product.purchase_price)}
                      </Text>
                      <Text className="text-white text-xs font-semibold">
                        Margin:{" "}
                        {Math.round(
                          ((product.selling_price - product.purchase_price) / 
                           product.purchase_price) * 100
                        )}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* GST & Discount */}
                {(product.gst_percentage > 0 || product.discount_percentage > 0) && (
                  <View className="flex-row mt-2 pt-2 border-t border-white/20">
                    {product.gst_percentage > 0 && (
                      <View className="flex-row items-center mr-3">
                        <Icon name="percent" size={14} color="white" />
                        <Text className="text-white text-xs ml-1">
                          GST: {product.gst_percentage}%
                        </Text>
                      </View>
                    )}
                    {product.discount_percentage > 0 && (
                      <View className="flex-row items-center">
                        <Icon name="sale" size={14} color="white" />
                        <Text className="text-white text-xs ml-1">
                          Discount: {product.discount_percentage}%
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </LinearGradient>

              {/* Stock Status Card */}
              <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Stock Status
                  </Text>
                  <TouchableOpacity
                    onPress={handleUpdateStock}
                    className="bg-blue-500 px-4 py-2 rounded-xl"
                  >
                    <Text className="text-white font-medium">Update Stock</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className={`w-3 h-3 rounded-full ${stockStatus.bg}`} />
                    <Text className={`ml-2 font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </Text>
                  </View>
                  <Text className={`text-2xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {product.stock || 0} units
                  </Text>
                </View>

                {product.minStock > 0 && product.stock >= 0 && (
                  <View className="mt-3">
                    <View className="flex-row justify-between mb-1">
                      <Text className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Min Stock Level
                      </Text>
                      <Text className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {product.minStock} units
                      </Text>
                    </View>
                    <View className={`h-2 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <View
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${Math.min((product.stock / product.minStock) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Unit Information */}
                <View className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Unit: {product.unit_name || `ID: ${product.unit_id}` || "Not Set"} | Amount: {product.unit_amount || 1}
                  </Text>
                </View>
              </View>

              {/* Description */}
              {product.description && (
                <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <Text className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Description
                  </Text>
                  <Text className={`leading-6 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {product.description}
                  </Text>
                </View>
              )}

              {/* Additional Details */}
              <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Text className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Product Information
                </Text>

                <View className="flex-row flex-wrap">
                  <View className="w-1/2 mb-3">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Product ID
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      #{product.id}
                    </Text>
                  </View>
                  <View className="w-1/2 mb-3">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Created By
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      User #{product.created_by || "N/A"}
                    </Text>
                  </View>
                  <View className="w-1/2 mb-3">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Status
                    </Text>
                    <View className="flex-row items-center">
                      <View className={`w-2 h-2 rounded-full mr-1 ${
                        product.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <Text className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <View className="w-1/2 mb-3">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Created At
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {new Date(product.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {activeTab === "history" && (
            <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <Text className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Stock History
              </Text>

              <View className={`border-l-2 pl-4 ml-2 ${
                isDarkMode ? 'border-blue-900' : 'border-blue-200'
              }`}>
                {/* Sample history items - replace with actual data */}
                <View className="mb-4">
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full -ml-5 mr-3 ${
                      isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                    }`} />
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      Stock Updated
                    </Text>
                    <Text className={`text-xs ml-auto ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      2 hours ago
                    </Text>
                  </View>
                  <Text className={`text-xs ml-4 mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Quantity changed from 45 to 50 units
                  </Text>
                </View>

                <View className="mb-4">
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full -ml-5 mr-3 ${
                      isDarkMode ? 'bg-green-400' : 'bg-green-500'
                    }`} />
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      Stock Added
                    </Text>
                    <Text className={`text-xs ml-auto ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      Yesterday
                    </Text>
                  </View>
                  <Text className={`text-xs ml-4 mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Received 20 units from supplier
                  </Text>
                </View>

                <View className="mb-4">
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full -ml-5 mr-3 ${
                      isDarkMode ? 'bg-red-400' : 'bg-red-500'
                    }`} />
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      Stock Sold
                    </Text>
                    <Text className={`text-xs ml-auto ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      3 days ago
                    </Text>
                  </View>
                  <Text className={`text-xs ml-4 mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Sold 5 units to customer
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === "stats" && (
            <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <Text className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Product Statistics
              </Text>

              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-4 pr-2">
                  <View className={`rounded-xl p-3 ${
                    isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                  }`}>
                    <Icon name="currency-usd" size={24} color="#3b82f6" />
                    <Text className={`text-2xl font-bold mt-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {formatCurrency((product.selling_price || 0) * (product.stock || 0))}
                    </Text>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Inventory Value
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 mb-4 pl-2">
                  <View className={`rounded-xl p-3 ${
                    isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                  }`}>
                    <Icon name="trending-up" size={24} color="#10b981" />
                    <Text className={`text-2xl font-bold mt-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      156
                    </Text>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Units Sold
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 mb-4 pr-2">
                  <View className={`rounded-xl p-3 ${
                    isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'
                  }`}>
                    <Icon name="calendar" size={24} color="#8b5cf6" />
                    <Text className={`text-2xl font-bold mt-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      45
                    </Text>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Days in Stock
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 mb-4 pl-2">
                  <View className={`rounded-xl p-3 ${
                    isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50'
                  }`}>
                    <Icon name="rotate-3d" size={24} color="#f97316" />
                    <Text className={`text-2xl font-bold mt-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      2.3x
                    </Text>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Turnover Rate
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={handleDelete}
              className="flex-1 bg-red-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="delete" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEdit}
              className="flex-1 bg-blue-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="pencil" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Edit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Stock Update Modal */}
        <Modal
          visible={showStockModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStockModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className={`rounded-2xl w-80 p-5 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <View className="items-center mb-4">
                <LinearGradient
                  colors={["#3b82f6", "#2563eb"]}
                  className="w-16 h-16 rounded-full items-center justify-center"
                >
                  <Icon name="package-up" size={32} color="#ffffff" />
                </LinearGradient>
              </View>

              <Text className={`text-xl font-semibold text-center mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Update Stock
              </Text>
              <Text className={`text-sm text-center mb-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Enter the new stock quantity for {product.name}
              </Text>

              <TextInput
                value={stockUpdate}
                onChangeText={setStockUpdate}
                keyboardType="numeric"
                placeholder="Enter quantity"
                placeholderTextColor={isDarkMode ? '#6B7280' : '#9ca3af'}
                className={`rounded-xl px-4 py-3 mb-4 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              />

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setShowStockModal(false)}
                  className={`flex-1 py-3 rounded-xl ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`font-semibold text-center ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmStockUpdate}
                  className="flex-1 bg-blue-500 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold text-center">
                    Update
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default ProductDetailScreen;