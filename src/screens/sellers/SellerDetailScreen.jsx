import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import useSellerStore from "../../store/sellerStore";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import Toast from "react-native-toast-message";

const SellerDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sellerId } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { 
    getSingleSeller, 
    deleteSeller,
    makeDuePayment,
  } = useSellerStore();
  
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const loadSeller = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSingleSeller(sellerId);
      if (response?.seller) {
        setSeller(response.seller);
      } else if (response?.data?.seller) {
        setSeller(response.data.seller);
      } else {
        setError("Seller not found");
      }
    } catch (err) {
      setError(err.message || "Failed to load seller");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadSeller();
  }, [sellerId]);

  const handleEdit = () => {
    navigation.navigate("Sellers", { screen: "Sellers", params: { editSellerId: sellerId } });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Seller",
      "Are you sure you want to delete this seller?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteSeller(sellerId);
            if (result.success) {
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Seller deleted successfully",
              });
              navigation.goBack();
            } else {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: result.error || "Failed to delete seller",
              });
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Seller: ${seller?.name}\nPhone: ${seller?.phone || 'N/A'}\nEmail: ${seller?.email || 'N/A'}\nAddress: ${seller?.address}, ${seller?.city}\nGST: ${seller?.gst_number || 'N/A'}\nDue Amount: ₹${seller?.due_amount || 0}`,
        title: seller?.name,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handlePaymentSubmit = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Please enter a valid payment amount",
      });
      return;
    }

    if (amount > parseFloat(seller.due_amount)) {
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Payment cannot exceed due amount",
      });
      return;
    }

    setPaymentSubmitting(true);
    try {
      const result = await makeDuePayment(sellerId, {
        user_id: seller.user_id,
        paid_amount: amount,
      });

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Payment Successful",
          text2: `₹${amount} paid successfully`,
        });
        setShowPaymentModal(false);
        setPaymentAmount("");
        await loadSeller(); // Refresh seller data
      } else {
        Toast.show({
          type: "error",
          text1: "Payment Failed",
          text2: result.error || "Failed to process payment",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: error.message || "Failed to process payment",
      });
    } finally {
      setPaymentSubmitting(false);
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
              Seller Details
            </Text>
            <View className="w-10" />
          </View>
          <Loading text="Loading seller..." />
        </SafeAreaView>
      </View>
    );
  }

  if (error || !seller) {
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
              Seller Details
            </Text>
            <View className="w-10" />
          </View>
          <ErrorState
            title="Seller Not Found"
            description="The seller you're looking for doesn't exist or couldn't be loaded."
            onRetry={() => navigation.goBack()}
          />
        </SafeAreaView>
      </View>
    );
  }

  const dueAmount = parseFloat(seller.due_amount) || 0;
  const hasDue = dueAmount > 0;

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
            Seller Details
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
          {/* Seller Header with Gradient */}
          <LinearGradient
            colors={hasDue ? ["#f97316", "#ea580c"] : ["#3b82f6", "#2563eb"]}
            className="rounded-2xl p-6 mt-4 mb-4"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="items-center">
              <View className="w-24 h-24 bg-white/20 rounded-2xl items-center justify-center mb-4">
                <Icon name="account" size={48} color="#ffffff" />
              </View>
              <Text className="text-white text-2xl font-bold mb-2">
                {seller.name}
              </Text>
              {seller.gst_number && (
                <Text className="text-white/80 text-sm mb-3">
                  GST: {seller.gst_number}
                </Text>
              )}
              <View className="flex-row items-center">
                <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                  <Text className="text-white text-sm">
                    ID: #{seller.id}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Due Amount Card */}
          <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row justify-between items-center">
              <View>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Due Amount
                </Text>
                <Text className={`text-2xl font-bold mt-1 ${
                  hasDue ? 'text-orange-500' : 'text-green-500'
                }`}>
                  ₹{dueAmount.toLocaleString()}
                </Text>
              </View>
              {hasDue && (
                <TouchableOpacity
                  onPress={() => setShowPaymentModal(true)}
                  className="bg-green-500 px-4 py-2 rounded-xl flex-row items-center"
                >
                  <Icon name="cash" size={18} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">Pay Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

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
                Seller Information
              </Text>

              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-4">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Seller ID
                  </Text>
                  <Text className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    #{seller.id}
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
                    #{seller.user_id}
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
                    {formatDate(seller.created_at)}
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
                    {formatDate(seller.updated_at)}
                  </Text>
                </View>
              </View>

              {seller.gst_number && (
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
                    {seller.gst_number}
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

              {seller.email && (
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
                      {seller.email}
                    </Text>
                  </View>
                </View>
              )}

              {seller.phone && (
                <View className="mb-4">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Phone Number
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Icon name="phone" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                    <Text className={`ml-3 text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {seller.phone}
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
                    {seller.address}
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
                    {seller.city}
                  </Text>
                </View>
              </View>

              {seller.state && (
                <View className="mb-4">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    State
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Icon name="map" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                    <Text className={`ml-3 text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {seller.state}
                    </Text>
                  </View>
                </View>
              )}

              {seller.pincode && (
                <View className="mb-4">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Pincode
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Icon name="mailbox" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                    <Text className={`ml-3 text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {seller.pincode}
                    </Text>
                  </View>
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

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
            <View className={`px-4 py-3 flex-row items-center border-b ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                className="mr-4"
              >
                <Icon 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? '#FFFFFF' : '#1F2937'} 
                />
              </TouchableOpacity>
              <Text className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Make Payment
              </Text>
            </View>

            <View className="p-4">
              <View className={`rounded-2xl p-4 mb-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Seller
                </Text>
                <Text className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {seller.name}
                </Text>
              </View>

              <View className={`rounded-2xl p-4 mb-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Due Amount
                </Text>
                <Text className={`text-2xl font-bold text-orange-500`}>
                  ₹{dueAmount.toLocaleString()}
                </Text>
              </View>

              <View className={`rounded-2xl p-4 mb-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Text className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Payment Amount (₹)
                </Text>
                <TextInput
                  className={`flex-1 p-3 text-base rounded-xl border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                  }`}
                  placeholder="Enter amount"
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                onPress={handlePaymentSubmit}
                disabled={paymentSubmitting}
                className="bg-green-500 py-4 rounded-xl flex-row items-center justify-center"
              >
                {paymentSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="cash" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold ml-2">Pay Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

export default SellerDetailScreen;
