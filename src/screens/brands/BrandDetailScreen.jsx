import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useBrandDetail } from "../../hooks/useBrandDetail";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";

const BrandDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { brandId } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { 
    brand, 
    loading, 
    error, 
    updateBrand, 
    deleteBrand,
    products = []
  } = useBrandDetail(brandId);
  const [activeTab, setActiveTab] = useState("details");

  console.log('Brand Data:', brand);

  const handleEdit = () => {
    navigation.navigate("AddBrand", { brandId });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Brand",
      "Are you sure you want to delete this brand?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteBrand();
            if (result.success) {
              Alert.alert("Success", "Brand deleted successfully");
              navigation.goBack();
            } else {
              Alert.alert("Error", result.error || "Failed to delete brand");
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Brand: ${brand?.name}\nDescription: ${brand?.description || 'No description'}\nStatus: ${brand?.is_active ? 'Active' : 'Inactive'}`,
        title: brand?.name,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleViewProduct = (product) => {
    navigation.navigate("ProductsStack", { screen: "ProductDetail", params: { productId: product.id } });
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
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
              Brand Details
            </Text>
            <View className="w-10" />
          </View>
          <Loading text="Loading brand..." />
        </SafeAreaView>
      </View>
    );
  }

  if (error || !brand) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
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
              Brand Details
            </Text>
            <View className="w-10" />
          </View>
          <ErrorState
            title="Brand Not Found"
            description="The brand you're looking for doesn't exist or couldn't be loaded."
            onRetry={() => navigation.goBack()}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className={`flex-1 pb-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Custom Header with Back, Share, and Edit Buttons */}
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
            Brand Details
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleShare}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon name="share-variant" size={22} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}
            >
              <Icon name="pencil" size={22} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Brand Header with Gradient */}
          <LinearGradient
            colors={brand.is_active ? ["#3b82f6", "#2563eb"] : ["#6b7280", "#4b5563"]}
            className="rounded-2xl p-6 mt-4 mb-4"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 12 }}
          >
            <View className="items-center">
              <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center mb-4">
                <Icon 
                  name={brand.is_active ? "trademark" : "trademark"} 
                  size={40} 
                  color="#ffffff" 
                />
              </View>
              <Text className="text-white text-2xl font-bold mb-2">
                {brand.name}
              </Text>
              {brand.slug && (
                <Text className="text-white/80 text-sm mb-3">
                  Slug: {brand.slug}
                </Text>
              )}
              <View className="flex-row items-center">
                <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                  <Text className="text-white text-sm">
                    ID: #{brand.id}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${
                  brand.is_active ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <Text className="text-white text-sm">
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Tabs */}
          <View className={`flex-row rounded-[50px]  mb-4 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {["details", "products"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-[50px] ${
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
              {/* Description */}
              {brand.description ? (
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
                    {brand.description}
                  </Text>
                </View>
              ) : (
                <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <Text className={`text-center italic ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No description available
                  </Text>
                </View>
              )}

              {/* Brand Details Grid */}
              <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Text className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Brand Information
                </Text>

                <View className="flex-row flex-wrap">
                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Brand ID
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      #{brand.id}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Status
                    </Text>
                    <View className="flex-row items-center">
                      <View className={`w-2 h-2 rounded-full mr-1 ${
                        brand.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <Text className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Created By (User ID)
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      #{brand.created_by || brand.user_id || 'N/A'}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      User ID
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      #{brand.user_id || brand.created_by || 'N/A'}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Created At
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {formatDate(brand.created_at)}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Last Updated
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {formatDate(brand.updated_at)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Slug Information */}
              {brand.slug && (
                <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <Text className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    URL Information
                  </Text>
                  
                  <View className="flex-row items-center">
                    <Icon name="link-variant" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                    <Text className={`ml-3 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Slug: {brand.slug}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center mt-3">
                    <Icon name="web" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                    <Text className={`ml-3 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      URL: /brands/{brand.slug}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === "products" && (
            <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Products from this Brand
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ProductsStack", { screen: "Products", params: { brandId: brand.id } })}
                  className="bg-blue-500 px-4 py-2 rounded-xl"
                >
                  <Text className="text-white font-medium">View All</Text>
                </TouchableOpacity>
              </View>

              {products && products.length > 0 ? (
                products.slice(0, 5).map((product, index) => (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => handleViewProduct(product)}
                    className={`flex-row items-center p-3 ${
                      index < products.length - 1 ? 'border-b' : ''
                    } ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                  >
                    <View className={`w-12 h-12 rounded-lg overflow-hidden ${
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
                          <Icon name="package-variant" size={20} color="#9ca3af" />
                        </View>
                      )}
                    </View>

                    <View className="flex-1 ml-3">
                      <Text className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {product.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          ID: #{product.id}
                        </Text>
                        {product.price && (
                          <>
                            <Text className={`text-xs mx-2 ${
                              isDarkMode ? 'text-gray-700' : 'text-gray-300'
                            }`}>
                              •
                            </Text>
                            <Text className={`text-xs font-semibold ${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`}>
                              ${product.price}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="items-center justify-center py-8">
                  <Icon name="package-variant" size={48} color="#9ca3af" />
                  <Text className={`text-center mt-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No products from this brand
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("ProductsStack", { screen: "AddProduct", params: { brandId: brand.id } })}
                    className="mt-4 bg-blue-500 px-4 py-2 rounded-xl"
                  >
                    <Text className="text-white font-medium">Add Product</Text>
                  </TouchableOpacity>
                </View>
              )}
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
      </SafeAreaView>
    </View>
  );
};

export default BrandDetailScreen;