// screens/invoices/InvoiceDetailScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/common/Header";
import { ConfirmationModal, SuccessModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useInvoiceStore from "../../store/invoiceStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import Toast from "react-native-toast-message";
import { TextInput } from "react-native";

const InvoiceDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();
  const { getInvoiceById, cancelInvoice, payInvoiceDue } = useInvoiceStore();

  const { invoiceId } = route.params || {};

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchVersion, setRefetchVersion] = useState(0);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [duePayAmount, setDuePayAmount] = useState("");
  const [duePayMethod, setDuePayMethod] = useState("Cash");
  const [paymentError, setPaymentError] = useState("");
  
  // Cancel modal state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellingInvoice, setCancellingInvoice] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // Get filtered menu items
  const menuItems = getFilteredMenuItems().map(item => ({
    id: item.id,
    title: item.name,
    screen: item.screen,
    icon: item.icon,
    iconActive: item.iconActive,
    badge: item.badge || null,
  }));

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getInvoiceById(invoiceId);
        
        if (isMountedRef.current) {
          setInvoice(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error("Failed to fetch invoice:", err);
          setError("Failed to load invoice details");
          setLoading(false);
        }
      }
    };

    fetchInvoice();
  }, [invoiceId, refetchVersion, getInvoiceById]);

  const getStatusConfig = (status) => {
    const configs = {
      paid: { color: "#10b981", icon: "check-circle", label: "Paid" },
      unpaid: { color: "#f59e0b", icon: "clock", label: "Unpaid" },
      overdue: { color: "#ef4444", icon: "alert-circle", label: "Overdue" },
      completed: { color: "#10b981", icon: "check-circle", label: "Completed" },
      cancelled: { color: "#6b7280", icon: "file-document", label: "Cancelled" },
    };
    return configs[status] || configs.unpaid;
  };

  const handleEditInvoice = () => {
    if (invoice && invoice.status !== "cancelled") {
      navigation.navigate("InvoiceForm", { invoiceId: invoice.id, isEdit: true });
    }
  };

  const handleCancelInvoice = () => {
    if (invoice && invoice.status !== "cancelled") {
      setShowCancelConfirm(true);
    }
  };

  const confirmCancelInvoice = async () => {
    if (!invoice?.id) return;
    setCancellingInvoice(true);
    try {
      const result = await cancelInvoice(invoice.id);
      if (result.success) {
        setShowCancelConfirm(false);
        setSuccessMessage("Invoice cancelled successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        setRefetchVersion((v) => v + 1);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error?.message || 'Failed to cancel invoice',
        });
      }
    } catch (error) {
      console.error("Failed to cancel invoice:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel invoice',
      });
    } finally {
      setCancellingInvoice(false);
    }
  };

  const handlePaymentClick = () => {
    if (!invoice || invoice.status === "cancelled") return;
    
    const total = parseFloat(invoice.bill_summary?.grand_total || invoice.total_amount || 0);
    const paid = parseFloat(invoice.paid_amount || 0);
    const due = Math.max(0, total - paid);
    
    if (due <= 0.001) return;
    
    setDuePayAmount("");
    setDuePayMethod("Cash");
    setPaymentError("");
    setShowPaymentModal(true);
    setIsPaymentProcessing(false);
  };

  const handlePaymentAmountChange = (value) => {
    let cleanedValue = value.replace(/[^0-9.]/g, "");
    const decimalCount = (cleanedValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      cleanedValue = cleanedValue.slice(0, cleanedValue.lastIndexOf("."));
    }

    // Limit decimal places to 2
    if (cleanedValue.includes(".") && cleanedValue.split(".")[1]?.length > 2) {
      return;
    }

    setDuePayAmount(cleanedValue);
    setPaymentError("");

    // Real-time validation
    if (cleanedValue && cleanedValue !== ".") {
      const total = parseFloat(invoice.bill_summary?.grand_total || invoice.total_amount || 0);
      const paid = parseFloat(invoice.paid_amount || 0);
      const due = Math.max(0, total - paid);
      const amount = parseFloat(cleanedValue);
      
      if (amount > due) {
        setPaymentError(`Amount cannot exceed due (₹${due.toFixed(2)})`);
      }
    }
  };

  const handlePaymentSubmit = async () => {
    if (!invoice?.id || invoice.status === "cancelled") return;

    const total = parseFloat(invoice.bill_summary?.grand_total || invoice.total_amount || 0);
    const paid = parseFloat(invoice.paid_amount || 0);
    const due = Math.max(0, total - paid);
    const amount = parseFloat(duePayAmount);

    if (Number.isNaN(amount) || amount <= 0) {
      setPaymentError("Enter a valid payment amount");
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Enter a valid payment amount',
      });
      return;
    }

    if (amount > due) {
      setPaymentError(`Amount cannot exceed due (₹${due.toFixed(2)})`);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Amount cannot exceed due (₹${due.toFixed(2)})`,
      });
      return;
    }

    setIsPaymentProcessing(true);
    try {
      const result = await payInvoiceDue(invoice.id, {
        paid_amount: amount,
        payment_method: duePayMethod,
      });

      if (result.success) {
        setShowPaymentModal(false);
        setDuePayAmount("");
        setDuePayMethod("Cash");
        setPaymentError("");
        setSuccessMessage(`Payment of ₹${amount.toFixed(2)} recorded successfully`);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        setRefetchVersion((v) => v + 1);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error?.message || 'Payment failed',
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Payment failed',
      });
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading invoice details...</Text>
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />
        <Header
          title="Invoice Details"
          userName={user?.name || "User"}
          userEmail={user?.email || "guest@example.com"}
          activeScreen="Invoices"
          navigationItems={menuItems}
          showBackButton={true}
        />
        <View className="flex-1 items-center justify-center px-4">
          <Icon name="file-document" size={80} color={isDarkMode ? "#334155" : "#D1D5DB"} />
          <Text className={`text-lg mt-4 text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            {error || "Invoice not found"}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-4 px-6 py-3 bg-blue-500 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);
  const totalAmount = parseFloat(invoice.bill_summary?.grand_total || invoice.total_amount || 0);
  const paidAmount = parseFloat(invoice.paid_amount || 0);
  const dueBalance = Math.max(0, totalAmount - paidAmount);
  const showDuePayment = invoice.status !== "cancelled" && dueBalance > 0.001;

  const invoiceItems = invoice.invoice_items || invoice.items || [];
  const packages = invoice.packages || [];

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />

      <Header
        title="Invoice Details"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Invoices"
        navigationItems={menuItems}
        showBackButton={true}
        rightComponent={
          <View className="flex-row items-center">
            {invoice.status !== "cancelled" && (
              <>
                <TouchableOpacity
                  onPress={handleEditInvoice}
                  className="w-10 h-10 rounded-full items-center justify-center mr-2 bg-indigo-500"
                >
                  <Icon name="pencil" size={20} color="#ffffff" />
                </TouchableOpacity>
                {showDuePayment && (
                  <TouchableOpacity
                    onPress={handlePaymentClick}
                    className="w-10 h-10 rounded-full items-center justify-center mr-2 bg-green-500"
                  >
                    <Icon name="cash" size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleCancelInvoice}
                  className="w-10 h-10 rounded-full items-center justify-center bg-red-500"
                >
                  <Icon name="cancel" size={20} color="#ffffff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Invoice Header */}
        <View className={`p-4 mx-4 mt-4 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                #{invoice.invoice_number || invoice.id}
              </Text>
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {formatDate(invoice.created_at)}
              </Text>
            </View>
            <View className="flex-row items-center px-3 py-1 rounded-full" style={{ backgroundColor: `${statusConfig.color}20` }}>
              <Icon name={statusConfig.icon} size={16} color={statusConfig.color} />
              <Text className="ml-1 text-sm font-medium" style={{ color: statusConfig.color }}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Customer Info */}
          <View className={`p-3 rounded-lg mb-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <Text className={`text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              CUSTOMER
            </Text>
            <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {invoice.customer_name || "Walk-in Customer"}
            </Text>
            {invoice.customer_phone && (
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {invoice.customer_phone}
              </Text>
            )}
            {invoice.customer_address && (
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {invoice.customer_address}
              </Text>
            )}
          </View>

          {/* Store Info */}
          <View className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <Text className={`text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              STORE
            </Text>
            <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {invoice.store_name || "Unknown Store"}
            </Text>
            {invoice.store_address && (
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {invoice.store_address}
              </Text>
            )}
          </View>
        </View>

        {/* Invoice Items */}
        <View className={`p-4 mx-4 mt-4 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-lg font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            Items ({invoiceItems.length + packages.length})
          </Text>

          {invoiceItems.map((item, index) => (
            <View key={`item-${index}`} className={`flex-row justify-between items-center py-3 ${index < invoiceItems.length - 1 ? "border-b" : ""} ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <View className="flex-1">
                <Text className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  {item.product_name || item.name || `Product #${item.product_id}`}
                </Text>
                <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Qty: {item.quantity || item.item_count || 1} × ₹{parseFloat(item.price || 0).toFixed(2)}
                </Text>
              </View>
              <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                ₹{parseFloat(item.total_price || item.total || 0).toFixed(2)}
              </Text>
            </View>
          ))}

          {packages.map((pkg, index) => (
            <View key={`pkg-${index}`} className={`flex-row justify-between items-center py-3 ${index < packages.length - 1 ? "border-b" : ""} ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <View className="flex-1">
                <Text className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  {pkg.package_name || `Package #${pkg.package_id}`}
                </Text>
                <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Qty: {pkg.quantity || 1} × ₹{parseFloat(pkg.package_price || 0).toFixed(2)}
                </Text>
              </View>
              <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                ₹{parseFloat(pkg.package_total || pkg.total_price || 0).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Bill Summary */}
        <View className={`p-4 mx-4 mt-4 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-lg font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            Payment Summary
          </Text>

          <View className="flex-row justify-between py-2">
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Subtotal</Text>
            <Text className={`text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {formatCurrency(invoice.bill_summary?.subtotal || totalAmount)}
            </Text>
          </View>

          {invoice.bill_summary?.total_discount > 0 && (
            <View className="flex-row justify-between py-2">
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Discount</Text>
              <Text className={`text-sm text-green-600`}>
                -{formatCurrency(invoice.bill_summary.total_discount)}
              </Text>
            </View>
          )}

          {invoice.bill_summary?.total_gst > 0 && (
            <View className="flex-row justify-between py-2">
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>GST</Text>
              <Text className={`text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {formatCurrency(invoice.bill_summary.total_gst)}
              </Text>
            </View>
          )}

          <View className={`flex-row justify-between py-3 mt-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <Text className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Grand Total</Text>
            <Text className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Paid Amount</Text>
            <Text className={`text-sm text-green-600 font-medium`}>
              {formatCurrency(paidAmount)}
            </Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Due Amount</Text>
            <Text className={`text-sm font-bold ${dueBalance > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(dueBalance)}
            </Text>
          </View>

          {showDuePayment && (
            <TouchableOpacity
              onPress={handlePaymentClick}
              className="mt-4 py-3 bg-green-500 rounded-lg"
            >
              <Text className="text-white font-semibold text-center">Pay Due Amount</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment History */}
        {invoice.bill_payment_history && Array.isArray(invoice.bill_payment_history) && invoice.bill_payment_history.length > 0 && (
          <View className={`p-4 mx-4 mt-4 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-lg font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              Payment History
            </Text>

            {invoice.bill_payment_history.map((payment, index) => (
              <View key={`payment-${index}`} className={`flex-row justify-between items-center py-3 ${index < invoice.bill_payment_history.length - 1 ? "border-b" : ""} ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                <View>
                  <Text className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    {payment.payment_method || "Cash"}
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {payment.created_at ? formatDate(payment.created_at) : "-"}
                  </Text>
                </View>
                <Text className={`text-sm font-semibold text-green-600`}>
                  {formatCurrency(payment.paid_amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className={`w-full max-w-md rounded-2xl p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                Record Payment
              </Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Icon name="close" size={24} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
              </TouchableOpacity>
            </View>

            <View className={`mb-4 p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Invoice: #{invoice.invoice_number || invoice.id}
              </Text>
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {invoice.customer_name}
              </Text>
              <View className="flex-row justify-between mt-2">
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Total: {formatCurrency(totalAmount)}
                </Text>
                <Text className={`text-sm text-red-600`}>
                  Due: {formatCurrency(dueBalance)}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Payment Amount
              </Text>
              <View className={`flex-row items-center rounded-lg px-4 h-12 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <Text className={`text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹</Text>
                <TextInput
                  className={`flex-1 ml-2 text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  value={duePayAmount}
                  onChangeText={handlePaymentAmountChange}
                  keyboardType="decimal-pad"
                />
              </View>
              {paymentError ? (
                <Text className="text-red-500 text-xs mt-1">{paymentError}</Text>
              ) : null}
            </View>

            <View className="mb-6">
              <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Payment Method
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {["Cash", "Card", "UPI", "Bank Transfer", "Cheque"].map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setDuePayMethod(method)}
                    className={`px-4 py-2 rounded-lg border ${
                      duePayMethod === method
                        ? "border-blue-500 bg-blue-50"
                        : isDarkMode
                        ? "border-gray-600 bg-gray-700"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        duePayMethod === method
                          ? "text-blue-600 font-medium"
                          : isDarkMode
                          ? "text-gray-300"
                          : "text-gray-600"
                      }`}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handlePaymentSubmit}
              disabled={isPaymentProcessing || !duePayAmount}
              className={`w-full py-3 rounded-lg ${
                isPaymentProcessing || !duePayAmount
                  ? "bg-gray-300"
                  : "bg-blue-500"
              }`}
            >
              <Text className="text-white font-semibold text-center">
                {isPaymentProcessing ? "Processing..." : "Record Payment"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        visible={showCancelConfirm}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel invoice "${invoice.invoice_number || invoice.id}"? This will restore stock and reverse customer due amount.`}
        onConfirm={confirmCancelInvoice}
        onCancel={() => setShowCancelConfirm(false)}
        confirmText="Cancel Invoice"
        cancelText="Back"
        confirmButtonColor="#ef4444"
        loading={cancellingInvoice}
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

export default InvoiceDetailScreen;
