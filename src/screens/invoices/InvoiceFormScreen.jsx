// screens/invoices/InvoiceFormScreen.js - COMPLETE FIXED VERSION

import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { invoiceAPI } from "../../api/invoices";
import {
  SuccessModal,
  InfoModal
} from "../../components/common/CustomModal";
import Header from "../../components/common/Header";
import SearchSelect from "../../components/common/SearchSelect";
import Input from "../../components/common/Input";
import { useAuthStore } from "../../store/authStore";
import useCustomerStore from "../../store/customerStore";
import useInvoiceStore from "../../store/invoiceStore";
import usePackageStore from "../../store/packageStore";
import { usePermissionStore } from "../../store/permissionStore";
import useProductStore from "../../store/productStore";
import useStoreStore from "../../store/storeStore";
import { useThemeStore } from "../../store/themeStore";
import useUnitStore from "../../store/unitStore";
import { generateA4InvoiceHTML, generateThermalInvoiceHTML } from "../../templates/invoiceTemplates";
import { printAsync } from "expo-print";
import { shareAsync } from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Camera, CameraView } from "expo-camera";

const { width } = Dimensions.get("window");

// Helper function to sanitize numeric input
const sanitizeNumericInput = (value, allowDecimal = true, maxDecimals = 2) => {
  if (value === "" || value === null || value === undefined) return "";

  let cleaned = value.toString().replace(/[^0-9.]/g, "");

  const decimalCount = (cleaned.match(/\./g) || []).length;
  if (decimalCount > 1) {
    cleaned = cleaned.slice(0, cleaned.lastIndexOf("."));
  }

  if (allowDecimal && cleaned.includes(".")) {
    const parts = cleaned.split(".");
    if (parts[1] && parts[1].length > maxDecimals) {
      parts[1] = parts[1].slice(0, maxDecimals);
      cleaned = parts.join(".");
    }
  }

  return cleaned;
};

// Helper function to parse numeric value
const parseNumericValue = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to parse QR code data
const parseQRData = (qrData) => {
  try {
    if (qrData.startsWith('{')) {
      const parsed = JSON.parse(qrData);
      return {
        type: parsed.type || parsed.qrType || null,
        id: parsed.id || parsed.productId || parsed.stockId || null,
        raw: parsed
      };
    }

    const typeMatch = qrData.match(/^(PRD|STK)(\d+)$/i);
    if (typeMatch) {
      const type = typeMatch[1].toUpperCase();
      let id = typeMatch[2];
      id = id.replace(/^0+/, '');
      if (id === '') {
        id = '0';
      }
      return {
        type: type,
        id: id,
        raw: qrData
      };
    }

    const idMatch = qrData.match(/\d+/);
    if (idMatch) {
      return {
        type: null,
        id: idMatch[0],
        raw: qrData
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse QR data:', error);
    return null;
  }
};

// ============ LINE ITEM COMPONENT WITH LOCAL STATE ============
const LineItemComponent = React.memo(({
  item,
  index,
  onUpdate,
  onRemove,
  isDarkMode,
  hasStockPermission
}) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity?.toString() || "1");
  const [localPrice, setLocalPrice] = useState(item.price?.toString() || "0");
  const [localGst, setLocalGst] = useState(item.gst?.toString() || "0");
  const [localDiscount, setLocalDiscount] = useState(item.discount?.toString() || "0");

  const isTypingRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalQuantity(item.quantity?.toString() || "1");
      setLocalPrice(item.price?.toString() || "0");
      setLocalGst(item.gst?.toString() || "0");
      setLocalDiscount(item.discount?.toString() || "0");
    }
  }, [item.quantity, item.price, item.gst, item.discount]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleBlur = (field, value, minValue = 0) => {
    isTypingRef.current = false;
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= minValue) {
      onUpdate(index, field, numValue);
    } else {
      const defaultValue = field === 'quantity' ? 1 : 0;
      onUpdate(index, field, defaultValue);
      if (field === 'quantity') setLocalQuantity(defaultValue.toString());
      else if (field === 'price') setLocalPrice(defaultValue.toString());
      else if (field === 'gst') setLocalGst(defaultValue.toString());
      else if (field === 'discount') setLocalDiscount(defaultValue.toString());
    }
  };

  const handleFocus = () => {
    isTypingRef.current = true;
  };

  const handleQuantityChange = (text) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setLocalQuantity(sanitized);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const num = parseInt(sanitized) || 1;
      if (num >= 1) {
        onUpdate(index, 'quantity', num);
      }
    }, 300);
  };

  return (
    <View className={`p-4 rounded-xl mb-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap">
            {item.is_package && (
              <View className={`px-2 py-0.5 rounded mr-2 ${isDarkMode ? "bg-purple-500/30" : "bg-purple-100"}`}>
                <Text className={`text-xs font-semibold ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}>
                  PACKAGE
                </Text>
              </View>
            )}
            {item.scanned_from && (
              <View className={`px-2 py-0.5 rounded mr-2 ${isDarkMode ? "bg-green-500/30" : "bg-green-100"}`}>
                <Text className={`text-xs font-semibold ${isDarkMode ? "text-green-400" : "text-green-700"}`}>
                  SCANNED
                </Text>
              </View>
            )}
            <Text className={`font-semibold text-base flex-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {item.product_name}
            </Text>
          </View>

          <View className="flex-row items-center mt-0.5">
            {item.product_code && (
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {item.product_code}
              </Text>
            )}
            {item.variant_info && (
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                ({item.variant_info})
              </Text>
            )}
          </View>

          {item.unit_name && (
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-0.5`}>
              Unit: {item.unit_name}
            </Text>
          )}

          {!item.is_package && hasStockPermission && item.stock_quantity !== undefined && item.stock_quantity < Infinity && (
            <Text className={`text-xs mt-0.5 ${item.stock_quantity > 0 ? "text-green-600" : "text-red-600"}`}>
              📊 Stock: {item.stock_quantity > 0 ? item.stock_quantity : "Out of Stock"}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => onRemove(index)} className="p-2 rounded-lg bg-red-500/10">
          <Icon name="delete-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <View className="flex-1 min-w-[100px]">
          <Text className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>
            Quantity
          </Text>
          <View className={`flex-row items-center rounded-lg px-1 ${isDarkMode ? "bg-gray-600" : "bg-white"} border ${isDarkMode ? "border-gray-500" : "border-gray-300"}`}>
            <TouchableOpacity
              onPress={() => {
                const current = parseInt(localQuantity) || 1;
                const newVal = Math.max(1, current - 1);
                setLocalQuantity(newVal.toString());
                onUpdate(index, "quantity", newVal);
              }}
              className="p-1"
            >
              <Icon name="minus" size={18} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>

            <TextInput
              className={`flex-1 text-center font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
              value={localQuantity}
              onChangeText={handleQuantityChange}
              onFocus={handleFocus}
              onBlur={() => {
                const num = parseInt(localQuantity) || 1;
                const finalVal = Math.max(1, num);
                setLocalQuantity(finalVal.toString());
                onUpdate(index, "quantity", finalVal);
              }}
              keyboardType="number-pad"
              returnKeyType="done"
              scrollEnabled={false}
              textContentType="none"
              autoComplete="off"
              importantForAutofill="no"
            />

            <TouchableOpacity
              onPress={() => {
                const current = parseInt(localQuantity) || 1;
                const newVal = current + 1;
                
                // Stock validation for increment
                if (!item.is_package && hasStockPermission && item.stock_quantity !== undefined && item.stock_quantity < Infinity && newVal > item.stock_quantity) {
                  Toast.show({
                    type: "warning",
                    text1: "⚠️ Stock Limit",
                    text2: `Cannot exceed available stock. Maximum: ${item.stock_quantity}`,
                    visibilityTime: 3000,
                  });
                  return;
                }
                
                setLocalQuantity(newVal.toString());
                onUpdate(index, "quantity", newVal);
              }}
              className="p-1"
              disabled={!item.is_package && hasStockPermission && item.stock_quantity !== undefined && item.stock_quantity < Infinity && parseInt(localQuantity) >= item.stock_quantity}
            >
              <Icon name="plus" size={18} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>
          </View>
        </View>

        {!item.is_package && (
          <>
            <View className="flex-1 min-w-[100px]">
              <Text className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>
                Price
              </Text>
              <TextInput
                className={`px-3 py-2 rounded-lg text-base ${isDarkMode ? "bg-gray-600 text-white" : "bg-white text-gray-800"} border ${isDarkMode ? "border-gray-500" : "border-gray-300"}`}
                value={localPrice}
                onChangeText={(text) => {
                  const sanitized = sanitizeNumericInput(text, true, 2);
                  setLocalPrice(sanitized);
                }}
                onFocus={handleFocus}
                onBlur={() => {
                  const num = parseFloat(localPrice) || 0;
                  setLocalPrice(num.toString());
                  onUpdate(index, "price", num);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                returnKeyType="done"
                scrollEnabled={false}
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
              />
            </View>

            <View className="flex-1 min-w-[100px]">
              <Text className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>
                GST %
              </Text>
              <TextInput
                className={`px-3 py-2 rounded-lg text-base ${isDarkMode ? "bg-gray-600 text-white" : "bg-white text-gray-800"} border ${isDarkMode ? "border-gray-500" : "border-gray-300"}`}
                value={localGst}
                onChangeText={(text) => {
                  const sanitized = sanitizeNumericInput(text, true, 2);
                  setLocalGst(sanitized);
                }}
                onFocus={handleFocus}
                onBlur={() => {
                  const num = parseFloat(localGst) || 0;
                  setLocalGst(num.toString());
                  onUpdate(index, "gst", num);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                returnKeyType="done"
                scrollEnabled={false}
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
              />
              {item.original_gst_percentage > 0 && parseFloat(item.gst) < item.original_gst_percentage && (
                <Text className="text-xs text-red-500 mt-1">
                  ⚠️ GST ({item.original_gst_percentage}%)
                </Text>
              )}
            </View>

            <View className="flex-1 min-w-[100px]">
              <Text className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>
                Discount %
              </Text>
              <TextInput
                className={`px-3 py-2 rounded-lg text-base ${isDarkMode ? "bg-gray-600 text-white" : "bg-white text-gray-800"} border ${isDarkMode ? "border-gray-500" : "border-gray-300"}`}
                value={localDiscount}
                onChangeText={(text) => {
                  const sanitized = sanitizeNumericInput(text, true, 2);
                  setLocalDiscount(sanitized);
                }}
                onFocus={handleFocus}
                onBlur={() => {
                  const num = parseFloat(localDiscount) || 0;
                  setLocalDiscount(num.toString());
                  onUpdate(index, "discount", num);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                returnKeyType="done"
                scrollEnabled={false}
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
              />
            </View>
          </>
        )}
      </View>

      <View className="flex-row justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
        <Text className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Total
        </Text>
        <Text className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
          ₹{item.total_price?.toFixed(2) || "0.00"}
        </Text>
      </View>
    </View>
  );
});

// ============ PAYMENT AMOUNT INPUT COMPONENT - FULLY ISOLATED ============
const PaymentAmountInput = React.memo(({ 
  initialValue = "",
  onAmountChange, 
  isDarkMode, 
  maxAmount 
}) => {
  const [localAmount, setLocalAmount] = useState(initialValue || "");
  const isFocusedRef = useRef(false);
  const isMountedRef = useRef(true);
  const maxAmountRef = useRef(maxAmount);

  // Update maxAmount ref without causing re-render
  useEffect(() => {
    maxAmountRef.current = maxAmount;
  }, [maxAmount]);

  // Update local state only when initialValue changes and not focused
  useEffect(() => {
    if (!isFocusedRef.current && isMountedRef.current) {
      setLocalAmount(initialValue || "");
    }
  }, [initialValue]);

  // Clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    const numValue = parseFloat(localAmount);
    if (!isNaN(numValue) && numValue > 0) {
      const finalValue = Math.min(numValue, maxAmountRef.current);
      // Only update parent state on blur to prevent keyboard dismissal
      onAmountChange(finalValue.toString());
      if (isMountedRef.current) {
        setLocalAmount(finalValue.toString());
      }
    } else {
      onAmountChange("");
      if (isMountedRef.current) {
        setLocalAmount("");
      }
    }
  }, [localAmount, onAmountChange]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleChangeText = useCallback((text) => {
    // Only update local state while typing - don't update parent
    const sanitized = sanitizeNumericInput(text, true, 2);
    if (isMountedRef.current) {
      setLocalAmount(sanitized);
    }
  }, []);

  const handleSubmitEditing = useCallback(() => {
    // Manually trigger blur when user presses Done
    handleBlur();
  }, [handleBlur]);

  // Format currency
  const formattedMaxAmount = useMemo(() => {
    return `₹${maxAmountRef.current.toFixed(2)}`;
  }, [maxAmount]);

  return (
    <View className={`flex-row items-center rounded-xl px-4 py-3 border ${isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
      <Text className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
        ₹
      </Text>
      <TextInput
        className={`flex-1 ml-3 text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
        placeholder="0.00"
        placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
        value={localAmount}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmitEditing}
        keyboardType="decimal-pad"
        returnKeyType="done"
        scrollEnabled={false}
        textContentType="none"
        autoComplete="off"
        importantForAutofill="no"
      />
      <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        / {formattedMaxAmount}
      </Text>
    </View>
  );
});

// ============ MAIN COMPONENT ============
const InvoiceFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems, hasPermission } = usePermissionStore();

  const { createInvoice, updateInvoice, getInvoiceById } = useInvoiceStore();
  const { customers, fetchCustomers, createCustomer } = useCustomerStore();
  const { stores, fetchStores, createStore } = useStoreStore();
  const { products, fetchProducts, getProduct } = useProductStore();
  const { packages, fetchPackages } = usePackageStore();
  const { units, fetchUnits } = useUnitStore();

  const { invoiceId, isEdit } = route.params || {};

  const hasStockPermission = hasPermission("stock-management");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataFetchError, setDataFetchError] = useState(false);

  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [qrScanningEnabled, setQrScanningEnabled] = useState(true);

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
  const [deletedItemIds, setDeletedItemIds] = useState([]);

  // UI states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  // Search states for customer and store
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const [storeSearch, setStoreSearch] = useState("");
  const [filteredStores, setFilteredStores] = useState([]);

  // Product search states for modal
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productModalSearch, setProductModalSearch] = useState("");
  const [filteredModalProducts, setFilteredModalProducts] = useState([]);
  const [isLoadingModalProducts, setIsLoadingModalProducts] = useState(false);
  const productSearchTimeoutRef = useRef(null);
  const modalSearchTimeoutRef = useRef(null);

  // Package states
  const [packageSearch, setPackageSearch] = useState("");
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageQuantity, setPackageQuantity] = useState(1);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const initialPackageSnapshot = useRef("");

  // Customer/Store creation states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    gst: "",
  });
  const [newStoreData, setNewStoreData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gst: "",
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);

  // Edit Customer/Store Modals
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);
  const [showEditStoreModal, setShowEditStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [isUpdatingStore, setIsUpdatingStore] = useState(false);

  // Invoice Success Dialog with Print Options
  const [showInvoiceSuccess, setShowInvoiceSuccess] = useState(false);
  const [createdInvoiceData, setCreatedInvoiceData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Validation Alert Modal
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get filtered menu items
  const menuItems = getFilteredMenuItems().map((item) => ({
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

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasCameraPermission(false);
      return false;
    }
  }, []);

  // Transform scanned product data
  const transformScannedProduct = useCallback((productData) => {
    return {
      id: productData.id,
      stock_id: null,
      variant_index: 0,
      name: productData.name,
      sku: productData.sku,
      brand: productData.brand,
      category: productData.category,
      unit: productData.unit,
      attributes: productData.attributes || [],
      variants: productData.variants || [],
      price: parseFloat(productData.selling_price || 0),
      purchase_price: parseFloat(productData.purchase_price || 0),
      gst_percentage: parseFloat(productData.gst_percentage || 0),
      discount_percentage: parseFloat(productData.discount_percentage || 0),
      current_stock: hasStockPermission ? parseFloat(productData.current_stock || 0) : null,
      stock_quantity: hasStockPermission ? parseFloat(productData.current_stock || 0) : null,
      variant_info: null,
      stock_entry: null,
      stock_details: null,
      scanned_from: 'product'
    };
  }, [hasStockPermission]);

  // Transform scanned stock data
  const transformScannedStock = useCallback((stockData) => {
    const productData = stockData.product || {};
    const unit = productData.unit || stockData.unit || null;
    const stockQty = parseFloat(stockData.quantity || 0);

    return {
      id: stockData.product_id || stockData.id,
      stock_id: stockData.id,
      variant_index: 0,
      name: productData.name || stockData.product_name || 'Product',
      sku: productData.sku || stockData.sku || '',
      brand: productData.brand || null,
      category: productData.category || null,
      unit: unit,
      attributes: productData.attributes || [],
      variants: productData.variants || [],
      price: parseFloat(stockData.selling_price || 0),
      purchase_price: parseFloat(stockData.purchase_price || 0),
      gst_percentage: parseFloat(stockData.selling_gst_percentage || 0),
      discount_percentage: parseFloat(productData.discount_percentage || 0),
      current_stock: stockQty,
      stock_quantity: stockQty,
      variant_info: stockQty > 0 ? `${stockQty.toFixed(2)} units available` : 'Out of stock',
      stock_entry: stockData,
      stock_details: {
        id: stockData.id,
        quantity: stockData.quantity,
        selling_price: stockData.selling_price,
        purchase_price: stockData.purchase_price,
        unit: unit,
        selling_gst_percentage: stockData.selling_gst_percentage,
        product: productData
      },
      scanned_from: 'stock'
    };
  }, []);

  // Handle QR code scan result
  const handleQRScanResult = useCallback(async (qrData) => {
    if (!qrScanningEnabled || scannerLoading) return;

    setQrScanningEnabled(false);
    setScannerLoading(true);

    try {
      const parsedData = parseQRData(qrData);

      if (!parsedData || !parsedData.id) {
        Toast.show({
          type: 'error',
          text1: 'Invalid QR Code',
          text2: 'Could not parse QR code data. Please try again.',
        });
        setQrScanningEnabled(true);
        setScannerLoading(false);
        return;
      }

      let product = null;
      let qrType = parsedData.type;

      if (parsedData.type === 'PRD') {
        try {
          const response = await invoiceAPI.getScannedProduct(parsedData.id);

          if (response.data?.status === true && response.data?.data) {
            const productData = response.data.data;
            product = transformScannedProduct(productData);

            Toast.show({
              type: 'success',
              text1: 'Product Found',
              text2: `${product.name} added successfully!`,
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Product Not Found',
              text2: 'Could not find product with this QR code.',
            });
            setQrScanningEnabled(true);
            setScannerLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching scanned product:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'Failed to fetch product details',
          });
          setQrScanningEnabled(true);
          setScannerLoading(false);
          return;
        }

      } else if (parsedData.type === 'STK') {
        if (!hasStockPermission) {
          Toast.show({
            type: 'error',
            text1: 'Permission Denied',
            text2: 'You do not have permission to scan stock QR codes.',
          });
          setQrScanningEnabled(true);
          setScannerLoading(false);
          return;
        }

        try {
          const response = await invoiceAPI.getScannedStock(parsedData.id);

          if (response.data?.status === true && response.data?.data) {
            const stockData = response.data.data;
            product = transformScannedStock(stockData);

            const stockQty = parseFloat(stockData.quantity || 0);
            Toast.show({
              type: 'success',
              text1: 'Stock Found',
              text2: `${product.name} - ${stockQty.toFixed(2)} units available`,
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Stock Not Found',
              text2: 'Could not find stock with this QR code.',
            });
            setQrScanningEnabled(true);
            setScannerLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching scanned stock:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'Failed to fetch stock details',
          });
          setQrScanningEnabled(true);
          setScannerLoading(false);
          return;
        }

      } else {
        Toast.show({
          type: 'info',
          text1: 'Identifying',
          text2: 'Trying to identify product...',
        });

        try {
          const response = await invoiceAPI.getScannedProduct(parsedData.id);
          if (response.data?.status === true && response.data?.data) {
            const productData = response.data.data;
            product = transformScannedProduct(productData);
            qrType = 'PRD';
            Toast.show({
              type: 'success',
              text1: 'Product Found',
              text2: `${product.name} added successfully!`,
            });
          }
        } catch (e) { }

        if (!product && hasStockPermission) {
          try {
            const response = await invoiceAPI.getScannedStock(parsedData.id);
            if (response.data?.status === true && response.data?.data) {
              const stockData = response.data.data;
              product = transformScannedStock(stockData);
              qrType = 'STK';
              const stockQty = parseFloat(stockData.quantity || 0);
              Toast.show({
                type: 'success',
                text1: 'Stock Found',
                text2: `${product.name} - ${stockQty.toFixed(2)} units available`,
              });
            }
          } catch (e) { }
        }

        if (!product) {
          Toast.show({
            type: 'error',
            text1: 'Not Found',
            text2: 'Could not find product or stock with this QR code.',
          });
          setQrScanningEnabled(true);
          setScannerLoading(false);
          return;
        }
      }

      if (product) {
        const existingItemIndex = lineItems.findIndex(
          (item) =>
            !item.is_package &&
            item.product_id === product.id &&
            (hasStockPermission ? item.stock_id === product.stock_id : true),
        );

        if (existingItemIndex !== -1) {
          const existingItem = lineItems[existingItemIndex];
          const newQuantity = parseFloat(existingItem.quantity) + 1;

          if (hasStockPermission && product.stock_quantity !== null && product.stock_quantity !== undefined) {
            const availableStock = parseFloat(product.stock_quantity);
            if (availableStock > 0 && newQuantity > availableStock) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: `Cannot add more than available stock. Available: ${availableStock.toFixed(2)} units`,
              });
              setQrScanningEnabled(true);
              setScannerLoading(false);
              return;
            }
          }

          setLineItems((prev) => {
            const next = [...prev];
            next[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              item_count: newQuantity,
              total_price: calculateItemTotal(
                existingItem.price,
                newQuantity,
                existingItem.gst,
                existingItem.discount,
              ),
            };
            return next;
          });

          Toast.show({
            type: "success",
            text1: "Success",
            text2: `Quantity updated for ${product.name} to ${newQuantity}`,
          });
        } else {
          const quantity = 1;
          const sellingPrice = product.price;
          const purchasePrice = product.purchase_price;
          const gst = parseFloat(product.gst_percentage) || 0;
          const discount = parseFloat(product.discount_percentage) || 0;
          const totalPrice = calculateItemTotal(
            sellingPrice,
            quantity,
            gst,
            discount,
          );

          let unitName = "pcs";
          if (product.unit) {
            unitName = product.unit.short_name || product.unit.name || "pcs";
          }

          const newItem = {
            product_id: product.id,
            stock_id: product.stock_id,
            product_name: product.name,
            product_code: product.sku,
            quantity: quantity,
            item_count: quantity,
            unit_id: product.unit?.id || null,
            unit_name: unitName,
            price: sellingPrice,
            purchase_price: purchasePrice,
            gst: gst,
            discount: discount,
            total_price: totalPrice,
            status: "completed",
            stock_quantity: product.stock_quantity,
            current_stock: product.stock_quantity,
            variant_info: product.variant_info || null,
            original_gst_percentage: gst,
            attributes: product.attributes || [],
            variants: product.variants || [],
            is_package: false,
            stock_details: product.stock_details,
            scanned_from: qrType === 'STK' ? 'stock' : 'product'
          };

          setLineItems((prev) => [...prev, newItem]);

          const sourceText = qrType === 'STK' ? ' (Stock)' : '';
          Toast.show({
            type: "success",
            text1: "Success",
            text2: `${newItem.product_name}${sourceText} added to invoice`,
          });
        }

        setShowQRScanner(false);
      }

    } catch (error) {
      console.error('QR scan error:', error);
      Toast.show({
        type: 'error',
        text1: 'Scan Error',
        text2: error.message || 'Failed to process QR code. Please try again.',
      });
    } finally {
      setQrScanningEnabled(true);
      setScannerLoading(false);
    }
  }, [
    qrScanningEnabled,
    scannerLoading,
    hasStockPermission,
    lineItems,
    transformScannedProduct,
    transformScannedStock,
  ]);

  // Fetch products with stock
  const fetchProductsWithStock = useCallback(
    async (searchTerm = "") => {
      try {
        const response = await invoiceAPI.getProductsWithStock(searchTerm);

        if (response.data?.status === true && response.data?.data?.data) {
          const productsData = response.data.data.data;
          const transformedProducts = [];

          productsData.forEach((product) => {
            if (
              hasStockPermission &&
              product.stocks &&
              product.stocks.length > 0
            ) {
              product.stocks.forEach((stock, index) => {
                transformedProducts.push({
                  id: product.id,
                  stock_id: stock.id,
                  variant_index: index,
                  name: product.name,
                  sku: product.sku,
                  brand: product.brand,
                  category: product.category,
                  unit: product.unit,
                  attributes: product.attributes || [],
                  variants: product.variants || [],
                  price: parseFloat(
                    stock.selling_price || product.selling_price,
                  ),
                  purchase_price: parseFloat(
                    stock.purchase_price || product.purchase_price,
                  ),
                  gst_percentage: parseFloat(
                    stock.selling_gst_percentage || product.gst_percentage,
                  ),
                  discount_percentage: parseFloat(product.discount_percentage),
                  current_stock: parseFloat(stock.quantity),
                  stock_quantity: parseFloat(stock.quantity),
                  variant_info:
                    product.stocks.length > 1
                      ? `Stock (${stock.quantity} units)`
                      : null,
                  stock_entry: stock,
                  stock_details: {
                    id: stock.id,
                    quantity: stock.quantity,
                    selling_price: stock.selling_price,
                    purchase_price: stock.purchase_price,
                    unit: stock.unit,
                  },
                });
              });
            } else {
              transformedProducts.push({
                id: product.id,
                stock_id: null,
                variant_index: 0,
                name: product.name,
                sku: product.sku,
                brand: product.brand,
                category: product.category,
                unit: product.unit,
                attributes: product.attributes || [],
                variants: product.variants || [],
                price: parseFloat(product.selling_price),
                purchase_price: parseFloat(product.purchase_price),
                gst_percentage: parseFloat(product.gst_percentage),
                discount_percentage: parseFloat(product.discount_percentage),
                current_stock: hasStockPermission
                  ? parseFloat(product.current_stock || 0)
                  : null,
                stock_quantity: hasStockPermission
                  ? parseFloat(product.current_stock || 0)
                  : null,
                variant_info: !hasStockPermission
                  ? "Stock management disabled"
                  : "No Stock Entry",
                stock_entry: null,
                stock_details: null,
              });
            }
          });

          return transformedProducts;
        }

        return [];
      } catch (error) {
        console.error("Failed to fetch products with stock:", error);
        return [];
      }
    },
    [hasStockPermission],
  );

  // Product search handler for inline search (opens modal)
  const handleProductSearch = useCallback(() => {
    Keyboard.dismiss();
    setShowProductModal(true);
    setProductModalSearch("");
    setFilteredModalProducts([]);
  }, []);

  // Product search handler for modal
  const handleModalProductSearch = useCallback(
    (searchTerm) => {
      setProductModalSearch(searchTerm);

      if (modalSearchTimeoutRef.current) {
        clearTimeout(modalSearchTimeoutRef.current);
      }

      if (!searchTerm || searchTerm.trim() === "") {
        setFilteredModalProducts([]);
        setIsLoadingModalProducts(false);
        return;
      }

      setIsLoadingModalProducts(true);

      modalSearchTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await fetchProductsWithStock(searchTerm);
          setFilteredModalProducts(result);
        } catch (error) {
          console.error("Error searching products:", error);
          setFilteredModalProducts([]);
        } finally {
          setIsLoadingModalProducts(false);
        }
      }, 500);
    },
    [fetchProductsWithStock],
  );

  // Package search handler
  const handlePackageSearch = useCallback(
    (searchTerm) => {
      setPackageSearch(searchTerm);

      if (!searchTerm || searchTerm.trim() === "") {
        setFilteredPackages(packages);
        return;
      }

      const q = searchTerm.toLowerCase().trim();
      const filtered = packages.filter(
        (pkg) =>
          pkg.package_name?.toLowerCase().includes(q) ||
          pkg.package_size?.toLowerCase().includes(q) ||
          String(pkg.package_price || "").includes(q),
      );
      setFilteredPackages(filtered);
    },
    [packages],
  );

  // Filter customers based on search
  useEffect(() => {
    if (!Array.isArray(customers) || customers.length === 0) {
      setFilteredCustomers([]);
      return;
    }
    if (!customerSearch.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    const q = customerSearch.toLowerCase();
    setFilteredCustomers(
      customers.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(q) ||
          customer.customer_name?.toLowerCase().includes(q) ||
          customer.phone?.includes(q) ||
          customer.email?.toLowerCase().includes(q),
      ),
    );
  }, [customerSearch, customers]);

  // Filter stores based on search
  useEffect(() => {
    if (!Array.isArray(stores) || stores.length === 0) {
      setFilteredStores([]);
      return;
    }
    if (!storeSearch.trim()) {
      setFilteredStores(stores);
      return;
    }
    const q = storeSearch.toLowerCase();
    setFilteredStores(
      stores.filter(
        (store) =>
          store.name?.toLowerCase().includes(q) ||
          store.store_name?.toLowerCase().includes(q) ||
          store.mobile?.includes(q) ||
          store.phone?.includes(q) ||
          store.email?.toLowerCase().includes(q),
      ),
    );
  }, [storeSearch, stores]);

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setDataLoading(true);
      setDataFetchError(false);
      try {
        const userId = getUserId();

        await Promise.all([
          fetchCustomers(userId, ""),
          fetchStores(userId, ""),
          fetchProducts(userId, 1, ""),
          fetchPackages(1, userId),
          fetchUnits(1, false),
        ]);

        if (stores.length === 1 && !isEdit) {
          const singleStore = stores[0];
          setFormData((prev) => ({
            ...prev,
            store_id: singleStore.id.toString(),
          }));
          setStoreSearch(singleStore.name || singleStore.store_name || "");
          console.log("✅ Auto-selected store:", singleStore.name);
        }

        if (isEdit && invoiceId && !cancelled) {
          try {
            const invoiceData = await getInvoiceById(invoiceId);
            if (invoiceData && !cancelled) {
              setFormData({
                customer_id: invoiceData.customer_id?.toString() || "",
                store_id: invoiceData.store_id?.toString() || "",
                payment_method: normalizePaymentMethod(
                  invoiceData.payment_method,
                ),
                payment_status: invoiceData.payment_status || "paid",
                payment_amount: invoiceData.paid_amount?.toString() || "",
              });

              const rows = (
                invoiceData.invoice_items ||
                invoiceData.items ||
                []
              ).filter((row) => !row.is_package);

              // Enhanced product mapping with real-time stock fetching
              const mappedProducts = [];
              
              for (const item of rows) {
                const qty = parseFloat(item.quantity ?? item.item_count ?? 1);
                
                // Try to find product in local products first
                let product = products.find((p) => p.id === item.product_id);
                
                // If not found locally, fetch from API
                if (!product || !product.name) {
                  try {
                    const productResponse = await invoiceAPI.getScannedProduct(item.product_id);
                    if (productResponse.data?.status === true && productResponse.data?.data) {
                      product = productResponse.data.data;
                    }
                  } catch (error) {
                    console.error(`Failed to fetch product ${item.product_id}:`, error);
                  }
                }
                
                // Fetch current stock quantity using stock_id from invoice item
                let currentStockQuantity = 0;
                let stockEntry = null;
                
                if (hasStockPermission && item.stock_id) {
                  try {
                    const stockResponse = await invoiceAPI.getScannedStock(item.stock_id);
                    if (stockResponse.data?.status === true && stockResponse.data?.data) {
                      stockEntry = stockResponse.data.data;
                      currentStockQuantity = parseFloat(stockEntry.quantity || 0);
                    }
                  } catch (error) {
                    console.error(`Failed to fetch stock ${item.stock_id}:`, error);
                  }
                }
                
                const availableStock = hasStockPermission ? currentStockQuantity : Infinity;
                const price = parseFloat(item.price ?? product?.selling_price ?? 0);
                const gst = parseFloat(item.gst ?? product?.gst_percentage ?? 0);
                const discount = parseFloat(item.discount ?? product?.discount_percentage ?? 0);
                
                let productName = "";
                if (product?.name) {
                  productName = product.name;
                } else if (item.product_name && item.product_name !== "Product #undefined") {
                  productName = item.product_name;
                } else if (item.name && item.name !== "Product #undefined") {
                  productName = item.name;
                } else {
                  productName = `Product #${item.product_id}`;
                }
                
                let productCode = "";
                if (product?.sku) {
                  productCode = product.sku;
                } else if (product?.code) {
                  productCode = product.code;
                } else if (item.product_code) {
                  productCode = item.product_code;
                } else if (item.code) {
                  productCode = item.code;
                }
                
                const unit = units.find((u) => u.id === (item.unit_id || product?.unit_id));
                let unitName = "pcs";
                if (item.unit_name) {
                  unitName = item.unit_name;
                } else if (unit?.short_name) {
                  unitName = unit.short_name;
                } else if (unit?.name) {
                  unitName = unit.name;
                } else if (product?.unit?.short_name) {
                  unitName = product.unit.short_name;
                } else if (product?.unit?.name) {
                  unitName = product.unit.name;
                }
                
                // Extract attributes from product
                let productAttributes = [];
                let productVariants = [];
                
                if (product) {
                  if (product.attributes && Array.isArray(product.attributes)) {
                    productAttributes = product.attributes;
                  } else if (product.attribute && Array.isArray(product.attribute)) {
                    productAttributes = product.attribute;
                  }
                  
                  if (product.variants && Array.isArray(product.variants)) {
                    productVariants = product.variants;
                  } else if (product.variant && Array.isArray(product.variant)) {
                    productVariants = product.variant;
                  }
                  
                  // If stock entry has variant info, use that
                  if (stockEntry && stockEntry.variant_info) {
                    if (!productVariants.length && stockEntry.variant_info) {
                      productVariants = [stockEntry.variant_info];
                    }
                  }
                }
                
                mappedProducts.push({
                  id: item.id,
                  product_id: item.product_id,
                  product_name: productName,
                  product_code: productCode,
                  quantity: qty,
                  item_count: qty,
                  unit_id: item.unit_id || product?.unit_id || null,
                  unit_name: unitName,
                  price: price,
                  gst: gst,
                  discount: discount,
                  total_price: calculateItemTotal(price, qty, gst, discount),
                  status: "completed",
                  stock_quantity: availableStock,
                  current_stock: currentStockQuantity,
                  stock_id: item.stock_id || stockEntry?.id || null,
                  is_package: false,
                  variant_info: item.variant_info || stockEntry?.variant_info || null,
                  attributes: productAttributes,
                  variants: productVariants,
                  original_gst_percentage: gst,
                });
              }

              const pkgData = invoiceData.packages;
              const invoicePackages = Array.isArray(pkgData)
                ? pkgData
                : pkgData
                  ? [pkgData]
                  : [];
              const mappedPackages = invoicePackages.map((p) => ({
                is_package: true,
                package_row_id: p.id,
                product_id: p.package_id || p.id,
                product_name: p.package_name || "Package",
                product_code: `PKG-${p.package_id || p.id}`,
                quantity: parseFloat(p.quantity || 1),
                item_count: parseFloat(p.quantity || 1),
                unit_id: null,
                unit_name: p.package_size || "Package",
                price: parseFloat(p.package_price || 0),
                gst: 0,
                discount: 0,
                total_price:
                  parseFloat(p.package_price || 0) *
                  parseFloat(p.quantity || 1),
                stock_quantity: 0,
                stock_id: null,
                attributes: [],
                variants: [],
              }));

              // Store initial package snapshot for change detection
              initialPackageSnapshot.current = JSON.stringify(
                mappedPackages.map((m) => ({ id: m.package_row_id, q: m.quantity })),
              );

              setLineItems([...mappedProducts, ...mappedPackages]);
            }
          } catch (error) {
            console.error("Failed to load invoice data:", error);
            setDataFetchError(true);
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to load invoice data",
            });
          }
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setDataFetchError(true);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load required data",
        });
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [
    getUserId,
    fetchCustomers,
    fetchStores,
    fetchProducts,
    fetchPackages,
    isEdit,
    invoiceId,
    getInvoiceById,
  ]);

  // Effect to auto-select store when stores are loaded and only one exists
  useEffect(() => {
    if (stores.length === 1 && !isEdit && !formData.store_id) {
      const singleStore = stores[0];
      setFormData((prev) => ({
        ...prev,
        store_id: singleStore.id.toString(),
      }));
      setStoreSearch(singleStore.name || singleStore.store_name || "");
      console.log("✅ Auto-selected store (effect):", singleStore.name);
    }
  }, [stores, isEdit, formData.store_id]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (productSearchTimeoutRef.current) {
        clearTimeout(productSearchTimeoutRef.current);
      }
      if (modalSearchTimeoutRef.current) {
        clearTimeout(modalSearchTimeoutRef.current);
      }
    };
  }, []);

  const normalizePaymentMethod = (method) => {
    if (!method) return "Cash";
    const methodLower = method.toLowerCase();
    const methodMap = {
      cash: "Cash",
      card: "Card",
      upi: "UPI",
      "bank transfer": "Bank Transfer",
      banktransfer: "Bank Transfer",
      cheque: "Cheque",
      check: "Cheque",
      "non paid": "Non Paid",
    };
    return methodMap[methodLower] || "Cash";
  };

  const calculateItemTotal = (price, quantity, gst, discount) => {
    const basePrice = price * quantity;
    const discountAmount = basePrice * (discount / 100);
    const gstAmount = (basePrice - discountAmount) * (gst / 100);
    return basePrice - discountAmount + gstAmount;
  };

  const calculateTotalsFromLines = (lineItems) => {
    const productItems = lineItems.filter((item) => !item.is_package);
    const packageItems = lineItems.filter((item) => item.is_package);

    const productSubtotal = productItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const productDiscount = productItems.reduce((sum, item) => {
      const basePrice = item.price * item.quantity;
      return sum + basePrice * (item.discount / 100);
    }, 0);
    const productGst = productItems.reduce((sum, item) => {
      const basePrice = item.price * item.quantity;
      const discountedPrice = basePrice - basePrice * (item.discount / 100);
      return sum + discountedPrice * (item.gst / 100);
    }, 0);
    const packageTotal = packageItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const subtotal = productSubtotal;
    const totalDiscount = productDiscount;
    const totalGst = productGst;
    const totalAmount =
      productSubtotal - productDiscount + productGst + packageTotal;

    return {
      subtotal,
      totalGst,
      totalDiscount,
      totalAmount,
      packageTotal,
      productTotalAfterDiscountAndGst:
        productSubtotal - productDiscount + productGst,
    };
  };

  const calculateTotals = () => {
    return calculateTotalsFromLines(lineItems);
  };

  const totals = calculateTotals();

  const effectivePaidAmount = useMemo(() => {
    const t = totals.totalAmount;
    if (formData.payment_status === "paid") return t;
    if (formData.payment_status === "semi_paid") {
      const p = parseNumericValue(formData.payment_amount);
      return Math.min(Math.max(0, p), t);
    }
    return 0;
  }, [totals.totalAmount, formData.payment_status, formData.payment_amount]);

  const dueAfterPayment = useMemo(
    () => Math.max(0, totals.totalAmount - effectivePaidAmount),
    [totals.totalAmount, effectivePaidAmount],
  );

  // Handle adding item with multiple stock variants
  const handleAddItem = async (product) => {
    let productWithGST = product;
    if (parseFloat(product.gst_percentage) === 0) {
      try {
        const result = await getProduct(product.id);
        if (result.success && result.data) {
          const fullProduct = result.data;
          if (parseFloat(fullProduct.gst_percentage) > 0) {
            productWithGST = { ...product, gst_percentage: fullProduct.gst_percentage };
          }
        }
      } catch (error) {
        console.error('Failed to fetch full product details:', error);
      }
    }

    const existingItemIndex = lineItems.findIndex(
      (item) =>
        !item.is_package &&
        item.product_id === product.id &&
        (hasStockPermission ? item.stock_id === product.stock_id : true),
    );

    if (existingItemIndex !== -1) {
      const existingItem = lineItems[existingItemIndex];
      const newQuantity = parseFloat(existingItem.quantity) + 1;

      if (
        hasStockPermission &&
        product.stock_quantity > 0 &&
        newQuantity > product.stock_quantity
      ) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: `Cannot add more than available stock. Available: ${product.stock_quantity}`,
        });
        return;
      }

      setLineItems((prev) => {
        const next = [...prev];
        next[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          item_count: newQuantity,
          total_price: calculateItemTotal(
            existingItem.price,
            newQuantity,
            existingItem.gst,
            existingItem.discount,
          ),
        };
        return next;
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Quantity updated for ${product.name}`,
      });
      setShowProductModal(false);
      setProductModalSearch("");
      setFilteredModalProducts([]);
      return;
    }

    let stockQuantity = null;
    let stockId = null;

    if (hasStockPermission) {
      stockQuantity = product.stock_quantity;
      stockId = product.stock_id;

      if (!stockId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2:
            "This product has no stock entry. Please add stock before adding to invoice.",
        });
        return;
      }

      if (stockQuantity === 0) {
        Toast.show({
          type: "warning",
          text1: "Warning",
          text2:
            "This stock has 0 quantity. You can still add it, but stock validation will apply.",
        });
      }
    }

    const unit = product.unit;
    const sellingPrice = product.price;
    const purchasePrice = product.purchase_price;
    let gst = parseFloat(productWithGST.gst_percentage) || 0;
    const discount = parseFloat(product.discount_percentage) || 0;

    if (gst === 0 && product.stock_details?.selling_gst_percentage) {
      gst = parseFloat(product.stock_details.selling_gst_percentage) || 0;
    }

    const quantity = 1;
    const totalPrice = calculateItemTotal(
      sellingPrice,
      quantity,
      gst,
      discount,
    );

    let unitName = "pcs";
    if (unit) {
      unitName = unit.short_name || unit.name || "pcs";
    }

    const newItem = {
      product_id: product.id,
      stock_id: stockId,
      product_name: product.name,
      product_code: product.sku,
      quantity: quantity,
      item_count: quantity,
      unit_id: unit?.id || null,
      unit_name: unitName,
      price: sellingPrice,
      purchase_price: purchasePrice,
      gst: gst,
      discount: discount,
      total_price: totalPrice,
      status: "completed",
      stock_quantity: stockQuantity,
      variant_info: hasStockPermission ? product.variant_info : null,
      original_gst_percentage: gst,
      attributes: product.attributes || [],
      variants: product.variants || [],
      is_package: false,
      stock_details: product.stock_details,
    };

    setLineItems((prev) => [...prev, newItem]);
    setProductModalSearch("");
    setFilteredModalProducts([]);
    setShowProductModal(false);

    const variantText =
      hasStockPermission && product.variant_info
        ? ` (${product.variant_info})`
        : "";
    Toast.show({
      type: "success",
      text1: "Success",
      text2: `${newItem.product_name}${variantText} added to invoice`,
    });
  };

  const handleAddPackageToInvoice = () => {
    if (!selectedPackage || packageQuantity <= 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Select a package and enter quantity",
      });
      return;
    }
    const packageItem = {
      is_package: true,
      package_row_id: null,
      product_id: selectedPackage.id,
      product_name: selectedPackage.package_name,
      product_code: `PKG-${selectedPackage.id}`,
      quantity: packageQuantity,
      item_count: packageQuantity,
      unit_id: null,
      unit_name: selectedPackage.package_size || "Package",
      price: parseFloat(selectedPackage.package_price) || 0,
      gst: 0,
      discount: 0,
      total_price:
        (parseFloat(selectedPackage.package_price) || 0) * packageQuantity,
      stock_quantity: 0,
      stock_id: null,
      attributes: [],
      variants: [],
    };
    setLineItems((prev) => [...prev, packageItem]);
    setSelectedPackage(null);
    setPackageSearch("");
    setPackageQuantity(1);
    setIsPackageModalOpen(false);
    Toast.show({
      type: "success",
      text1: "Success",
      text2: `Package added: ${packageItem.product_name}`,
    });
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setPackageSearch(pkg.package_name);
    setIsPackageModalOpen(false);
    setPackageQuantity(1);
  };

  // UPDATED: Update item with proper numeric validation
  const handleUpdateItem = useCallback((index, field, value) => {
    const item = lineItems[index];
    if (!item) return;

    if (item.is_package) {
      if (field === "quantity") {
        const finalQ = Math.max(1, value);
        setLineItems((prev) => {
          const next = [...prev];
          next[index] = {
            ...item,
            quantity: finalQ,
            item_count: finalQ,
            total_price: item.price * finalQ,
          };
          return next;
        });
      }
      return;
    }

    // Validate quantity against stock
    if (field === "quantity") {
      if (hasStockPermission && item.stock_quantity > 0 && value > item.stock_quantity) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: `Cannot exceed available stock. Available: ${item.stock_quantity}`,
        });
        return;
      }
    }

    // Validate GST
    if (field === "gst") {
      const originalGst = item.original_gst_percentage || 0;
      if (originalGst > 0 && value < originalGst) {
        Toast.show({
          type: "warning",
          text1: "Warning",
          text2: `GST cannot be reduced below original GST (${originalGst}%). Current: ${value}%`,
        });
      }
    }

    setLineItems((prev) => {
      const next = [...prev];
      const row = { ...next[index] };

      if (field === "quantity") {
        row.quantity = value;
        row.item_count = value;
      } else {
        row[field] = value;
      }

      row.total_price = calculateItemTotal(
        row.price || 0,
        row.quantity || 1,
        row.gst || 0,
        row.discount || 0,
      );
      next[index] = row;
      return next;
    });
  }, [lineItems, hasStockPermission]);

  const handleRemoveItem = (index) => {
    const row = lineItems[index];
    if (!row.is_package && row.id) {
      setDeletedItemIds((d) => [...d, row.id]);
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Payment amount change handler - stable reference
  const handlePaymentAmountChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, payment_amount: value }));
  }, []);

  const handleCustomerSelect = (customerId, customer) => {
    setFormData({ ...formData, customer_id: customerId?.toString() || "" });
    if (customer) {
      setCustomerSearch(customer.name || customer.customer_name || "");
    }
    Toast.show({
      type: "success",
      text1: "Success",
      text2: `Customer selected: ${customer?.name || customer?.customer_name || "Customer"}`,
    });
  };

  const handleStoreSelect = (storeId, store) => {
    setFormData({ ...formData, store_id: storeId?.toString() || "" });
    if (store) {
      setStoreSearch(store.name || store.store_name || "");
    }
    Toast.show({
      type: "success",
      text1: "Success",
      text2: `Store selected: ${store?.name || store?.store_name || "Store"}`,
    });
  };

  const handleCreateCustomerFromSearch = (searchTerm) => {
    setNewCustomerData((prev) => ({
      ...prev,
      name: searchTerm || "",
    }));
    setShowAddCustomerModal(true);
  };

  const handleCreateStoreFromSearch = (searchTerm) => {
    if (stores.length > 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You already have a store. Only one store is allowed.",
      });
      return;
    }
    setNewStoreData((prev) => ({
      ...prev,
      name: searchTerm || "",
    }));
    setShowAddStoreModal(true);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.name.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Customer name is required",
      });
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const result = await createCustomer({
        ...newCustomerData,
        user_id: parseInt(getUserId()),
      });

      if (result.success) {
        await fetchCustomers(getUserId(), "");

        if (result.data?.id) {
          setFormData({ ...formData, customer_id: result.data.id.toString() });
          setCustomerSearch(newCustomerData.name || "");
          Toast.show({
            type: "success",
            text1: "Success",
            text2: `Customer "${newCustomerData.name}" created and selected`,
          });
        } else {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Customer created successfully",
          });
        }

        setShowAddCustomerModal(false);
        setNewCustomerData({
          name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          gst: "",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: result.error || "Failed to create customer",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to create customer",
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleCreateStore = async () => {
    if (stores.length > 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You already have a store. Only one store is allowed.",
      });
      setShowAddStoreModal(false);
      return;
    }

    if (!newStoreData.name.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Store name is required",
      });
      return;
    }

    setIsCreatingStore(true);
    try {
      const result = await createStore({
        ...newStoreData,
        user_id: parseInt(getUserId()),
      });

      if (result.success) {
        await fetchStores(getUserId(), "");

        if (result.data?.id) {
          setFormData({ ...formData, store_id: result.data.id.toString() });
          setStoreSearch(newStoreData.name || "");
          Toast.show({
            type: "success",
            text1: "Success",
            text2: `Store "${newStoreData.name}" created and selected`,
          });
        } else {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Store created successfully",
          });
        }

        setShowAddStoreModal(false);
        setNewStoreData({
          name: "",
          email: "",
          mobile: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          gst: "",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: result.error || "Failed to create store",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to create store",
      });
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowEditCustomerModal(true);
  };

  const handleUpdateCustomer = async (customerData) => {
    if (isUpdatingCustomer) return;

    setIsUpdatingCustomer(true);
    try {
      const response = await apiClient.put(`/customer/${editingCustomer.id}`, {
        ...customerData,
        user_id: parseInt(getUserId()),
      });

      if (response.data?.status === true) {
        await fetchCustomers(getUserId(), "");
        setFormData((prev) => ({ ...prev, customer_id: editingCustomer.id }));
        setCustomerSearch(customerData.name || customerData.phone);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Customer updated successfully",
        });
        setShowEditCustomerModal(false);
        setEditingCustomer(null);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data?.message || "Failed to update customer",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update customer",
      });
    } finally {
      setIsUpdatingCustomer(false);
    }
  };

  const handleEditStore = (store) => {
    setEditingStore(store);
    setShowEditStoreModal(true);
  };

  const handleUpdateStore = async (storeData) => {
    if (isUpdatingStore) return;

    setIsUpdatingStore(true);
    try {
      const response = await apiClient.put(`/store/${editingStore.id}`, {
        ...storeData,
        user_id: parseInt(getUserId()),
      });

      if (response.data?.status === true) {
        await fetchStores(getUserId(), "");
        setFormData((prev) => ({ ...prev, store_id: editingStore.id }));
        setStoreSearch(storeData.name);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Store updated successfully",
        });
        setShowEditStoreModal(false);
        setEditingStore(null);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data?.message || "Failed to update store",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update store",
      });
    } finally {
      setIsUpdatingStore(false);
    }
  };

  // ============ TRANSFORM INVOICE DATA FOR PRINT TEMPLATES ============
  const transformInvoiceForTemplate = (invoice) => {
    if (!invoice) return null;

    const customerData = invoice.customer || {};
    const customerName = customerData.name ||
      invoice.customer_name ||
      invoice.customerName ||
      "Walk-in Customer";
    const customerPhone = customerData.phone ||
      invoice.customer_phone ||
      invoice.customerPhone ||
      "N/A";
    const customerEmail = customerData.email ||
      invoice.customer_email ||
      invoice.customerEmail ||
      "N/A";
    const customerAddress = customerData.address ||
      invoice.customer_address ||
      invoice.customerAddress ||
      "N/A";
    const customerGst = customerData.gst ||
      customerData.gst_number ||
      invoice.customer_gst ||
      invoice.customerGst ||
      "N/A";

    const storeData = invoice.store || {};
    const storeName = storeData.name ||
      invoice.store_name ||
      invoice.storeName ||
      "Your Store Name";
    const storeAddress = storeData.address ||
      invoice.store_address ||
      invoice.storeAddress ||
      "123 Business Street, City";
    const storeGst = storeData.gst ||
      storeData.gst_number ||
      invoice.store_gst ||
      invoice.storeGst ||
      "GSTIN123456";
    const storeEmail = storeData.email ||
      invoice.store_email ||
      invoice.storeEmail ||
      "store@business.com";
    const storePhone = storeData.mobile ||
      storeData.phone ||
      invoice.store_phone ||
      invoice.storePhone ||
      "123-456-7890";

    const items = invoice.items || invoice.invoice_items || [];
    const transformedItems = items.map(item => {
      const quantity = parseFloat(item.quantity || item.item_count || 1);
      const price = parseFloat(item.price || 0);
      const gst = parseFloat(item.gst || 0);
      const discount = parseFloat(item.discount || 0);

      let totalPrice = item.total_price || item.totalPrice || 0;
      if (!item.total_price && !item.totalPrice) {
        const basePrice = price * quantity;
        const discountAmount = basePrice * (discount / 100);
        const gstAmount = (basePrice - discountAmount) * (gst / 100);
        totalPrice = basePrice - discountAmount + gstAmount;
      }

      return {
        ...item,
        id: item.id || item.product_id,
        product_id: item.product_id,
        product_name: item.product_name || item.name || 'Product',
        product_code: item.product_code || item.sku || '',
        quantity: quantity,
        item_count: quantity,
        price: price,
        gst: gst,
        discount: discount,
        total_price: totalPrice,
        unit_name: item.unit_name || item.unit || 'pcs',
        product: {
          id: item.product_id,
          name: item.product_name || item.name || 'Product',
          sku: item.sku || item.product_code || '',
          brand: item.brand_name ? { name: item.brand_name } : null,
          category: item.category_name ? { name: item.category_name } : null,
          attributes: item.attributes || [],
          unit: item.unit_name ? { code: item.unit_name, name: item.unit_name } : null,
        },
        stock_quantity: item.stock_quantity || 0,
        stock_id: item.stock_id || null,
        variant_info: item.variant_info || null,
        original_gst_percentage: item.original_gst_percentage || gst,
      };
    });

    const packages = invoice.packages || [];
    const transformedPackages = packages.map(pkg => ({
      ...pkg,
      id: pkg.id || pkg.package_id,
      package_id: pkg.package_id || pkg.id,
      package_name: pkg.package_name || pkg.name || 'Package',
      package_price: parseFloat(pkg.package_price || pkg.price || 0),
      package_size: pkg.package_size || pkg.size || 'Standard',
      quantity: parseFloat(pkg.quantity || 1),
    }));

    let totalAmount = parseFloat(invoice.total_amount || invoice.totalAmount || 0);
    let paidAmount = parseFloat(invoice.paid_amount || invoice.paidAmount || 0);

    if (!totalAmount && transformedItems.length > 0) {
      totalAmount = transformedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      if (transformedPackages.length > 0) {
        totalAmount += transformedPackages.reduce((sum, pkg) => sum + (pkg.package_price * pkg.quantity), 0);
      }
    }

    return {
      id: invoice.id || invoice.invoice_id,
      invoice_id: invoice.invoice_id || invoice.id,
      invoice_number: invoice.invoice_number || invoice.invoice_id || `INV-${Date.now()}`,
      created_at: invoice.created_at || invoice.createdAt || new Date().toISOString(),
      invoice_date: invoice.invoice_date || invoice.created_at || new Date().toISOString(),

      customer_id: invoice.customer_id,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      customer_address: customerAddress,
      customer_gst: customerGst,

      customer: {
        id: invoice.customer_id,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
        gst: customerGst,
        gst_number: customerGst,
      },

      store_id: invoice.store_id,
      store_name: storeName,
      store_address: storeAddress,
      store_gst: storeGst,
      store_email: storeEmail,
      store_phone: storePhone,
      store_logo: invoice.store_logo || invoice.storeLogo,
      bank_qr: invoice.bank_qr || invoice.bankQr,

      store: {
        id: invoice.store_id,
        name: storeName,
        address: storeAddress,
        gst: storeGst,
        gst_number: storeGst,
        email: storeEmail,
        phone: storePhone,
        mobile: storePhone,
        logo: invoice.store_logo || invoice.storeLogo,
        bank_qr: invoice.bank_qr || invoice.bankQr,
      },

      total_amount: totalAmount,
      paid_amount: paidAmount,
      payment_method: invoice.payment_method || invoice.paymentMode || "Cash",
      payment_status: invoice.payment_status || "paid",
      payment_mode: invoice.payment_method || invoice.paymentMode || "Cash",

      items: transformedItems,
      invoice_items: transformedItems,
      packages: transformedPackages,

      hasStockPermission: invoice.hasStockPermission || false,
    };
  };

  // ============ PRINT HANDLERS ============

  const handlePrintA4 = async () => {
    if (isPrinting) return;
    setIsPrinting(true);

    try {
      const invoiceData = createdInvoiceData || await getInvoiceById(invoiceId);

      if (!invoiceData) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invoice data not found',
        });
        setIsPrinting(false);
        return;
      }

      const transformedInvoice = transformInvoiceForTemplate(invoiceData);
      const html = generateA4InvoiceHTML(transformedInvoice, false);

      await printAsync({
        html: html,
        width: 794,
        height: 1123,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'A4 Invoice printed successfully',
      });

      setTimeout(() => {
        setShowInvoiceSuccess(false);
        navigation.goBack();
      }, 1000);

    } catch (error) {
      console.error('Print A4 error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to print A4 invoice',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintThermal = async () => {
    if (isPrinting) return;
    setIsPrinting(true);

    try {
      const invoiceData = createdInvoiceData || await getInvoiceById(invoiceId);

      if (!invoiceData) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invoice data not found',
        });
        setIsPrinting(false);
        return;
      }

      const transformedInvoice = transformInvoiceForTemplate(invoiceData);
      const html = generateThermalInvoiceHTML(transformedInvoice, false);

      await printAsync({
        html: html,
        width: 288,
        height: 'auto',
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Thermal Invoice printed successfully',
      });

      setTimeout(() => {
        setShowInvoiceSuccess(false);
        navigation.goBack();
      }, 1000);

    } catch (error) {
      console.error('Print thermal error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to print thermal invoice',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSaveAsPDF = async (type = 'a4') => {
    if (isPrinting) return;
    setIsPrinting(true);

    try {
      const invoiceData = createdInvoiceData || await getInvoiceById(invoiceId);

      if (!invoiceData) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invoice data not found',
        });
        setIsPrinting(false);
        return;
      }

      const transformedInvoice = transformInvoiceForTemplate(invoiceData);
      const html = type === 'a4'
        ? generateA4InvoiceHTML(transformedInvoice, false)
        : generateThermalInvoiceHTML(transformedInvoice, false);

      const { uri } = await printAsync({
        html: html,
        width: type === 'a4' ? 794 : 288,
        height: type === 'a4' ? 1123 : 'auto',
      });

      await shareAsync(uri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Invoice saved as PDF',
      });

    } catch (error) {
      console.error('Save PDF error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save PDF',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleInvoiceSuccess = (invoiceData) => {
    const selectedCustomer = customers.find(
      (c) => c.id.toString() === formData.customer_id
    );
    const selectedStore = stores.find(
      (s) => s.id.toString() === formData.store_id
    );

    const completeInvoiceData = {
      ...invoiceData,
      items: lineItems.map(item => ({
        ...item,
        total_price: item.total_price || calculateItemTotal(item.price, item.quantity, item.gst, item.discount),
      })),
      packages: lineItems
        .filter(item => item.is_package)
        .map(item => ({
          package_id: item.product_id,
          package_name: item.product_name,
          package_price: item.price,
          package_size: item.unit_name,
          quantity: item.quantity,
        })),
      total_amount: totals.totalAmount,
      paid_amount: effectivePaidAmount,
      payment_method: formData.payment_method,
      payment_status: formData.payment_status,
      customer: selectedCustomer,
      store: selectedStore,
      customer_name: selectedCustomer?.name || selectedCustomer?.customer_name || "Walk-in Customer",
      customer_phone: selectedCustomer?.phone || "N/A",
      customer_email: selectedCustomer?.email || "N/A",
      customer_address: selectedCustomer?.address || "N/A",
      customer_gst: selectedCustomer?.gst || "N/A",
      store_name: selectedStore?.name || selectedStore?.store_name || "Your Store Name",
      store_address: selectedStore?.address || "123 Business Street, City",
      store_gst: selectedStore?.gst || "GSTIN123456",
      store_email: selectedStore?.email || "store@business.com",
      store_phone: selectedStore?.mobile || selectedStore?.phone || "123-456-7890",
      hasStockPermission: hasStockPermission,
    };

    setCreatedInvoiceData(completeInvoiceData);
    setShowInvoiceSuccess(true);
  };

  // ============ IMPROVED SUBMIT WITH BETTER VALIDATION ============
  const handleSubmit = async () => {
    let validationErrors = [];

    if (!formData.customer_id) {
      validationErrors.push("Please select a customer");
    }

    if (!formData.store_id) {
      validationErrors.push("Please select a store");
    }

    if (lineItems.length === 0) {
      validationErrors.push("Please add at least one product or package");
    }

    if (!formData.payment_method) {
      validationErrors.push("Please select a payment method");
    }

    if (formData.payment_status === "semi_paid") {
      const paymentAmount = parseNumericValue(formData.payment_amount);
      if (!formData.payment_amount || paymentAmount <= 0) {
        validationErrors.push("Please enter a valid payment amount for partial payment");
      }
      if (paymentAmount > totals.totalAmount) {
        validationErrors.push(`Payment amount cannot exceed total amount (₹${totals.totalAmount.toFixed(2)})`);
      }
    }

    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join("\n• ");
      setValidationMessage(errorMessage);
      setShowValidationAlert(true);
      return;
    }

    if (hasStockPermission) {
      const stockIssues = lineItems.filter(
        (item) =>
          !item.is_package &&
          item.stock_quantity > 0 &&
          item.quantity > item.stock_quantity,
      );

      if (stockIssues.length > 0) {
        const issueMessages = stockIssues.map(
          (item) =>
            `${item.product_name}${item.variant_info ? ` (${item.variant_info})` : ""}: ${item.quantity} > ${item.stock_quantity} available`,
        );
        Toast.show({
          type: "error",
          text1: "⚠️ Stock Issues",
          text2: `${stockIssues.length} item(s) exceed available stock:\n• ${issueMessages.join("\n• ")}`,
          visibilityTime: 5000,
          position: "top",
        });
        return;
      }
    }

    const priceIssues = lineItems.filter((item) => {
      if (item.is_package) return false;
      const purchasePrice = item.purchase_price || 0;
      const sellingPrice = item.price || 0;
      return purchasePrice > 0 && sellingPrice < purchasePrice;
    });

    if (priceIssues.length > 0) {
      const issueMessages = priceIssues.map(
        (item) =>
          `${item.product_name}: ₹${item.price.toFixed(2)} < ₹${(item.purchase_price || 0).toFixed(2)}`,
      );
      Toast.show({
        type: "error",
        text1: "⚠️ Price Issues",
        text2: `${priceIssues.length} item(s) have price below purchase price:\n• ${issueMessages.join("\n• ")}`,
        visibilityTime: 5000,
        position: "top",
      });
      return;
    }

    const gstIssues = lineItems
      .filter((item) => !item.is_package)
      .filter((item) => {
        const originalGst = item.original_gst_percentage || 0;
        const currentGst = parseFloat(item.gst) || 0;
        return originalGst > 0 && currentGst < originalGst;
      });

    if (gstIssues.length > 0) {
      const issueMessages = gstIssues.map(
        (item) =>
          `${item.product_name}: ${item.gst}% < ${item.original_gst_percentage || 0}%`,
      );
      Toast.show({
        type: "error",
        text1: "⚠️ GST Issues",
        text2: `${gstIssues.length} item(s) have GST below the original GST percentage:\n• ${issueMessages.join("\n• ")}`,
        visibilityTime: 5000,
        position: "top",
      });
      return;
    }

    const productItems = lineItems.filter((item) => !item.is_package);
    const packageItems = lineItems.filter((item) => item.is_package);

    // Stock validation warning for edit mode
    if (isEdit && hasStockPermission) {
      const stockExceededItems = productItems.filter(
        (item) => item.stock_quantity !== undefined && item.stock_quantity < Infinity && item.quantity > item.stock_quantity
      );
      
      if (stockExceededItems.length > 0) {
        const itemNames = stockExceededItems.map(item => item.product_name).join(", ");
        Toast.show({
          type: "warning",
          text1: "⚠️ Stock Warning",
          text2: `${stockExceededItems.length} item(s) exceed available stock: ${itemNames}`,
          visibilityTime: 5000,
        });
        // Allow user to continue but warn them
      }
    }

    const packagesData = packageItems.map((item) => ({
      package_id: item.product_id,
      package_name: item.product_name,
      package_price: item.price,
      package_size: item.unit_name,
      quantity: item.quantity,
    }));

    let paidAmountValue = 0;
    if (formData.payment_status === "paid") {
      paidAmountValue = totals.totalAmount;
    } else if (formData.payment_status === "semi_paid") {
      const p = parseNumericValue(formData.payment_amount);
      paidAmountValue = Math.min(Math.max(0, p), totals.totalAmount);
    } else {
      paidAmountValue = 0;
    }

    const payload = {
      user_id: parseInt(getUserId()),
      customer_id: parseInt(formData.customer_id),
      store_id: parseInt(formData.store_id),
      paid_amount: paidAmountValue,
      payment_method: formData.payment_method,
      payment_status: formData.payment_status,
      created_by: parseInt(getUserId()),
      deleted_item_ids: deletedItemIds,
      items: productItems.map((l) => {
        const row = {
          product_id: l.product_id,
          unit_id: l.unit_id,
          quantity: parseFloat(l.quantity),
          price: parseFloat(l.price),
          gst: parseFloat(l.gst) || 0,
          discount: parseFloat(l.discount) || 0,
          stock_id: hasStockPermission ? l.stock_id : null,
        };
        if (l.id) row.id = l.id;
        return row;
      }),
      packages: packagesData,
      total_amount: totals.totalAmount,
    };

    setSubmitting(true);
    try {
      let result;
      if (isEdit && invoiceId) {
        // Check if packages were modified in edit mode
        const pkgSnapNow = JSON.stringify(
          lineItems
            .filter((l) => l.is_package)
            .map((m) => ({
              id: m.package_row_id,
              q: m.quantity,
              name: m.product_name,
            })),
        );
        const packagesDirty = pkgSnapNow !== initialPackageSnapshot.current;

        if (packagesDirty) {
          Toast.show({
            type: "info",
            text1: "ℹ️ Package Changes",
            text2: "Package lines were not saved to this invoice (only product lines update on the server).",
            visibilityTime: 4000,
          });
        }

        result = await updateInvoice(invoiceId, payload);
      } else {
        result = await createInvoice(payload);
      }

      if (result.success) {
        handleInvoiceSuccess(result.data);
      } else {
        console.error("Invoice creation failed:", result);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: result.error?.message || result.message || "Failed to save invoice",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || error.message || "Failed to save invoice",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}
      >
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
        />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text
          className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Loading data...
        </Text>
      </View>
    );
  }

  const selectedCustomer = customers.find(
    (c) => c.id.toString() === formData.customer_id,
  );
  const selectedStore = stores.find(
    (s) => s.id.toString() === formData.store_id,
  );

  const SectionHeader = ({ icon, title, rightComponent }) => (
    <View className="flex-row justify-between items-center mb-4">
      <View className="flex-row items-center">
        <View
          className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDarkMode ? "bg-blue-500/20" : "bg-blue-50"}`}
        >
          <Icon
            name={icon}
            size={18}
            color={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
        </View>
        <Text
          className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}
        >
          {title}
        </Text>
      </View>
      {rightComponent}
    </View>
  );

  const Card = ({ children, className = "" }) => (
    <View
      className={`mx-4 rounded-2xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"} ${className}`}
    >
      {children}
    </View>
  );

  // Render product item for modal
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleAddItem(item)}
      className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text
            className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {item.name}
          </Text>

          {hasStockPermission && item.variant_info && (
            <View className="flex-row items-center mt-1">
              <View
                className={`px-2 py-0.5 rounded ${isDarkMode ? "bg-blue-500/20" : "bg-blue-100"}`}
              >
                <Text
                  className={`text-xs ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}
                >
                  {item.variant_info}
                </Text>
              </View>
            </View>
          )}

          <Text
            className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-0.5`}
          >
            SKU: {item.sku || "N/A"}
          </Text>

          <View className="flex-row flex-wrap gap-1 mt-2">
            {item.brand?.name && (
              <View
                className={`px-2 py-0.5 rounded ${isDarkMode ? "bg-blue-500/20" : "bg-blue-100"}`}
              >
                <Text
                  className={`text-xs ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}
                >
                  {item.brand.name}
                </Text>
              </View>
            )}
            {item.category?.name && (
              <View
                className={`px-2 py-0.5 rounded ${isDarkMode ? "bg-purple-500/20" : "bg-purple-100"}`}
              >
                <Text
                  className={`text-xs ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}
                >
                  {item.category.name}
                </Text>
              </View>
            )}
          </View>

          {hasStockPermission && (
            <View className="mt-2">
              <Text
                className={`text-sm font-medium ${item.stock_quantity > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {item.stock_quantity > 0
                  ? `✓ ${item.stock_quantity} in stock`
                  : "✗ Out of stock"}
              </Text>
            </View>
          )}
        </View>

        <View className="items-end">
          <Text
            className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}
          >
            ₹{item.price.toFixed(2)}
          </Text>
          {item.gst_percentage > 0 && (
            <Text
              className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-0.5`}
            >
              GST: {item.gst_percentage.toFixed(1)}%
            </Text>
          )}
          {hasStockPermission && item.stock_id && (
            <View
              className={`mt-1 px-2 py-0.5 rounded ${isDarkMode ? "bg-green-500/20" : "bg-green-100"}`}
            >
              <Text
                className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-700"}`}
              >
                Stock Variant
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render line item using the memoized component
  const renderLineItem = ({ item, index }) => (
    <LineItemComponent
      key={`${item.is_package ? "p" : "i"}-${index}-${item.id || item.product_id}`}
      item={item}
      index={index}
      onUpdate={handleUpdateItem}
      onRemove={handleRemoveItem}
      isDarkMode={isDarkMode}
      hasStockPermission={hasStockPermission}
    />
  );

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
      />

      <Header
        title={isEdit ? "Edit Invoice" : "New Invoice"}
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Invoices"
        navigationItems={menuItems}
        showBackButton={true}
        rightComponent={
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className={`px-5 py-2.5 rounded-xl ${submitting ? "bg-gray-400" : "bg-blue-600"} shadow-sm`}
          >
            <View className="flex-row items-center">
              {submitting && <ActivityIndicator size="small" color="#ffffff" />}
              <Text
                className={`text-white font-semibold ${submitting ? "ml-2" : ""}`}
              >
                {submitting ? "Saving..." : "Save Invoice"}
              </Text>
            </View>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        enabled={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16, paddingBottom: 40 }}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            removeClippedSubviews={false}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
          >
            {/* QR Scanner Button */}
            <Card className="p-4 mb-3">
              <SectionHeader icon="qrcode-scan" title="Quick Add" />

              <TouchableOpacity
                onPress={async () => {
                  const hasPermission = await requestCameraPermission();
                  if (hasPermission) {
                    setShowQRScanner(true);
                  } else {
                    Toast.show({
                      type: 'error',
                      text1: 'Camera Permission Required',
                      text2: 'Please grant camera permission to scan QR codes.',
                    });
                  }
                }}
                className={`flex-row items-center justify-center rounded-xl py-4 px-6 ${isDarkMode ? "bg-blue-500/20 border border-blue-500/30" : "bg-blue-50 border border-blue-200"}`}
                activeOpacity={0.7}
              >
                <Icon
                  name="qrcode-scan"
                  size={28}
                  color={isDarkMode ? "#60A5FA" : "#2563EB"}
                />
                <Text
                  className={`ml-3 text-base font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                >
                  Scan QR Code to Add Product
                </Text>
                <Icon
                  name="chevron-right"
                  size={24}
                  color={isDarkMode ? "#60A5FA" : "#2563EB"}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              <Text
                className={`text-xs text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Scan product or stock QR codes to quickly add items
              </Text>
            </Card>

            {/* Customer Selection with Edit */}
            <Card className="p-4 mb-3">
              <SectionHeader icon="account" title="Customer Details" />

              <View className="relative">
                <SearchSelect
                  label="Customer"
                  options={customers.map((c) => ({
                    value: c.id.toString(),
                    label: c.name || c.customer_name || `Customer #${c.id}`,
                    description: c.phone ? `📱 ${c.phone}` : "",
                    subtext: c.email ? `✉️ ${c.email}` : "",
                    gst: c.gst,
                  }))}
                  value={formData.customer_id}
                  onSelect={handleCustomerSelect}
                  placeholder="Search customer by name, phone, or email..."
                  required={true}
                  isDarkMode={isDarkMode}
                  displayKey="label"
                  valueKey="value"
                  onCreateNew={handleCreateCustomerFromSearch}
                />

                {selectedCustomer && (
                  <TouchableOpacity
                    onPress={() => handleEditCustomer(selectedCustomer)}
                    className="absolute right-12 top-10"
                    style={{ zIndex: 10 }}
                  >
                    <Icon
                      name="pencil"
                      size={20}
                      color={isDarkMode ? "#60A5FA" : "#3B82F6"}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Card>

            {/* Store Selection with Edit */}
            <Card className="p-4 mb-3">
              <SectionHeader
                icon="store"
                title="Store Information"
                rightComponent={
                  stores.length === 0 && (
                    <TouchableOpacity
                      onPress={() => setShowAddStoreModal(true)}
                      className="flex-row items-center px-3 py-1.5 bg-green-500 rounded-lg"
                    >
                      <Icon name="plus" size={16} color="#ffffff" />
                      <Text className="text-white text-sm ml-1 font-medium">
                        Add New
                      </Text>
                    </TouchableOpacity>
                  )
                }
              />

              {stores.length === 1 && !isEdit && (
                <View
                  className={`mb-3 p-3 rounded-xl ${isDarkMode ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 border border-green-200"}`}
                >
                  <View className="flex-row items-center">
                    <Icon name="check-circle" size={18} color="#22c55e" />
                    <Text
                      className={`ml-2 text-sm font-medium ${isDarkMode ? "text-green-400" : "text-green-700"}`}
                    >
                      Store automatically selected
                    </Text>
                  </View>
                  <Text
                    className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {stores[0]?.name || stores[0]?.store_name || "Store"} will be
                    used for this invoice
                  </Text>
                </View>
              )}

              <View className="relative">
                <SearchSelect
                  label="Store"
                  options={stores.map((s) => ({
                    value: s.id.toString(),
                    label: s.name || s.store_name || `Store #${s.id}`,
                    description: s.address ? `📍 ${s.address}` : "",
                    subtext:
                      s.mobile || s.phone ? `📱 ${s.mobile || s.phone}` : "",
                    email: s.email,
                    gst: s.gst,
                  }))}
                  value={formData.store_id}
                  onSelect={handleStoreSelect}
                  placeholder="Search store by name, phone, or email..."
                  required={true}
                  isDarkMode={isDarkMode}
                  displayKey="label"
                  valueKey="value"
                  onCreateNew={
                    stores.length === 0 ? handleCreateStoreFromSearch : undefined
                  }
                />

                {selectedStore && (
                  <TouchableOpacity
                    onPress={() => handleEditStore(selectedStore)}
                    className="absolute right-12 top-10"
                    style={{ zIndex: 10 }}
                  >
                    <Icon
                      name="pencil"
                      size={20}
                      color={isDarkMode ? "#60A5FA" : "#3B82F6"}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {stores.length === 0 && (
                <Text
                  className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  No stores found. Please add a store to create invoices.
                </Text>
              )}
            </Card>

            {/* Package Selection */}
            <Card className="p-4 mb-3">
              <SectionHeader icon="package-variant" title="Add Packages" />

              <View className="relative">
                <SearchSelect
                  label="Packages"
                  options={packages.map((pkg) => ({
                    value: pkg.id.toString(),
                    label: pkg.package_name || `Package #${pkg.id}`,
                    description: pkg.package_size
                      ? `📦 Size: ${pkg.package_size}`
                      : "",
                    subtext: pkg.package_price
                      ? `💰 ₹${parseFloat(pkg.package_price || 0).toFixed(2)}`
                      : "",
                  }))}
                  value={selectedPackage?.id?.toString() || ""}
                  onSelect={(value, option) => {
                    const pkg = packages.find((p) => p.id.toString() === value);
                    if (pkg) {
                      handlePackageSelect(pkg);
                    }
                  }}
                  placeholder="Search packages by name, size, or price..."
                  isDarkMode={isDarkMode}
                  displayKey="label"
                  valueKey="value"
                />

                {selectedPackage && (
                  <View
                    className={`mt-3 p-4 rounded-xl ${isDarkMode ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 border border-green-200"}`}
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text
                          className={`font-semibold text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
                        >
                          {selectedPackage.package_name}
                        </Text>
                        <Text
                          className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Size: {selectedPackage.package_size || "—"}
                        </Text>
                      </View>
                      <Text
                        className={`text-lg font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                      >
                        ₹
                        {parseFloat(selectedPackage.package_price || 0).toFixed(
                          2,
                        )}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-3">
                      <Text
                        className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                      >
                        Quantity:
                      </Text>
                      <View
                        className={`flex-row items-center rounded-lg px-1 ${isDarkMode ? "bg-gray-700" : "bg-white"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                      >
                        <TouchableOpacity
                          onPress={() =>
                            setPackageQuantity(Math.max(1, packageQuantity - 1))
                          }
                          className="p-2"
                        >
                          <Icon
                            name="minus"
                            size={20}
                            color={isDarkMode ? "#9ca3af" : "#6b7280"}
                          />
                        </TouchableOpacity>
                        <TextInput
                          className={`w-14 text-center font-medium text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
                          value={packageQuantity.toString()}
                          onChangeText={(value) => {
                            const sanitized = sanitizeNumericInput(value, false, 0);
                            const num = parseNumericValue(sanitized);
                            setPackageQuantity(Math.max(1, num));
                          }}
                          keyboardType="number-pad"
                          blurOnSubmit={true}
                          returnKeyType="done"
                          keyboardShouldPersistTaps="handled"
                          textContentType="none"
                          autoComplete="off"
                        />
                        <TouchableOpacity
                          onPress={() => setPackageQuantity(packageQuantity + 1)}
                          className="p-2"
                        >
                          <Icon
                            name="plus"
                            size={20}
                            color={isDarkMode ? "#9ca3af" : "#6b7280"}
                          />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={handleAddPackageToInvoice}
                        className="flex-1 flex-row items-center justify-center px-4 py-2.5 bg-blue-600 rounded-xl"
                        disabled={packageQuantity <= 0}
                      >
                        <Icon name="plus" size={18} color="#ffffff" />
                        <Text className="text-white font-semibold ml-2">
                          Add Package
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </Card>

            {/* Product Search - Opens Modal */}
            <Card className="p-4 mb-3">
              <SectionHeader icon="cart-plus" title="Add Products" />

              <TouchableOpacity
                onPress={handleProductSearch}
                className={`flex-row items-center rounded-xl px-4 py-4 border ${isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
                activeOpacity={0.7}
              >
                <Icon
                  name="magnify"
                  size={24}
                  color={isDarkMode ? "#9ca3af" : "#6b7280"}
                />
                <Text
                  className={`flex-1 ml-3 text-base ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Tap to search and add products...
                </Text>
                <Icon
                  name="arrow-right"
                  size={20}
                  color={isDarkMode ? "#9ca3af" : "#6b7280"}
                />
              </TouchableOpacity>

              {lineItems.filter((item) => !item.is_package).length > 0 && (
                <View
                  className={`mt-3 p-3 rounded-xl ${isDarkMode ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-200"}`}
                >
                  <Text
                    className={`text-sm ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}
                  >
                    {lineItems.filter((item) => !item.is_package).length}{" "}
                    product(s) added
                  </Text>
                </View>
              )}
            </Card>

            {/* Line Items - Using memoized component with local state */}
            <Card className="p-4 mb-3">
              <SectionHeader
                icon="format-list-bulleted"
                title={`Invoice Items (${lineItems.length})`}
              />

              {lineItems.length === 0 ? (
                <View className="py-8 items-center">
                  <Icon
                    name="cart-outline"
                    size={56}
                    color={isDarkMode ? "#4b5563" : "#D1D5DB"}
                  />
                  <Text
                    className={`text-base mt-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No items added yet
                  </Text>
                  <Text
                    className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                  >
                    Tap "Add Products" above to search and add
                  </Text>
                </View>
              ) : (
                <View>
                  {lineItems.map((item, index) => (
                    <LineItemComponent
                      key={`${item.is_package ? "p" : "i"}-${index}-${item.id || item.product_id}`}
                      item={item}
                      index={index}
                      onUpdate={handleUpdateItem}
                      onRemove={handleRemoveItem}
                      isDarkMode={isDarkMode}
                      hasStockPermission={hasStockPermission}
                    />
                  ))}
                </View>
              )}
            </Card>

            {/* Payment Settings - FIXED WITH MEMOIZED COMPONENT */}
            <Card className="p-4 mb-3">
              <SectionHeader icon="credit-card" title="Payment Settings" />

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Payment Method
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {["Cash", "Card", "UPI", "Bank Transfer", "Cheque"].map(
                    (method) => (
                      <TouchableOpacity
                        key={method}
                        onPress={() =>
                          setFormData({ ...formData, payment_method: method })
                        }
                        className={`px-4 py-2.5 rounded-xl border ${
                          formData.payment_method === method
                            ? "border-blue-500 bg-blue-500/10"
                            : isDarkMode
                              ? "border-gray-600 bg-gray-700"
                              : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            formData.payment_method === method
                              ? "text-blue-500"
                              : isDarkMode
                                ? "text-gray-300"
                                : "text-gray-600"
                          }`}
                        >
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Payment Status
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { value: "paid", label: "Paid", color: "green" },
                    { value: "non_paid", label: "Unpaid", color: "red" },
                    { value: "semi_paid", label: "Partial", color: "orange" },
                  ].map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() =>
                        setFormData({ ...formData, payment_status: status.value })
                      }
                      className={`flex-1 py-3 rounded-xl border ${
                        formData.payment_status === status.value
                          ? `border-${status.color}-500 bg-${status.color}-500/10`
                          : isDarkMode
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-sm text-center font-medium ${
                          formData.payment_status === status.value
                            ? `text-${status.color}-500`
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
                <View>
                  <Text
                    className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                  >
                    Payment Amount
                  </Text>
                  <PaymentAmountInput
                    initialValue={formData.payment_amount}
                    onAmountChange={handlePaymentAmountChange}
                    isDarkMode={isDarkMode}
                    maxAmount={totals.totalAmount}
                  />
                </View>
              )}
            </Card>

            {/* Summary - Improved Design */}
            <Card className="p-4 mb-3">
              <SectionHeader icon="calculator" title="Invoice Summary" />

              <View className="space-y-2">
                <View className="flex-row justify-between py-2">
                  <Text
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Subtotal
                  </Text>
                  <Text
                    className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    ₹{totals.subtotal.toFixed(2)}
                  </Text>
                </View>

                {totals.totalDiscount > 0 && (
                  <View className="flex-row justify-between py-2 border-b border-dashed" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Discount
                    </Text>
                    <Text className={`text-sm font-medium text-green-600`}>
                      -₹{totals.totalDiscount.toFixed(2)}
                    </Text>
                  </View>
                )}

                {totals.totalGst > 0 && (
                  <View className="flex-row justify-between py-2 border-b border-dashed" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      GST
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                    >
                      ₹{totals.totalGst.toFixed(2)}
                    </Text>
                  </View>
                )}

                {totals.packageTotal > 0 && (
                  <View className="flex-row justify-between py-2 border-b border-dashed" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Package Total
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                    >
                      ₹{totals.packageTotal.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View
                  className="flex-row justify-between items-center py-4 mt-2 border-t-2 border-dashed"
                  style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}
                >
                  <Text
                    className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    Grand Total
                  </Text>
                  <Text
                    className={`text-xl font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                  >
                    ₹{totals.totalAmount.toFixed(2)}
                  </Text>
                </View>

                {formData.payment_status !== "non_paid" && (
                  <View
                    className="flex-row justify-between py-2"
                    style={{ borderTopColor: isDarkMode ? "#374151" : "#e5e7eb" }}
                  >
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Paid Amount
                    </Text>
                    <Text className={`text-sm font-medium text-green-600`}>
                      ₹{effectivePaidAmount.toFixed(2)}
                    </Text>
                  </View>
                )}

                {formData.payment_status !== "paid" &&
                  effectivePaidAmount < totals.totalAmount && (
                    <View className="flex-row justify-between py-2 bg-red-500/10 rounded-lg px-3">
                      <Text
                        className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Balance Due
                      </Text>
                      <Text className={`text-sm font-bold text-red-600`}>
                        ₹{dueAfterPayment.toFixed(2)}
                      </Text>
                    </View>
                  )}
              </View>
            </Card>

            {/* Bottom Action Button - Improved Design */}
            <View className="px-4 mt-2 mb-4">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className={`w-full py-4 rounded-2xl shadow-lg ${submitting ? "bg-gray-400" : "bg-blue-600"} flex-row items-center justify-center`}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="content-save" size={24} color="#ffffff" />
                    <Text className="text-white font-bold text-lg ml-2">
                      {isEdit ? "Update Invoice" : "Create Invoice"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowQRScanner(false);
          setQrScanningEnabled(true);
          setScannerLoading(false);
        }}
      >
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-black"}`}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />

          <View className="flex-1">
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              onBarcodeScanned={({ data }) => {
                if (data && qrScanningEnabled && !scannerLoading) {
                  handleQRScanResult(data);
                }
              }}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
              }}
            >
              <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/50">
                <View className="flex-1" />
                <View className="flex-row">
                  <View className="flex-1" />
                  <View className="w-72 h-72 border-2 border-blue-500 rounded-xl bg-transparent relative">
                    <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                    <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                    <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                    <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                    <View className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 animate-pulse" style={{
                      shadowColor: '#3b82f6',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                      elevation: 5
                    }} />
                  </View>
                  <View className="flex-1" />
                </View>
                <View className="flex-1 items-center justify-center">
                  <Text className="text-white text-base font-medium mb-2">
                    Scan QR Code
                  </Text>
                  <Text className="text-gray-300 text-sm text-center px-8">
                    Position the QR code within the frame to scan
                  </Text>
                  {scannerLoading && (
                    <View className="mt-4 flex-row items-center">
                      <ActivityIndicator size="small" color="#3b82f6" />
                      <Text className="text-blue-400 ml-2">Processing...</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setShowQRScanner(false);
                      setQrScanningEnabled(true);
                      setScannerLoading(false);
                    }}
                    className="mt-8 px-8 py-3 bg-red-500 rounded-xl"
                  >
                    <Text className="text-white font-semibold">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CameraView>
          </View>
        </View>
      </Modal>

      {/* Product Search Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowProductModal(false);
          setProductModalSearch("");
          setFilteredModalProducts([]);
          setIsLoadingModalProducts(false);
        }}
      >
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <StatusBar
            barStyle={isDarkMode ? "light-content" : "dark-content"}
            backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
          />

          <View
            className={`px-4 py-3 ${isDarkMode ? "bg-gray-800" : "bg-white"} border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  setShowProductModal(false);
                  setProductModalSearch("");
                  setFilteredModalProducts([]);
                  setIsLoadingModalProducts(false);
                }}
                className="p-2"
              >
                <Icon
                  name="arrow-left"
                  size={24}
                  color={isDarkMode ? "#9ca3af" : "#6b7280"}
                />
              </TouchableOpacity>
              <Text
                className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Add Products
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View
              className={`flex-row items-center rounded-xl px-4 py-3 mt-3 border ${isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
            >
              <Icon
                name="magnify"
                size={20}
                color={isDarkMode ? "#9ca3af" : "#6b7280"}
              />
              <TextInput
                className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
                placeholder="Search products by name, SKU, brand, or category..."
                placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                value={productModalSearch}
                onChangeText={handleModalProductSearch}
                autoFocus={true}
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
                blurOnSubmit={true}
                keyboardShouldPersistTaps="handled"
                textContentType="none"
                autoComplete="off"
              />
              {isLoadingModalProducts && (
                <ActivityIndicator size="small" color="#3b82f6" />
              )}
              {productModalSearch.length > 0 && !isLoadingModalProducts && (
                <TouchableOpacity
                  onPress={() => {
                    setProductModalSearch("");
                    setFilteredModalProducts([]);
                    setIsLoadingModalProducts(false);
                  }}
                  className="ml-2"
                >
                  <Icon
                    name="close-circle"
                    size={18}
                    color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isLoadingModalProducts ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text
                className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Searching products...
              </Text>
            </View>
          ) : filteredModalProducts.length > 0 ? (
            <FlatList
              data={filteredModalProducts}
              renderItem={renderProductItem}
              keyExtractor={(item, index) =>
                `${item.id}-${item.stock_id || index}`
              }
              contentContainerStyle={{ paddingVertical: 8 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            />
          ) : productModalSearch.trim() !== "" ? (
            <View className="flex-1 items-center justify-center px-8">
              <Icon
                name="cart-search"
                size={64}
                color={isDarkMode ? "#4b5563" : "#9ca3af"}
              />
              <Text
                className={`text-center text-lg mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                No products found
              </Text>
              <Text
                className={`text-center text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                Try searching with different keywords
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <Icon
                name="cart-plus"
                size={64}
                color={isDarkMode ? "#4b5563" : "#9ca3af"}
              />
              <Text
                className={`text-center text-lg mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Search for products
              </Text>
              <Text
                className={`text-center text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                Type in the search box above to find products
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Invoice Success Dialog */}
      <Modal
        visible={showInvoiceSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvoiceSuccess(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowInvoiceSuccess(false)}
          className="flex-1 bg-black/50 justify-center items-center px-4"
        >
          <View
            className={`rounded-2xl p-6 w-full max-w-sm ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-xl`}
          >
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mb-3">
                <Icon name="check-circle" size={32} color="#22c55e" />
              </View>
              <Text
                className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                Invoice Generated Successfully!
              </Text>
              <Text
                className={`text-sm text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Invoice #{createdInvoiceData?.invoice_number || createdInvoiceData?.id || 'N/A'}
                for ₹{createdInvoiceData?.total_amount?.toFixed(2) || '0.00'}
              </Text>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={handlePrintA4}
                disabled={isPrinting}
                className="w-full py-3.5 bg-blue-600 rounded-xl flex-row items-center justify-center"
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="printer" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold ml-2">
                      🖨️ Print A4 Invoice
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePrintThermal}
                disabled={isPrinting}
                className="w-full py-3.5 bg-gray-600 rounded-xl flex-row items-center justify-center"
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="printer" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold ml-2">
                      🧾 Print Thermal Receipt
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSaveAsPDF('a4')}
                disabled={isPrinting}
                className="w-full py-3.5 bg-green-600 rounded-xl flex-row items-center justify-center"
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="file-pdf-box" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold ml-2">
                      📄 Save as PDF
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowInvoiceSuccess(false);
                  navigation.goBack();
                }}
                className="w-full py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl flex-row items-center justify-center"
              >
                <Text
                  className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Skip Print
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        visible={showAddCustomerModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddCustomerModal(false);
          setNewCustomerData({
            name: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            gst: "",
          });
        }}
      >
        <View className="flex-1 bg-black/50">
          <View
            className={`flex-1 mt-16 rounded-t-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <View
              className="p-4 border-b"
              style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}
            >
              <View className="flex-row justify-between items-center">
                <Text
                  className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Add New Customer
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddCustomerModal(false);
                    setNewCustomerData({
                      name: "",
                      email: "",
                      phone: "",
                      address: "",
                      city: "",
                      gst: "",
                    });
                  }}
                  className="p-2 rounded-lg bg-gray-500/10"
                >
                  <Icon
                    name="close"
                    size={24}
                    color={isDarkMode ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter customer name"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newCustomerData.name}
                  onChangeText={(value) =>
                    setNewCustomerData({ ...newCustomerData, name: value })
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Phone
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter phone number"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newCustomerData.phone}
                  onChangeText={(value) =>
                    setNewCustomerData({ ...newCustomerData, phone: value })
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Email
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter email address"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newCustomerData.email}
                  onChangeText={(value) =>
                    setNewCustomerData({ ...newCustomerData, email: value })
                  }
                  keyboardType="email-address"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Address
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter address"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newCustomerData.address}
                  onChangeText={(value) =>
                    setNewCustomerData({ ...newCustomerData, address: value })
                  }
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  City
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter city"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newCustomerData.city}
                  onChangeText={(value) =>
                    setNewCustomerData({ ...newCustomerData, city: value })
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  GST Number
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter GST number"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newCustomerData.gst}
                  onChangeText={(value) =>
                    setNewCustomerData({ ...newCustomerData, gst: value })
                  }
                />
              </View>
            </ScrollView>

            <View
              className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
            >
              <TouchableOpacity
                onPress={handleCreateCustomer}
                disabled={isCreatingCustomer}
                className="w-full py-4 bg-blue-600 rounded-xl shadow-lg flex-row items-center justify-center"
              >
                {isCreatingCustomer ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="plus" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold text-center text-lg ml-2">
                      Create Customer
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        visible={showEditCustomerModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEditCustomerModal(false);
          setEditingCustomer(null);
        }}
      >
        <View className="flex-1 bg-black/50">
          <View
            className={`flex-1 mt-16 rounded-t-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <View
              className="p-4 border-b"
              style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}
            >
              <View className="flex-row justify-between items-center">
                <Text
                  className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Edit Customer
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowEditCustomerModal(false);
                    setEditingCustomer(null);
                  }}
                  className="p-2 rounded-lg bg-gray-500/10"
                >
                  <Icon
                    name="close"
                    size={24}
                    color={isDarkMode ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter customer name"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingCustomer?.name || ""}
                  onChangeText={(value) =>
                    setEditingCustomer((prev) => ({ ...prev, name: value }))
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Phone
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter phone number"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingCustomer?.phone || ""}
                  onChangeText={(value) =>
                    setEditingCustomer((prev) => ({ ...prev, phone: value }))
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Email
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter email address"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingCustomer?.email || ""}
                  onChangeText={(value) =>
                    setEditingCustomer((prev) => ({ ...prev, email: value }))
                  }
                  keyboardType="email-address"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Address
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter address"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingCustomer?.address || ""}
                  onChangeText={(value) =>
                    setEditingCustomer((prev) => ({ ...prev, address: value }))
                  }
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  City
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter city"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingCustomer?.city || ""}
                  onChangeText={(value) =>
                    setEditingCustomer((prev) => ({ ...prev, city: value }))
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  GST Number
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter GST number"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingCustomer?.gst || ""}
                  onChangeText={(value) =>
                    setEditingCustomer((prev) => ({ ...prev, gst: value }))
                  }
                />
              </View>
            </ScrollView>

            <View
              className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
            >
              <TouchableOpacity
                onPress={() => handleUpdateCustomer(editingCustomer)}
                disabled={isUpdatingCustomer}
                className="w-full py-4 bg-blue-600 rounded-xl shadow-lg flex-row items-center justify-center"
              >
                {isUpdatingCustomer ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="content-save" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold text-center text-lg ml-2">
                      Update Customer
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Store Modal */}
      <Modal
        visible={showAddStoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddStoreModal(false);
          setNewStoreData({
            name: "",
            email: "",
            mobile: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            gst: "",
          });
        }}
      >
        <View className="flex-1 bg-black/50">
          <View
            className={`flex-1 mt-16 rounded-t-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <View
              className="p-4 border-b"
              style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}
            >
              <View className="flex-row justify-between items-center">
                <Text
                  className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Add New Store
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddStoreModal(false);
                    setNewStoreData({
                      name: "",
                      email: "",
                      mobile: "",
                      address: "",
                      city: "",
                      state: "",
                      pincode: "",
                      gst: "",
                    });
                  }}
                  className="p-2 rounded-lg bg-gray-500/10"
                >
                  <Icon
                    name="close"
                    size={24}
                    color={isDarkMode ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter store name"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newStoreData.name}
                  onChangeText={(value) =>
                    setNewStoreData({ ...newStoreData, name: value })
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Mobile
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter mobile number"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newStoreData.mobile}
                  onChangeText={(value) =>
                    setNewStoreData({ ...newStoreData, mobile: value })
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Email
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter email address"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newStoreData.email}
                  onChangeText={(value) =>
                    setNewStoreData({ ...newStoreData, email: value })
                  }
                  keyboardType="email-address"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Address
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter address"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newStoreData.address}
                  onChangeText={(value) =>
                    setNewStoreData({ ...newStoreData, address: value })
                  }
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  City
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter city"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newStoreData.city}
                  onChangeText={(value) =>
                    setNewStoreData({ ...newStoreData, city: value })
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  State
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter state"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newStoreData.state}
                  onChangeText={(value) =>
                    setNewStoreData({ ...newStoreData, state: value })
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Pincode
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter pincode"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newStoreData.pincode}
                  onChangeText={(value) =>
                    setNewStoreData({ ...newStoreData, pincode: value })
                  }
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  GST Number
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter GST number"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={newStoreData.gst}
                  onChangeText={(value) =>
                    setNewStoreData({ ...newStoreData, gst: value })
                  }
                />
              </View>
            </ScrollView>

            <View
              className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
            >
              <TouchableOpacity
                onPress={handleCreateStore}
                disabled={isCreatingStore || stores.length > 0}
                className={`w-full py-4 rounded-xl shadow-lg flex-row items-center justify-center ${stores.length > 0 ? "bg-gray-400" : "bg-purple-600"
                  }`}
              >
                {isCreatingStore ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="plus" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold text-center text-lg ml-2">
                      {stores.length > 0
                        ? "Store Already Exists"
                        : "Create Store"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {stores.length > 0 && (
                <Text
                  className={`text-sm text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  You already have a store. Only one store is allowed per user.
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Store Modal */}
      <Modal
        visible={showEditStoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEditStoreModal(false);
          setEditingStore(null);
        }}
      >
        <View className="flex-1 bg-black/50">
          <View
            className={`flex-1 mt-16 rounded-t-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <View
              className="p-4 border-b"
              style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}
            >
              <View className="flex-row justify-between items-center">
                <Text
                  className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Edit Store
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowEditStoreModal(false);
                    setEditingStore(null);
                  }}
                  className="p-2 rounded-lg bg-gray-500/10"
                >
                  <Icon
                    name="close"
                    size={24}
                    color={isDarkMode ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter store name"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingStore?.name || ""}
                  onChangeText={(value) =>
                    setEditingStore((prev) => ({ ...prev, name: value }))
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Mobile
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter mobile number"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingStore?.mobile || ""}
                  onChangeText={(value) =>
                    setEditingStore((prev) => ({ ...prev, mobile: value }))
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Email
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter email address"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingStore?.email || ""}
                  onChangeText={(value) =>
                    setEditingStore((prev) => ({ ...prev, email: value }))
                  }
                  keyboardType="email-address"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Address
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter address"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingStore?.address || ""}
                  onChangeText={(value) =>
                    setEditingStore((prev) => ({ ...prev, address: value }))
                  }
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  City
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter city"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingStore?.city || ""}
                  onChangeText={(value) =>
                    setEditingStore((prev) => ({ ...prev, city: value }))
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  State
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter state"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingStore?.state || ""}
                  onChangeText={(value) =>
                    setEditingStore((prev) => ({ ...prev, state: value }))
                  }
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Pincode
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter pincode"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingStore?.pincode || ""}
                  onChangeText={(value) =>
                    setEditingStore((prev) => ({ ...prev, pincode: value }))
                  }
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  GST Number
                </Text>
                <TextInput
                  className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} border ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  placeholder="Enter GST number"
                  placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                  value={editingStore?.gst || ""}
                  onChangeText={(value) =>
                    setEditingStore((prev) => ({ ...prev, gst: value }))
                  }
                />
              </View>
            </ScrollView>

            <View
              className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
            >
              <TouchableOpacity
                onPress={() => handleUpdateStore(editingStore)}
                disabled={isUpdatingStore}
                className="w-full py-4 bg-purple-600 rounded-xl shadow-lg flex-row items-center justify-center"
              >
                {isUpdatingStore ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="content-save" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold text-center text-lg ml-2">
                      Update Store
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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

      {/* Validation Alert Modal */}
      <InfoModal
        visible={showValidationAlert}
        title="⚠️ Validation Required"
        message={`Please fix the following issues:\n\n• ${validationMessage}`}
        onClose={() => setShowValidationAlert(false)}
        icon="alert-circle"
        iconColor="#f59e0b"
      />
    </View>
  );
};

export default InvoiceFormScreen;