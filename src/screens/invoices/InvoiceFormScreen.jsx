// screens/invoices/InvoiceFormScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/common/Header";
import { ConfirmationModal, SuccessModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useInvoiceStore from "../../store/invoiceStore";
import useCustomerStore from "../../store/customerStore";
import useStoreStore from "../../store/storeStore";
import useProductStore from "../../store/productStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import Toast from "react-native-toast-message";

const InvoiceFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();
  
  const { createInvoice, updateInvoice, fetchBillGenerateData } = useInvoiceStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { stores, fetchStores } = useStoreStore();
  const { products, fetchProducts } = useProductStore();

  const { invoiceId, isEdit } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Form data
  const [formData, setFormData] = useState({
    customer_id: "",
    store_id: "",
    payment_method: "Cash",
    payment_status: "paid",
    payment_amount: "",
  });
  
  // Line items
  const [lineItems, setLineItems] = useState([]);
  
  // UI states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get filtered menu items
  const menuItems = getFilteredMenuItems().map(item => ({
    id: item.id,
    title: item.name,
    screen: item.screen,
    icon: item.icon,
    iconActive: item.iconActive,
    badge: item.badge || null,
  }));

  // Get current user ID
  const getUserId = useCallback(() => {
    if (user && user.id) return user.id.toString();
    return "1";
  }, [user]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        const userId = getUserId();
        
        // Fetch customers, stores, and products in parallel
        await Promise.all([
          fetchCustomers(userId, ""),
          fetchStores(userId, ""),
          fetchProducts(userId, 1, ""),
        ]);

        // If editing, load invoice data
        if (isEdit && invoiceId) {
          // TODO: Load existing invoice data
          // For now, we'll start with empty form
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load required data',
        });
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [getUserId, fetchCustomers, fetchStores, fetchProducts, isEdit, invoiceId]);

  const calculateItemTotal = (price, quantity, gst, discount) => {
    const basePrice = price * quantity;
    const discountAmount = basePrice * (discount / 100);
    const gstAmount = (basePrice - discountAmount) * (gst / 100);
    return basePrice - discountAmount + gstAmount;
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = lineItems.reduce((sum, item) => {
      const basePrice = item.price * item.quantity;
      return sum + basePrice * (item.discount / 100);
    }, 0);
    const totalGst = lineItems.reduce((sum, item) => {
      const basePrice = item.price * item.quantity;
      const discountedPrice = basePrice - basePrice * (item.discount / 100);
      return sum + discountedPrice * (item.gst / 100);
    }, 0);
    const totalAmount = subtotal - totalDiscount + totalGst;

    return { subtotal, totalDiscount, totalGst, totalAmount };
  };

  const totals = calculateTotals();

  const handleAddProduct = () => {
    if (!selectedProduct) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a product',
      });
      return;
    }

    const newItem = {
      id: Date.now(), // Temporary ID
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: productQuantity,
      price: parseFloat(selectedProduct.selling_price || 0),
      gst: parseFloat(selectedProduct.gst_percentage || 0),
      discount: parseFloat(selectedProduct.discount_percentage || 0),
      total_price: calculateItemTotal(
        parseFloat(selectedProduct.selling_price || 0),
        productQuantity,
        parseFloat(selectedProduct.gst_percentage || 0),
        parseFloat(selectedProduct.discount_percentage || 0),
      ),
    };

    setLineItems([...lineItems, newItem]);
    setSelectedProduct(null);
    setProductQuantity(1);
    setShowProductModal(false);
    
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: `${selectedProduct.name} added to invoice`,
    });
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...lineItems];
    const item = { ...updatedItems[index] };

    if (field === "quantity") {
      item.quantity = parseFloat(value) || 1;
    } else if (field === "price" || field === "gst" || field === "discount") {
      item[field] = parseFloat(value) || 0;
    }

    item.total_price = calculateItemTotal(item.price, item.quantity, item.gst, item.discount);
    updatedItems[index] = item;
    setLineItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCustomerSelect = (customer) => {
    setFormData({ ...formData, customer_id: customer.id.toString() });
    setShowCustomerModal(false);
  };

  const handleStoreSelect = (store) => {
    setFormData({ ...formData, store_id: store.id.toString() });
    setShowStoreModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.customer_id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a customer',
      });
      return;
    }

    if (!formData.store_id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a store',
      });
      return;
    }

    if (lineItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please add at least one item',
      });
      return;
    }

    let paidAmount = 0;
    if (formData.payment_status === "paid") {
      paidAmount = totals.totalAmount;
    } else if (formData.payment_status === "semi_paid") {
      paidAmount = parseFloat(formData.payment_amount) || 0;
    }

    const payload = {
      user_id: parseInt(getUserId()),
      customer_id: parseInt(formData.customer_id),
      store_id: parseInt(formData.store_id),
      paid_amount: paidAmount,
      payment_method: formData.payment_method,
      items: lineItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        gst: item.gst,
        discount: item.discount,
      })),
    };

    setSubmitting(true);
    try {
      let result;
      if (isEdit && invoiceId) {
        result = await updateInvoice(invoiceId, payload);
      } else {
        result = await createInvoice(payload);
      }

      if (result.success) {
        setSuccessMessage(isEdit ? "Invoice updated successfully" : "Invoice created successfully");
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }, 2000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error?.message || 'Failed to save invoice',
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save invoice',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading data...</Text>
      </View>
    );
  }

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeStores = Array.isArray(stores) ? stores : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const selectedCustomer = safeCustomers.find(c => c.id.toString() === formData.customer_id);
  const selectedStore = safeStores.find(s => s.id.toString() === formData.store_id);

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />

      <Header
        title={isEdit ? "Edit Invoice" : "Create Invoice"}
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Invoices"
        navigationItems={menuItems}
        showBackButton={true}
        rightComponent={
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className={`px-4 py-2 rounded-lg ${submitting ? "bg-gray-300" : "bg-blue-500"}`}
          >
            <Text className="text-white font-semibold">
              {submitting ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Customer Selection */}
        <View className={`p-4 mx-4 mt-4 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            CUSTOMER
          </Text>
          <TouchableOpacity
            onPress={() => setShowCustomerModal(true)}
            className={`flex-row items-center justify-between p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
          >
            <View className="flex-1">
              <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {selectedCustomer?.name || selectedCustomer?.customer_name || "Select Customer"}
              </Text>
              {selectedCustomer?.phone && (
                <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {selectedCustomer.phone}
                </Text>
              )}
            </View>
            <Icon name="chevron-right" size={24} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
          </TouchableOpacity>
        </View>

        {/* Store Selection */}
        <View className={`p-4 mx-4 mt-4 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            STORE
          </Text>
          <TouchableOpacity
            onPress={() => setShowStoreModal(true)}
            className={`flex-row items-center justify-between p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
          >
            <View className="flex-1">
              <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {selectedStore?.name || selectedStore?.store_name || "Select Store"}
              </Text>
              {selectedStore?.address && (
                <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {selectedStore.address}
                </Text>
              )}
            </View>
            <Icon name="chevron-right" size={24} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
          </TouchableOpacity>
        </View>

        {/* Line Items */}
        <View className={`p-4 mx-4 mt-4 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              ITEMS ({lineItems.length})
            </Text>
            <TouchableOpacity
              onPress={() => setShowProductModal(true)}
              className="flex-row items-center px-3 py-1 bg-blue-500 rounded-lg"
            >
              <Icon name="plus" size={16} color="#ffffff" />
              <Text className="text-white text-sm ml-1">Add Item</Text>
            </TouchableOpacity>
          </View>

          {lineItems.length === 0 ? (
            <View className="py-8 items-center">
              <Icon name="package-variant" size={48} color={isDarkMode ? "#334155" : "#D1D5DB"} />
              <Text className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                No items added yet
              </Text>
            </View>
          ) : (
            lineItems.map((item, index) => (
              <View
                key={item.id || index}
                className={`p-3 rounded-lg mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                      {item.product_name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <Icon name="delete" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center mb-2">
                  <Text className={`text-xs w-16 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Qty:</Text>
                  <View className={`flex-row items-center rounded px-2 py-1 ${isDarkMode ? "bg-gray-600" : "bg-white"}`}>
                    <TouchableOpacity onPress={() => handleUpdateItem(index, "quantity", Math.max(1, item.quantity - 1))}>
                      <Icon name="minus" size={16} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                    </TouchableOpacity>
                    <TextInput
                      className={`w-12 text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}
                      value={item.quantity.toString()}
                      onChangeText={(value) => handleUpdateItem(index, "quantity", value)}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={() => handleUpdateItem(index, "quantity", item.quantity + 1)}>
                      <Icon name="plus" size={16} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row items-center mb-2">
                  <Text className={`text-xs w-16 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Price:</Text>
                  <TextInput
                    className={`flex-1 px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-white text-gray-800"}`}
                    value={item.price.toString()}
                    onChangeText={(value) => handleUpdateItem(index, "price", value)}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View className="flex-row items-center mb-2">
                  <Text className={`text-xs w-16 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>GST %:</Text>
                  <TextInput
                    className={`flex-1 px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-white text-gray-800"}`}
                    value={item.gst.toString()}
                    onChangeText={(value) => handleUpdateItem(index, "gst", value)}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View className="flex-row items-center">
                  <Text className={`text-xs w-16 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Discount %:</Text>
                  <TextInput
                    className={`flex-1 px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-white text-gray-800"}`}
                    value={item.discount.toString()}
                    onChangeText={(value) => handleUpdateItem(index, "discount", value)}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View className="flex-row justify-between mt-2 pt-2 border-t" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
                  <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total:</Text>
                  <Text className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    ₹{item.total_price.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Payment Settings */}
        <View className={`p-4 mx-4 mt-4 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            PAYMENT SETTINGS
          </Text>

          <View className="mb-4">
            <Text className={`text-xs mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Payment Method</Text>
            <View className="flex-row flex-wrap gap-2">
              {["Cash", "Card", "UPI", "Bank Transfer", "Cheque"].map((method) => (
                <TouchableOpacity
                  key={method}
                  onPress={() => setFormData({ ...formData, payment_method: method })}
                  className={`px-4 py-2 rounded-lg border ${
                    formData.payment_method === method
                      ? "border-blue-500 bg-blue-50"
                      : isDarkMode
                      ? "border-gray-600 bg-gray-700"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      formData.payment_method === method
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

          <View>
            <Text className={`text-xs mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Payment Status</Text>
            <View className="flex-row gap-2">
              {[
                { value: "paid", label: "Paid" },
                { value: "non_paid", label: "Unpaid" },
                { value: "semi_paid", label: "Partial" },
              ].map((status) => (
                <TouchableOpacity
                  key={status.value}
                  onPress={() => setFormData({ ...formData, payment_status: status.value })}
                  className={`flex-1 py-2 rounded-lg border ${
                    formData.payment_status === status.value
                      ? "border-blue-500 bg-blue-50"
                      : isDarkMode
                      ? "border-gray-600 bg-gray-700"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm text-center ${
                      formData.payment_status === status.value
                        ? "text-blue-600 font-medium"
                        : isDarkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {formData.payment_status === "semi_paid" && (
            <View className="mt-4">
              <Text className={`text-xs mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Payment Amount</Text>
              <View className={`flex-row items-center rounded-lg px-4 h-12 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <Text className={`text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹</Text>
                <TextInput
                  className={`flex-1 ml-2 text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  value={formData.payment_amount}
                  onChangeText={(value) => setFormData({ ...formData, payment_amount: value })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          )}
        </View>

        {/* Summary */}
        <View className={`p-4 mx-4 mt-4 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            SUMMARY
          </Text>

          <View className="flex-row justify-between py-2">
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Subtotal</Text>
            <Text className={`text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              ₹{totals.subtotal.toFixed(2)}
            </Text>
          </View>

          {totals.totalDiscount > 0 && (
            <View className="flex-row justify-between py-2">
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Discount</Text>
              <Text className={`text-sm text-green-600`}>
                -₹{totals.totalDiscount.toFixed(2)}
              </Text>
            </View>
          )}

          {totals.totalGst > 0 && (
            <View className="flex-row justify-between py-2">
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>GST</Text>
              <Text className={`text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                ₹{totals.totalGst.toFixed(2)}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between py-3 mt-2 border-t" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <Text className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Grand Total</Text>
            <Text className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              ₹{totals.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className={`flex-1 mt-20 rounded-t-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="p-4 border-b" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
              <View className="flex-row justify-between items-center">
                <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  Select Customer
                </Text>
                <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                  <Icon name="close" size={24} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView className="flex-1">
              {safeCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  onPress={() => handleCustomerSelect(customer)}
                  className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
                >
                  <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    {customer.name || customer.customer_name}
                  </Text>
                  {customer.phone && (
                    <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {customer.phone}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Store Selection Modal */}
      <Modal
        visible={showStoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStoreModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className={`flex-1 mt-20 rounded-t-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="p-4 border-b" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
              <View className="flex-row justify-between items-center">
                <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  Select Store
                </Text>
                <TouchableOpacity onPress={() => setShowStoreModal(false)}>
                  <Icon name="close" size={24} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView className="flex-1">
              {safeStores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  onPress={() => handleStoreSelect(store)}
                  className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
                >
                  <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    {store.name || store.store_name}
                  </Text>
                  {store.address && (
                    <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {store.address}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className={`flex-1 mt-20 rounded-t-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="p-4 border-b" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
              <View className="flex-row justify-between items-center">
                <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  Add Product
                </Text>
                <TouchableOpacity onPress={() => setShowProductModal(false)}>
                  <Icon name="close" size={24} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView className="flex-1">
              {safeProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => setSelectedProduct(product)}
                  className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"} ${selectedProduct?.id === product.id ? (isDarkMode ? "bg-gray-700" : "bg-blue-50") : ""}`}
                >
                  <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    {product.name}
                  </Text>
                  <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    ₹{parseFloat(product.selling_price || 0).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedProduct && (
              <View className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                <View className="flex-row items-center mb-4">
                  <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"} mr-2`}>Quantity:</Text>
                  <View className={`flex-row items-center rounded px-3 py-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <TouchableOpacity onPress={() => setProductQuantity(Math.max(1, productQuantity - 1))}>
                      <Icon name="minus" size={20} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                    </TouchableOpacity>
                    <TextInput
                      className={`w-16 text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}
                      value={productQuantity.toString()}
                      onChangeText={(value) => setProductQuantity(parseInt(value) || 1)}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={() => setProductQuantity(productQuantity + 1)}>
                      <Icon name="plus" size={20} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleAddProduct}
                  className="w-full py-3 bg-blue-500 rounded-lg"
                >
                  <Text className="text-white font-semibold text-center">Add to Invoice</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

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

export default InvoiceFormScreen;
