// screens/customers/CustomerDetailScreen.js
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  ConfirmationModal,
  SuccessModal,
} from "../../components/common/CustomModal";
import PaymentModal from "../../components/customers/PaymentModal";
import useCustomerStore from "../../store/customerStore";
import { useThemeStore } from "../../store/themeStore";

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { customerId } = route.params || {};
  const { isDarkMode } = useThemeStore();

  const { getCustomer, addDuePayment, deleteCustomer } = useCustomerStore();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [refreshing, setRefreshing] = useState(false);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Date Filter
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState(null);
  const [hasDateFilter, setHasDateFilter] = useState(false);

  // Fetch customer details
  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const customerData = await getCustomer(customerId);
      
      console.log("📦 Customer Data received:", customerData);
      
      if (customerData) {
        // The customerData already contains the customer info and bill_payment_history
        setCustomer(customerData);
        
        // Get payment history from bill_payment_history array
        const history = customerData.bill_payment_history || [];
        console.log("📊 Payment History:", history);
        setPaymentHistory(history);
        setFilteredHistory(null);
        setHasDateFilter(false);
      } else {
        setError("Customer not found");
      }
    } catch (err) {
      console.error("Error fetching customer:", err);
      setError("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  // Filter payment history by date range
  const filterPaymentHistory = () => {
    if (!startDate || !endDate) {
      Alert.alert("Info", "Please select both start and end dates");
      return;
    }

    const filtered = paymentHistory.filter((payment) => {
      const paymentDate = new Date(payment.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      return paymentDate >= start && paymentDate <= end;
    });

    console.log("Filtered payments:", filtered);
    setFilteredHistory(filtered);
    setHasDateFilter(true);
    setShowDatePicker(false);
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setFilteredHistory(null);
    setHasDateFilter(false);
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomerDetails();
    setRefreshing(false);
  };

  const handleEdit = () => {
    navigation.navigate("AddCustomer", { customerId, customerData: customer });
  };

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (amount) => {
    setPaymentProcessing(true);
    try {
      const result = await addDuePayment(customerId, amount);
      if (result && result.success) {
        setSuccessMessage(
          `Payment of ₹${amount.toFixed(2)} processed successfully!`,
        );
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        setShowPaymentModal(false);
        await fetchCustomerDetails();
      } else {
        setSuccessMessage(result?.error || "Failed to process payment");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      setSuccessMessage(error.message || "Failed to process payment");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteCustomer(customerId);
      if (result.success) {
        setSuccessMessage("Customer deleted successfully");
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }, 2000);
      } else {
        setSuccessMessage(result.error || "Failed to delete customer");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      setSuccessMessage(error.message || "Failed to delete customer");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = async () => {
    try {
      const displayHistory = filteredHistory || paymentHistory;
      const totalPurchases = displayHistory.reduce(
        (sum, p) => sum + parseFloat(p.total_amount || 0),
        0,
      );
      const totalPaid = displayHistory.reduce(
        (sum, p) => sum + parseFloat(p.paid_amount || 0),
        0,
      );

      const message = `
📋 CUSTOMER DETAILS
━━━━━━━━━━━━━━━━━━━━━

👤 Name: ${customer?.name}
🆔 ID: #${customer?.id}
📞 Phone: ${customer?.phone}
📧 Email: ${customer?.email || "N/A"}
📍 Address: ${customer?.address || "N/A"}${customer?.city ? `, ${customer?.city}` : ""}
🏷️ GST: ${customer?.gst_number || "N/A"}

💰 FINANCIAL SUMMARY
━━━━━━━━━━━━━━━━━━━━━
💵 Total Purchases: ₹${totalPurchases.toFixed(2)}
✅ Total Paid: ₹${totalPaid.toFixed(2)}
⚠️ Due Amount: ₹${parseFloat(customer?.due_amount || 0).toFixed(2)}
📊 Transactions: ${displayHistory.length}

📅 Customer Since: ${formatDate(customer?.created_at)}
🔄 Last Updated: ${formatDate(customer?.updated_at)}
━━━━━━━━━━━━━━━━━━━━━
      `;

      await Share.share({
        message,
        title: `Customer - ${customer?.name}`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
    } catch {
      return "Invalid date";
    }
  };

  // Get display history (filtered or all)
  const displayHistory = filteredHistory !== null ? filteredHistory : paymentHistory;

  // Calculate statistics from display history
  const totalPurchases = displayHistory.reduce(
    (sum, p) => sum + (parseFloat(p.total_amount) || 0),
    0,
  );
  const totalPaid = displayHistory.reduce(
    (sum, p) => sum + (parseFloat(p.paid_amount) || 0),
    0,
  );
  const averagePayment = displayHistory.length > 0 ? totalPaid / displayHistory.length : 0;

  if (loading) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text
          className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Loading customer details...
        </Text>
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center p-6">
            <Icon name="account-alert" size={64} color="#9ca3af" />
            <Text
              className={`text-xl font-semibold mt-4 text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Customer Not Found
            </Text>
            <Text
              className={`text-sm text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              The customer you're looking for doesn't exist or couldn't be
              loaded.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mt-6 bg-blue-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const dueAmount = parseFloat(customer.due_amount || 0);

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <SafeAreaView className="flex-1 pb-16" edges={["top", "left", "right"]}>
        {/* Header */}
        <View
          className={`px-4 py-3 flex-row items-center border-b ${
            isDarkMode ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <Icon
              name="arrow-left"
              size={24}
              color={isDarkMode ? "#FFFFFF" : "#1F2937"}
            />
          </TouchableOpacity>
          <Text
            className={`flex-1 text-center text-lg font-semibold ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Customer Profile
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleShare}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Icon
                name="share-variant"
                size={22}
                color={isDarkMode ? "#FFFFFF" : "#1F2937"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
              }`}
            >
              <Icon name="pencil" size={22} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4 "
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3b82f6"]}
            />
          }
        >
          {/* Customer Header with Gradient */}
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            className="rounded-2xl p-6 mt-4 mb-4"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{borderRadius:10}}
          >
            <View className="items-center">
              <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center mb-4">
                <Text className="text-white font-bold text-3xl">
                  {customer.name?.charAt(0) || "U"}
                </Text>
              </View>
              <Text className="text-white text-2xl font-bold mb-1 text-center">
                {customer.name}
              </Text>
              <Text className="text-white/80 text-sm mb-3">
                Customer ID: #{customer.id}
              </Text>

              <View className="flex-row mt-2 gap-2">
                <View
                  className={`px-4 py-2 rounded-xl ${
                    dueAmount > 0 ? "bg-yellow-500" : "bg-green-500"
                  }`}
                >
                  <Text className="text-white font-semibold">
                    Due: ₹{dueAmount.toFixed(2)}
                  </Text>
                </View>
                {dueAmount > 0 && (
                  <TouchableOpacity
                    onPress={handlePayment}
                    className="bg-white/20 px-4 py-2 rounded-xl"
                  >
                    <Text className="text-white font-semibold">Pay Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>

          {/* Statistics Cards */}
          <View className="flex-row flex-wrap mb-4 gap-2">
            <View
              className={`flex-1 rounded-xl p-3 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Total Purchases
              </Text>
              <Text className="text-lg font-bold text-blue-500">
                ₹{totalPurchases.toFixed(2)}
              </Text>
            </View>

            <View
              className={`flex-1 rounded-xl p-3 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Total Paid
              </Text>
              <Text className="text-lg font-bold text-green-500">
                ₹{totalPaid.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap mb-4 gap-2">
            <View
              className={`flex-1 rounded-xl p-3 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Avg Payment
              </Text>
              <Text className="text-lg font-bold text-purple-500">
                ₹{averagePayment.toFixed(2)}
              </Text>
            </View>

            <View
              className={`flex-1 rounded-xl p-3 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Transactions
              </Text>
              <Text className="text-lg font-bold text-orange-500">
                {displayHistory.length}
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View
            className={`flex-row rounded-2xl p-1 mb-4 shadow-sm ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {["details", "paymenthistory"].map((tab) => (
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
                      : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {tab === "details" ? "Details" : "Payment History"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "details" && (
            <>
              {/* Contact Information */}
              <View
                className={`rounded-2xl p-4 mb-4 shadow-sm ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <Text
                  className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Contact Information
                </Text>

                <View className="flex-row items-center mb-3">
                  <Icon name="phone" size={20} color="#3b82f6" />
                  <View className="ml-3">
                    <Text
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Phone
                    </Text>
                    <Text
                      className={`text-base font-medium ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {customer.phone || "N/A"}
                    </Text>
                  </View>
                </View>

                {customer.email && (
                  <View className="flex-row items-center mb-3">
                    <Icon name="email" size={20} color="#3b82f6" />
                    <View className="ml-3">
                      <Text
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Email
                      </Text>
                      <Text
                        className={`text-base font-medium ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {customer.email}
                      </Text>
                    </View>
                  </View>
                )}

                {(customer.address || customer.city) && (
                  <View className="flex-row items-center">
                    <Icon name="map-marker" size={20} color="#3b82f6" />
                    <View className="ml-3">
                      <Text
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Address
                      </Text>
                      <Text
                        className={`text-base font-medium ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {customer.address || "N/A"}
                        {customer.city && `, ${customer.city}`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Additional Information */}
              <View
                className={`rounded-2xl p-4 mb-4 shadow-sm ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <Text
                  className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Additional Information
                </Text>

                <View className="flex-row flex-wrap">
                  {customer.gst_number && (
                    <View className="w-1/2 mb-4">
                      <Text
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        GST Number
                      </Text>
                      <Text
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {customer.gst_number}
                      </Text>
                    </View>
                  )}

                  <View className="w-1/2 mb-4">
                    <Text
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Admin ID
                    </Text>
                    <Text
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      #{customer.admin_id || "N/A"}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Created By
                    </Text>
                    <Text
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      #{customer.created_by || "N/A"}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Customer Since
                    </Text>
                    <Text
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {formatDate(customer.created_at)}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Last Updated
                    </Text>
                    <Text
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {formatDate(customer.updated_at)}
                    </Text>
                  </View>

                  <View className="w-1/2 mb-4">
                    <Text
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Status
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <View
                        className={`w-2 h-2 rounded-full mr-2 ${
                          !customer.deleted_at ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <Text
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {!customer.deleted_at ? "Active" : "Deleted"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

          {activeTab === "paymenthistory" && (
            <View
              className={`rounded-2xl p-4 mb-4 shadow-sm ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Payment History
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-blue-500 px-3 py-2 rounded-xl flex-row items-center"
                >
                  <Icon name="calendar-filter" size={16} color="#ffffff" />
                  <Text className="text-white text-xs ml-1">Filter</Text>
                </TouchableOpacity>
              </View>

              {hasDateFilter && (startDate || endDate) && (
                <View className="flex-row justify-between items-center mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <Text
                    className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    📅 {startDate && format(startDate, "dd MMM yyyy")}
                    {startDate && endDate && " → "}
                    {endDate && format(endDate, "dd MMM yyyy")}
                  </Text>
                  <TouchableOpacity onPress={clearDateFilters}>
                    <Icon name="close-circle" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}

              {displayHistory && displayHistory.length > 0 ? (
                displayHistory.map((payment, index) => (
                  <View
                    key={payment.id || index}
                    className={`py-4 ${
                      index < displayHistory.length - 1 ? "border-b" : ""
                    } ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <View
                            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                              parseFloat(payment.paid_amount || 0) > 0
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-blue-100 dark:bg-blue-900/30"
                            }`}
                          >
                            <Icon
                              name={
                                parseFloat(payment.paid_amount || 0) > 0
                                  ? "cash-check"
                                  : "cart"
                              }
                              size={18}
                              color={
                                parseFloat(payment.paid_amount || 0) > 0
                                  ? "#10b981"
                                  : "#3b82f6"
                              }
                            />
                          </View>
                          <View>
                            <Text
                              className={`font-semibold ${
                                isDarkMode ? "text-white" : "text-gray-800"
                              }`}
                            >
                              {payment.invoice_id
                                ? `Invoice #${payment.invoice_id}`
                                : "Payment Transaction"}
                            </Text>
                            <Text
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              📅 {formatDateTime(payment.created_at)}
                            </Text>
                          </View>
                        </View>

                        {payment.payment_method && (
                          <View className="flex-row items-center mt-2 ml-13">
                            <Icon
                              name="credit-card"
                              size={12}
                              color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                            />
                            <Text
                              className={`text-xs ml-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              Method: {payment.payment_method}
                            </Text>
                          </View>
                        )}

                        {payment.remarks && (
                          <Text
                            className={`text-xs mt-1 ml-13 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            💬 {payment.remarks}
                          </Text>
                        )}
                      </View>
                      <View className="items-end">
                        {payment.total_amount && (
                          <Text className="text-xs text-gray-500">
                            Total: ₹
                            {parseFloat(payment.total_amount).toFixed(2)}
                          </Text>
                        )}
                        {payment.paid_amount && (
                          <Text className="text-sm font-bold text-green-500">
                            Paid: ₹{parseFloat(payment.paid_amount).toFixed(2)}
                          </Text>
                        )}
                        {payment.due_amount !== undefined &&
                          parseFloat(payment.due_amount) > 0 && (
                            <Text className="text-xs font-medium mt-1 text-yellow-500">
                              Due: ₹{parseFloat(payment.due_amount).toFixed(2)}
                            </Text>
                          )}
                        {payment.due_amount !== undefined &&
                          parseFloat(payment.due_amount) === 0 &&
                          parseFloat(payment.paid_amount) > 0 && (
                            <Text className="text-xs font-medium mt-1 text-green-500">
                              ✓ Settled
                            </Text>
                          )}
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center justify-center py-12">
                  <Icon name="history" size={64} color="#9ca3af" />
                  <Text
                    className={`text-center mt-3 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No payment history found
                  </Text>
                  {hasDateFilter && (
                    <TouchableOpacity
                      onPress={clearDateFilters}
                      className="mt-4"
                    >
                      <Text className="text-blue-500 font-medium">
                        Clear filters
                      </Text>
                    </TouchableOpacity>
                  )}
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
      <PaymentModal
        visible={showPaymentModal}
        customer={customer}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handlePaymentSubmit}
        loading={paymentProcessing}
        isDarkMode={isDarkMode}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={deleting}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />

      {/* Date Filter Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-center">
          <View
            className={`mx-4 rounded-2xl p-5 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Text
              className={`text-xl font-semibold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Filter by Date Range
            </Text>

            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              className={`mb-4 p-4 rounded-xl border ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <Text
                className={`text-xs mb-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Start Date
              </Text>
              <Text
                className={`text-base ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {startDate ? format(startDate, "PPP") : "📅 Select start date"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              className={`mb-6 p-4 rounded-xl border ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <Text
                className={`text-xs mb-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                End Date
              </Text>
              <Text
                className={`text-base ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {endDate ? format(endDate, "PPP") : "📅 Select end date"}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
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
                value={endDate || new Date()}
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
                    ? "border-gray-700 bg-gray-700"
                    : "border-gray-200 bg-gray-100"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={filterPaymentHistory}
                className="flex-1 bg-blue-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomerDetailScreen;