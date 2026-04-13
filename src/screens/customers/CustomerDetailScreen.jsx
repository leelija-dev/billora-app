import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeStore } from "../../store/themeStore";
import { useCustomerDetail } from "../../hooks/useCustomerDetail";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import { format } from 'date-fns';

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { customerId } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { 
    customer, 
    loading, 
    error, 
    paymentHistory,
    updateCustomer, 
    addDuePayment,
    deleteCustomer,
    filterByDateRange,
  } = useCustomerDetail(customerId);
  
  const [activeTab, setActiveTab] = useState("details");
  const [showDueModal, setShowDueModal] = useState(false);
  const [dueAmount, setDueAmount] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleEdit = () => {
    navigation.navigate("AddCustomer", { customerId });
  };

  const handleAddDue = () => {
    setShowDueModal(true);
  };

  const handleSubmitDue = async () => {
    if (!dueAmount || parseFloat(dueAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const result = await addDuePayment({ due_payment: parseFloat(dueAmount) });
    if (result.success) {
      Alert.alert("Success", "Due payment added successfully");
      setShowDueModal(false);
      setDueAmount("");
    } else {
      Alert.alert("Error", result.error || "Failed to add due payment");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteCustomer();
            if (result.success) {
              Alert.alert("Success", "Customer deleted successfully");
              navigation.goBack();
            } else {
              Alert.alert("Error", result.error || "Failed to delete customer");
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      const message = `
Customer: ${customer?.name}
Phone: ${customer?.phone}
Email: ${customer?.email || 'N/A'}
Address: ${customer?.address}, ${customer?.city || ''}
Total Purchases: $${(parseFloat(customer?.total_purchases) || 0).toFixed(2)}
Total Paid: $${(parseFloat(customer?.total_paid) || 0).toFixed(2)}
Due Amount: $${(parseFloat(customer?.due_amount) || 0).toFixed(2)}
      `;
      
      await Share.share({
        message,
        title: `Customer - ${customer?.name}`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleDateFilter = async () => {
    setShowDatePicker(false);
    const formattedStart = format(startDate, 'yyyy-MM-dd');
    const formattedEnd = format(endDate, 'yyyy-MM-dd');
    await filterByDateRange(formattedStart, formattedEnd);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1">
          <Loading text="Loading customer details..." />
        </SafeAreaView>
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1">
          <ErrorState
            title="Customer Not Found"
            description="The customer you're looking for doesn't exist or couldn't be loaded."
            onRetry={() => navigation.goBack()}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className={`flex-1 pb-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header */}
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
            Customer Profile
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
          {/* Customer Header with Gradient */}
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            className="rounded-2xl p-6 mt-4 mb-4"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="items-center">
              <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center mb-4">
                <Icon name="account" size={40} color="#ffffff" />
              </View>
              <Text className="text-white text-2xl font-bold mb-1">
                {customer.name}
              </Text>
              <Text className="text-white/80 text-sm mb-3">
                Customer ID: #{customer.id}
              </Text>
              
              <View className="flex-row mt-2">
                <View className={`px-4 py-2 rounded-xl mr-2 ${
                  customer.due_amount > 0 ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  <Text className="text-white font-semibold">
                    Due: ${(parseFloat(customer.due_amount) || 0).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleAddDue}
                  className="bg-white/20 px-4 py-2 rounded-xl"
                >
                  <Text className="text-white font-semibold">Add Due</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Tabs */}
          <View className={`flex-row rounded-2xl p-1 mb-4 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {["details", "payment history"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab.replace(' ', ''))}
                className={`flex-1 py-3 rounded-xl ${
                  activeTab === tab.replace(' ', '') ? "bg-blue-500" : ""
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    activeTab === tab.replace(' ', '')
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
              {/* Contact Information */}
              <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Text className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Contact Information
                </Text>

                <View className="flex-row items-center mb-3">
                  <Icon name="phone" size={20} color="#3b82f6" />
                  <View className="ml-3">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Phone
                    </Text>
                    <Text className={`text-base font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {customer.phone}
                    </Text>
                  </View>
                </View>

                {customer.email && (
                  <View className="flex-row items-center mb-3">
                    <Icon name="email" size={20} color="#3b82f6" />
                    <View className="ml-3">
                      <Text className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Email
                      </Text>
                      <Text className={`text-base font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {customer.email}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row items-center">
                  <Icon name="map-marker" size={20} color="#3b82f6" />
                  <View className="ml-3">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Address
                    </Text>
                    <Text className={`text-base font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Financial Summary */}
              <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Text className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Financial Summary
                </Text>

                <View className="flex-row flex-wrap">
                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Total Purchases
                    </Text>
                    <Text className={`text-lg font-bold text-blue-500`}>
                      ${(parseFloat(customer.total_purchases) || 0).toFixed(2)}
                    </Text>
                  </View>

                  <View className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 shadow-sm`}>
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total Paid
                    </Text>
                    <Text className={`text-lg font-bold text-green-500`}>
                      ${(parseFloat(customer.total_paid) || 0).toFixed(2)}
                    </Text>
                  </View>

                  <View className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 shadow-sm`}>
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Due Amount
                    </Text>
                    <Text className={`text-lg font-bold ${
                      parseFloat(customer.due_amount) > 0 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      ${(parseFloat(customer.due_amount) || 0).toFixed(2)}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Payment Status
                    </Text>
                    <View className="flex-row items-center">
                      <View className={`w-2 h-2 rounded-full mr-2 ${
                        customer.due_amount > 0 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <Text className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {customer.due_amount > 0 ? 'Has Due' : 'Clear'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Additional Information */}
              <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Text className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Additional Information
                </Text>

                <View className="flex-row flex-wrap">
                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Created By
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      #{customer.created_by || customer.admin_id || 'N/A'}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Admin ID
                    </Text>
                    <Text className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      #{customer.admin_id || 'N/A'}
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
                      {formatDate(customer.created_at)}
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
                      {formatDate(customer.updated_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {activeTab === "paymenthistory" && (
            <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Payment History
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-blue-500 px-3 py-2 rounded-xl flex-row items-center"
                >
                  <Icon name="calendar-filter" size={16} color="#ffffff" />
                  <Text className="text-white text-xs ml-1">Filter by Date</Text>
                </TouchableOpacity>
              </View>

              {paymentHistory && paymentHistory.length > 0 ? (
                paymentHistory.map((payment, index) => (
                  <View
                    key={payment.id || index}
                    className={`flex-row justify-between items-center py-3 ${
                      index < paymentHistory.length - 1 ? 'border-b' : ''
                    } ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                          payment.type === 'payment' 
                            ? 'bg-green-100' 
                            : 'bg-blue-100'
                        }`}>
                          <Icon 
                            name={payment.type === 'payment' ? 'cash' : 'cart'} 
                            size={16} 
                            color={payment.type === 'payment' ? '#10b981' : '#3b82f6'} 
                          />
                        </View>
                        <View>
                          <Text className={`font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-800'
                          }`}>
                            {payment.type === 'payment' ? 'Payment' : 'Purchase'}
                          </Text>
                          <Text className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {formatDateTime(payment.date)}
                          </Text>
                        </View>
                      </View>
                      {payment.description && (
                        <Text className={`text-xs mt-1 ml-11 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {payment.description}
                        </Text>
                      )}
                    </View>
                    <Text className={`text-base font-bold ${
                      payment.type === 'payment' ? 'text-green-500' : 'text-blue-500'
                    }`}>
                      {payment.type === 'payment' ? '-' : '+'} ${(parseFloat(payment.amount) || 0).toFixed(2)}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="items-center justify-center py-8">
                  <Icon name="history" size={48} color="#9ca3af" />
                  <Text className={`text-center mt-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No payment history found
                  </Text>
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

      {/* Add Due Modal */}
      <Modal
        visible={showDueModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDueModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center">
          <View className={`mx-4 rounded-2xl p-5 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xl font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Add Due Payment
            </Text>

            <Text className={`text-sm mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Enter amount to add to customer's due
            </Text>

            <View className={`flex-row items-center rounded-xl px-4 border mb-4 ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
            }`}>
              <Text className="text-gray-500 font-bold text-lg">$</Text>
              <TextInput
                value={dueAmount}
                onChangeText={setDueAmount}
                placeholder="0.00"
                placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                keyboardType="decimal-pad"
                className={`flex-1 ml-2 py-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDueModal(false)}
                className={`flex-1 py-4 rounded-xl items-center border ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-700' 
                    : 'border-gray-200 bg-gray-100'
                }`}
              >
                <Text className={`font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitDue}
                className="flex-1 bg-blue-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Add Due</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Filter Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-center">
          <View className={`mx-4 rounded-2xl p-5 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xl font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Filter by Date Range
            </Text>

            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              className={`mb-4 p-4 rounded-xl border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <Text className={`text-xs mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Start Date
              </Text>
              <Text className={`text-base ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {format(startDate, 'PPP')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              className={`mb-6 p-4 rounded-xl border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <Text className={`text-xs mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                End Date
              </Text>
              <Text className={`text-base ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {format(endDate, 'PPP')}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className={`flex-1 py-4 rounded-xl items-center border ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-700' 
                    : 'border-gray-200 bg-gray-100'
                }`}
              >
                <Text className={`font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDateFilter}
                className="flex-1 bg-blue-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomerDetailScreen;