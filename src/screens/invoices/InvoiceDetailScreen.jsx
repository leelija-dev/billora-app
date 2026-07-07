// screens/invoices/InvoiceDetailScreen.js - FIXED PAYMENT MODAL
import { useNavigation, useRoute } from "@react-navigation/native";
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
  Image,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../../components/common/Header";
import { ConfirmationModal, SuccessModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useInvoiceStore from "../../store/invoiceStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

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

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

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

    if (cleanedValue.includes(".") && cleanedValue.split(".")[1]?.length > 2) {
      return;
    }

    setDuePayAmount(cleanedValue);
    setPaymentError("");

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

  // ✅ FIXED: handlePaymentSubmit - properly closes modal and shows success
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
    setPaymentError("");

    try {
      const result = await payInvoiceDue(invoice.id, {
        paid_amount: amount,
        payment_method: duePayMethod,
      });

      console.log("📝 Payment result:", result);

      if (result && result.success) {
        // ✅ Close payment modal immediately
        setShowPaymentModal(false);
        setDuePayAmount("");
        setDuePayMethod("Cash");
        setPaymentError("");
        
        // ✅ Show success message
        const msg = `Payment of ₹${amount.toFixed(2)} recorded successfully`;
        setSuccessMessage(msg);
        setShowSuccessModal(true);
        
        // Auto close success modal after 2 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
        
        // ✅ Refresh invoice data
        setRefetchVersion((v) => v + 1);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: msg,
        });
      } else {
        // Payment failed
        const errorMsg = result?.error || 'Payment failed';
        setPaymentError(errorMsg);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMsg,
        });
      }
    } catch (error) {
      console.error("❌ Payment error:", error);
      const errorMsg = error?.message || error?.response?.data?.message || 'Payment failed';
      setPaymentError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handlePrintClick = () => {
    setShowPrintModal(true);
  };

  const handlePrintA4 = () => {
    // TODO: Implement A4 printing
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: 'A4 print functionality coming soon',
    });
    setShowPrintModal(false);
  };

  const handlePrintThermal = () => {
    // TODO: Implement Thermal printing
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: 'Thermal print functionality coming soon',
    });
    setShowPrintModal(false);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStatusBadge = (status) => {
    const config = getStatusConfig(status);
    return (
      <View className={`flex-row items-center px-3 py-1 rounded-full`} style={{ backgroundColor: `${config.color}20` }}>
        <Icon name={config.icon} size={16} color={config.color} />
        <Text className="ml-1 text-xs font-medium" style={{ color: config.color }}>
          {config.label}
        </Text>
      </View>
    );
  };

  const renderStoreInfo = () => {
    const store = invoice.store || {};
    return (
      <View className={`p-4 rounded-xl ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
        <Text className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          STORE INFORMATION
        </Text>
        
        {/* Store Logo */}
        {store.logo && (
          <View className="mb-3">
            <Image
              source={{ uri: store.logo }}
              className="w-16 h-16 rounded-xl"
              resizeMode="cover"
            />
          </View>
        )}
        
        <Text className={`font-semibold text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}>
          {store.name || invoice.store_name || "Unknown Store"}
        </Text>
        
        {store.gst && (
          <Text className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            GST: {store.gst}
          </Text>
        )}
        
        {store.email && (
          <View className="flex-row items-center mt-1">
            <Icon name="email" size={14} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`text-sm ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {store.email}
            </Text>
          </View>
        )}
        
        {store.mobile && (
          <View className="flex-row items-center mt-1">
            <Icon name="phone" size={14} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`text-sm ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {store.mobile}
            </Text>
          </View>
        )}
        
        {(store.address || store.city || store.state) && (
          <View className="flex-row items-start mt-1">
            <Icon name="map-marker" size={14} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`text-sm ml-2 flex-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {[store.address, store.city, store.state, store.pincode].filter(Boolean).join(", ")}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCustomerInfo = () => {
    const customer = invoice.customer || {};
    return (
      <View className={`p-4 rounded-xl ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
        <Text className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          CUSTOMER INFORMATION
        </Text>
        
        <Text className={`font-semibold text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}>
          {customer.name || invoice.customer_name || "Walk-in Customer"}
        </Text>
        
        {customer.gst_number && (
          <Text className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            GST: {customer.gst_number}
          </Text>
        )}
        
        {customer.email && (
          <View className="flex-row items-center mt-1">
            <Icon name="email" size={14} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`text-sm ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {customer.email}
            </Text>
          </View>
        )}
        
        {customer.phone && (
          <View className="flex-row items-center mt-1">
            <Icon name="phone" size={14} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`text-sm ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {customer.phone}
            </Text>
          </View>
        )}
        
        {(customer.address || customer.city) && (
          <View className="flex-row items-start mt-1">
            <Icon name="map-marker" size={14} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`text-sm ml-2 flex-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {[customer.address, customer.city].filter(Boolean).join(", ")}
            </Text>
          </View>
        )}
      </View>
    );
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
          showBack={true}
          onBack={() => navigation.goBack()}
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
  const isCancelled = invoice.status === "cancelled";

  const invoiceItems = invoice.invoice_items || invoice.items || [];
  const packages = invoice.packages || [];
  const paymentHistory = invoice.bill_payment_history ? [invoice.bill_payment_history] : [];

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />

      <Header
        title="Invoice Details"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightComponent={
          <View className="flex-row items-center">
            {!isCancelled && (
              <>
                <TouchableOpacity
                  onPress={handlePrintClick}
                  className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                >
                  <Icon name="printer" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEditInvoice}
                  className="w-10 h-10 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: "#6366f1" }}
                >
                  <Icon name="pencil" size={20} color="#ffffff" />
                </TouchableOpacity>
                {showDuePayment && (
                  <TouchableOpacity
                    onPress={handlePaymentClick}
                    className="w-10 h-10 rounded-full items-center justify-center mr-2"
                    style={{ backgroundColor: "#10b981" }}
                  >
                    <Icon name="cash" size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleCancelInvoice}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#ef4444" }}
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
        {/* Invoice Header Card */}
        <View className={`mx-4 mt-4 rounded-2xl p-4 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                #{invoice.invoice_number || invoice.id}
              </Text>
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {formatDate(invoice.created_at)}
              </Text>
            </View>
            {renderStatusBadge(invoice.status)}
          </View>

          {/* Payment Progress */}
          {!isCancelled && totalAmount > 0 && (
            <View className="mt-2">
              <View className="flex-row justify-between mb-1">
                <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Paid: {formatCurrency(paidAmount)}
                </Text>
                <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Due: {formatCurrency(dueBalance)}
                </Text>
              </View>
              <View className={`h-1.5 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                <View
                  className="h-1.5 rounded-full bg-green-500"
                  style={{ width: `${Math.min((paidAmount / totalAmount) * 100, 100)}%` }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Customer & Store Info */}
        <View className="mx-4 mt-4">
          <View className="flex-row flex-wrap -mx-1">
            <View className="w-1/2 px-1">
              {renderCustomerInfo()}
            </View>
            <View className="w-1/2 px-1">
              {renderStoreInfo()}
            </View>
          </View>
        </View>

        {/* Invoice Items */}
        <View className={`mx-4 mt-4 rounded-2xl p-4 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-lg font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            Items ({invoiceItems.length + (packages?.length || 0)})
          </Text>

          {/* Items Header */}
          <View className={`flex-row pb-2 mb-2 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <Text className={`flex-1 text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Product</Text>
            <Text className={`w-16 text-right text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Qty</Text>
            <Text className={`w-20 text-right text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Price</Text>
            <Text className={`w-20 text-right text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total</Text>
          </View>

          {invoiceItems.map((item, index) => {
            const itemTotal = parseFloat(item.total_price || item.total || 0);
            const itemQuantity = parseFloat(item.quantity || item.item_count || 1);
            const itemPrice = parseFloat(item.price || 0);
            const product = item.product || {};
            const productName = product.name || item.product_name || item.name || `Product #${item.product_id}`;
            const imageUrl = product.image || null;
            const variants = product.variants || [];
            const attributes = product.attributes || [];
            
            return (
              <View key={`item-${index}`} className={`py-3 ${index < invoiceItems.length - 1 ? "border-b" : ""} ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                <View className="flex-row items-center">
                  {/* Product Image */}
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} className="w-12 h-12 rounded-lg mr-3" resizeMode="cover" />
                  ) : (
                    <View className={`w-12 h-12 rounded-lg items-center justify-center mr-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                      <Icon name="package-variant" size={24} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                    </View>
                  )}
                  
                  <View className="flex-1">
                    <Text className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                      {productName}
                    </Text>
                    
                    {/* Variants */}
                    {variants && variants.length > 0 && (
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {variants.map((variant, vIdx) => {
                          const variantValues = [];
                          if (variant.size) variantValues.push(variant.size);
                          if (variant.color) variantValues.push(variant.color);
                          if (variant.material) variantValues.push(variant.material);
                          if (variant.gender) variantValues.push(variant.gender);
                          
                          return variantValues.map((val, valIdx) => (
                            <View key={`variant-${vIdx}-${valIdx}`} className={`px-2 py-0.5 rounded-md ${isDarkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
                              <Text className={`text-xs ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}>
                                {val}
                              </Text>
                            </View>
                          ));
                        })}
                      </View>
                    )}
                    
                    {/* Attributes */}
                    {attributes && attributes.length > 0 && (
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {attributes.map((attr, aIdx) => {
                          if (typeof attr === 'object') {
                            return Object.entries(attr).map(([key, value], entryIdx) => (
                              <View key={`attr-${aIdx}-${entryIdx}`} className={`px-2 py-0.5 rounded-md ${isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
                                <Text className={`text-xs ${isDarkMode ? "text-yellow-400" : "text-yellow-700"}`}>
                                  {value}
                                </Text>
                              </View>
                            ));
                          }
                          return (
                            <View key={`attr-${aIdx}`} className={`px-2 py-0.5 rounded-md ${isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
                              <Text className={`text-xs ${isDarkMode ? "text-yellow-400" : "text-yellow-700"}`}>
                                {attr}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                  
                  <Text className={`w-16 text-right text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    {itemQuantity}
                  </Text>
                  <Text className={`w-20 text-right text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    ₹{itemPrice.toFixed(2)}
                  </Text>
                  <Text className={`w-20 text-right text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    ₹{itemTotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}

          {packages && packages.length > 0 && packages.map((pkg, index) => {
            const pkgTotal = parseFloat(pkg.package_total || pkg.total_price || 0);
            const pkgPrice = parseFloat(pkg.package_price || 0);
            const pkgQuantity = parseFloat(pkg.quantity || 1);
            
            return (
              <View key={`pkg-${index}`} className={`py-3 ${index < packages.length - 1 ? "border-b" : ""} ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-lg items-center justify-center mr-3 ${isDarkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
                    <Icon name="archive" size={24} color={isDarkMode ? "#A78BFA" : "#7C3AED"} />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                      {pkg.package_name || `Package #${pkg.package_id}`}
                    </Text>
                    {pkg.package_size && (
                      <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Size: {pkg.package_size}
                      </Text>
                    )}
                  </View>
                  <Text className={`w-16 text-right text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    {pkgQuantity}
                  </Text>
                  <Text className={`w-20 text-right text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    ₹{pkgPrice.toFixed(2)}
                  </Text>
                  <Text className={`w-20 text-right text-sm font-semibold text-purple-600 dark:text-purple-400`}>
                    ₹{pkgTotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}

          {invoiceItems.length === 0 && (!packages || packages.length === 0) && (
            <View className="py-8 items-center">
              <Icon name="package-variant" size={40} color={isDarkMode ? "#4B5563" : "#D1D5DB"} />
              <Text className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                No items found
              </Text>
            </View>
          )}
        </View>

        {/* Payment Summary */}
        <View className={`mx-4 mt-4 rounded-2xl p-4 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
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
            <Text className={`text-base font-bold text-blue-600 dark:text-blue-400`}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Paid Amount</Text>
            <Text className={`text-sm font-medium text-green-600`}>
              {formatCurrency(paidAmount)}
            </Text>
          </View>

          <View className={`flex-row justify-between py-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} pt-2`}>
            <Text className={`text-sm font-bold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Due Amount</Text>
            <Text className={`text-sm font-bold ${dueBalance > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(dueBalance)}
            </Text>
          </View>

          {showDuePayment && (
            <TouchableOpacity
              onPress={handlePaymentClick}
              className="mt-4 py-3 bg-green-500 rounded-xl"
            >
              <Text className="text-white font-semibold text-center">Pay Due Amount</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment History */}
        {paymentHistory && paymentHistory.length > 0 && (
          <View className={`mx-4 mt-4 rounded-2xl p-4 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-lg font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              Payment History
            </Text>

            {paymentHistory.map((payment, index) => (
              <View key={`payment-${index}`} className={`flex-row justify-between items-center py-3 ${index < paymentHistory.length - 1 ? "border-b" : ""} ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                <View>
                  <Text className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    {payment.payment_method || "Cash"}
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {payment.created_at ? formatDate(payment.created_at) : "-"}
                  </Text>
                  {payment.remarks && (
                    <Text className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {payment.remarks}
                    </Text>
                  )}
                </View>
                <Text className={`text-sm font-semibold text-green-600`}>
                  {formatCurrency(payment.paid_amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ✅ Payment Modal - FIXED */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPaymentModal(false);
          setPaymentError("");
          setDuePayAmount("");
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className={`w-full max-w-md rounded-2xl p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                Record Payment
              </Text>
              <TouchableOpacity onPress={() => {
                setShowPaymentModal(false);
                setPaymentError("");
                setDuePayAmount("");
              }}>
                <Icon name="close" size={24} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
              </TouchableOpacity>
            </View>

            <View className={`mb-4 p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Invoice: #{invoice.invoice_number || invoice.id}
              </Text>
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {invoice.customer?.name || invoice.customer_name}
              </Text>
              <View className="flex-row justify-between mt-2">
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Total: {formatCurrency(totalAmount)}
                </Text>
                <Text className={`text-sm font-bold ${dueBalance > 0 ? "text-red-600" : "text-green-600"}`}>
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
              <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Max payable: {formatCurrency(dueBalance)}
              </Text>
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

            {/* ✅ FIXED: Use handlePaymentSubmit directly */}
            <TouchableOpacity
              onPress={handlePaymentSubmit}
              disabled={isPaymentProcessing || !duePayAmount || !!paymentError}
              className={`w-full py-3 rounded-lg ${
                isPaymentProcessing || !duePayAmount || !!paymentError
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

      {/* Print Modal */}
      <Modal
        visible={showPrintModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrintModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className={`rounded-t-3xl p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="items-center mb-4">
              <View className={`w-12 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`} />
            </View>

            <Text className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Print Options
            </Text>
            <Text className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Invoice #{invoice.invoice_number || invoice.id}
            </Text>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={handlePrintA4}
                className={`py-3 px-4 rounded-xl flex-row items-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <Icon name="file-document" size={24} color="#3B82F6" />
                <View className="ml-3">
                  <Text className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    Print A4 Invoice
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Standard A4 paper format
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePrintThermal}
                className={`py-3 px-4 rounded-xl flex-row items-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <Icon name="printer" size={24} color="#10B981" />
                <View className="ml-3">
                  <Text className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    Print Thermal Receipt
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    80mm thermal printer format
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowPrintModal(false)}
                className={`mt-2 py-3 px-4 rounded-xl border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
              >
                <Text className={`text-center font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
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