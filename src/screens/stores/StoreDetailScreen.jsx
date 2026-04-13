import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
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
import { useStoreDetail } from "../../hooks/useStoreDetail";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";

const StoreDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { storeId } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { 
    store, 
    loading, 
    error, 
    updateStore, 
    deleteStore,
  } = useStoreDetail(storeId);
  const [activeTab, setActiveTab] = useState("details");

  console.log('Store Data:', store);

  const handleEdit = () => {
    navigation.navigate("AddStore", { storeId });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Store",
      "Are you sure you want to delete this store?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteStore();
            if (result.success) {
              Alert.alert("Success", "Store deleted successfully");
              navigation.goBack();
            } else {
              Alert.alert("Error", result.error || "Failed to delete store");
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Store: ${store?.name}\nEmail: ${store?.email}\nMobile: ${store?.mobile || 'N/A'}\nAddress: ${store?.address}, ${store?.city}\nGST: ${store?.gst || 'N/A'}\nStatus: ${store?.status ? 'Active' : 'Inactive'}`,
        title: store?.name,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
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
              Store Details
            </Text>
            <View className="w-10" />
          </View>
          <Loading text="Loading store..." />
        </SafeAreaView>
      </View>
    );
  }

  if (error || !store) {
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
              Store Details
            </Text>
            <View className="w-10" />
          </View>
          <ErrorState
            title="Store Not Found"
            description="The store you're looking for doesn't exist or couldn't be loaded."
            onRetry={() => navigation.goBack()}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className={`flex-1 pb-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Custom Header */}
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
            Store Details
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
          {/* Store Header with Gradient */}
          <LinearGradient
            colors={store.status ? ["#3b82f6", "#2563eb"] : ["#6b7280", "#4b5563"]}
            className="rounded-2xl p-6 mt-4 mb-4"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="items-center">
              <View className="w-24 h-24 bg-white/20 rounded-2xl items-center justify-center mb-4 overflow-hidden">
                {store.logo ? (
                  <Image 
                    source={{ uri: store.logo }} 
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Icon name="store" size={48} color="#ffffff" />
                )}
              </View>
              <Text className="text-white text-2xl font-bold mb-2">
                {store.name}
              </Text>
              {store.gst && (
                <Text className="text-white/80 text-sm mb-3">
                  GST: {store.gst}
                </Text>
              )}
              <View className="flex-row items-center">
                <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                  <Text className="text-white text-sm">
                    ID: #{store.id}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${
                  store.status ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <Text className="text-white text-sm">
                    {store.status ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Tabs */}
          <View className={`flex-row rounded-2xl p-1 mb-4 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {["details", "contact", "location"].map((tab) => (
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
            <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <Text className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Store Information
              </Text>

              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-4">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Store ID
                  </Text>
                  <Text className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    #{store.id}
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
                      store.status ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {store.status ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 mb-4">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Created By
                  </Text>
                  <Text className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    #{store.created_by || store.user_id || 'N/A'}
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
                    #{store.user_id || store.created_by || 'N/A'}
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
                    {formatDate(store.created_at)}
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
                    {formatDate(store.updated_at)}
                  </Text>
                </View>
              </View>

              {store.gst && (
                <View className={`mt-2 pt-4 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    GST Number
                  </Text>
                  <Text className={`text-base font-medium mt-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {store.gst}
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "contact" && (
            <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <Text className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Contact Information
              </Text>

              <View className="mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Email Address
                </Text>
                <View className="flex-row items-center mt-1">
                  <Icon name="email" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                  <Text className={`ml-3 text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                    {store.email}
                  </Text>
                </View>
              </View>

              {store.mobile && (
                <View className="mb-4">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Mobile Number
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Icon name="phone" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                    <Text className={`ml-3 text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {store.mobile}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === "location" && (
            <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <Text className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Location Information
              </Text>

              <View className="mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Address
                </Text>
                <View className="flex-row items-start mt-1">
                  <Icon name="map-marker" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                  <Text className={`ml-3 text-base flex-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {store.address}
                  </Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  City
                </Text>
                <View className="flex-row items-center mt-1">
                  <Icon name="city" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                  <Text className={`ml-3 text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {store.city}
                  </Text>
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
      </SafeAreaView>
    </View>
  );
};

export default StoreDetailScreen;