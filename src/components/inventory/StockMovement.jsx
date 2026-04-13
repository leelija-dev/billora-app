// components/inventory/StockMovement.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../store/themeStore';

// Static stock movements data
const STATIC_MOVEMENTS = {
  'PROD-001': [
    {
      id: 'MOV-001',
      type: 'in',
      quantity: 50,
      balance: 245,
      reason: 'Purchase order #PO-1234',
      reference: 'PO-1234',
      createdAt: '2024-03-15T10:30:00Z',
      createdBy: { name: 'John Doe' },
      location: 'Main Warehouse',
      unitPrice: 29.99,
    },
    {
      id: 'MOV-002',
      type: 'out',
      quantity: 25,
      balance: 195,
      reason: 'Sales order #ORD-001',
      reference: 'ORD-001',
      createdAt: '2024-03-14T14:20:00Z',
      createdBy: { name: 'John Doe' },
      location: 'Main Warehouse',
      unitPrice: 29.99,
    },
    {
      id: 'MOV-003',
      type: 'adjustment',
      quantity: 20,
      balance: 220,
      reason: 'Inventory count adjustment',
      reference: 'ADJ-001',
      createdAt: '2024-03-13T09:15:00Z',
      createdBy: { name: 'System' },
      location: 'Main Warehouse',
      unitPrice: 29.99,
    },
  ],
  'PROD-003': [
    {
      id: 'MOV-004',
      type: 'in',
      quantity: 100,
      balance: 134,
      reason: 'Initial stock',
      reference: 'INIT-001',
      createdAt: '2024-03-10T10:30:00Z',
      createdBy: { name: 'Admin' },
      location: 'Aisle C, Shelf 5',
      unitPrice: 89.99,
    },
    {
      id: 'MOV-005',
      type: 'out',
      quantity: 66,
      balance: 34,
      reason: 'Sales orders',
      reference: 'Multiple',
      createdAt: '2024-03-13T09:15:00Z',
      createdBy: { name: 'System' },
      location: 'Aisle C, Shelf 5',
      unitPrice: 89.99,
    },
  ],
};

// Product details for reference
const PRODUCT_DETAILS = {
  'PROD-001': {
    name: 'Classic White T-Shirt',
    sku: 'TS-WHT-001',
    currentStock: 245,
    minStock: 50,
    maxStock: 500,
    unitPrice: 29.99,
  },
  'PROD-003': {
    name: 'Leather Sneakers',
    sku: 'SN-BLK-009',
    currentStock: 34,
    minStock: 30,
    maxStock: 200,
    unitPrice: 89.99,
  },
};

const StockMovement = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useThemeStore();
  const productId = route.params?.productId;

  const [showAddForm, setShowAddForm] = useState(false);
  const [movementForm, setMovementForm] = useState({
    type: 'in',
    quantity: '',
    reason: '',
    reference: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Get product details
  const product = PRODUCT_DETAILS[productId] || {
    name: 'Unknown Product',
    sku: 'N/A',
    currentStock: 0,
  };

  // Get movements for this product
  const movements = useMemo(() => {
    return STATIC_MOVEMENTS[productId] || [];
  }, [productId]);

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!movementForm.quantity) {
      errors.quantity = 'Quantity is required';
    } else if (parseInt(movementForm.quantity) <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    if (!movementForm.reason) {
      errors.reason = 'Reason is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMovement = () => {
    if (!validateForm()) {
      return;
    }

    Alert.alert(
      'Success',
      'Stock movement added successfully',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowAddForm(false);
            setMovementForm({
              type: 'in',
              quantity: '',
              reason: '',
              reference: '',
            });
            setFormErrors({});
          },
        },
      ]
    );
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setMovementForm({
      type: 'in',
      quantity: '',
      reason: '',
      reference: '',
    });
    setFormErrors({});
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case 'in':
        return { 
          icon: 'arrow-down', 
          color: '#10B981', 
          bg: isDarkMode ? '#065F46' : '#D1FAE5' 
        };
      case 'out':
        return { 
          icon: 'arrow-up', 
          color: '#EF4444', 
          bg: isDarkMode ? '#7F1D1D' : '#FEE2E2' 
        };
      case 'adjustment':
        return { 
          icon: 'swap-vertical', 
          color: '#F59E0B', 
          bg: isDarkMode ? '#92400E' : '#FEF3C7' 
        };
      default:
        return { 
          icon: 'swap-horizontal', 
          color: '#6366F1', 
          bg: isDarkMode ? '#312E81' : '#EEF2FF' 
        };
    }
  };

  if (!productId) {
    return (
      <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />
        <View className={`flex-row items-center px-4 py-3 border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className={`w-10 h-10 rounded-2xl items-center justify-center ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            <Icon name="arrow-left" size={22} color={isDarkMode ? "#9CA3AF" : "#374151"} />
          </TouchableOpacity>
          <Text className={`flex-1 text-lg font-bold text-center ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Stock Movements
          </Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center p-4">
          <Icon name="package-variant" size={80} color={isDarkMode ? "#4B5563" : "#d1d5db"} />
          <Text className={`text-lg font-semibold mt-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            No Product Selected
          </Text>
          <Text className={`text-sm text-center mt-2 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Please select a product to view its stock movements
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}
      style={{ paddingBottom: 60 }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className={`w-10 h-10 rounded-2xl items-center justify-center ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}
        >
          <Icon name="arrow-left" size={22} color={isDarkMode ? "#9CA3AF" : "#374151"} />
        </TouchableOpacity>
        <Text className={`text-lg font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Stock Movements</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          className={`w-10 h-10 rounded-2xl items-center justify-center ${
            isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
          }`}
        >
          <Icon name="plus" size={22} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Info Card */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 mt-4 p-5 rounded-3xl"
          style={{
            shadowColor: "#6366F1",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
            borderRadius: 13,
          }}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center">
              <Icon name="package-variant" size={30} color="white" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white text-xl font-bold">{product.name}</Text>
              <Text className="text-white/80 text-sm mt-1">SKU: {product.sku}</Text>
            </View>
          </View>

          <View className="flex-row mt-4 pt-4 border-t border-white/20">
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-xs">Current Stock</Text>
              <Text className="text-white text-2xl font-bold">{product.currentStock}</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-xs">Min Stock</Text>
              <Text className="text-white text-2xl font-bold">{product.minStock}</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-xs">Max Stock</Text>
              <Text className="text-white text-2xl font-bold">{product.maxStock}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Add Movement Form */}
        {showAddForm && (
          <BlurView
            intensity={90}
            tint={isDarkMode ? "dark" : "light"}
            className="mx-4 mt-4 overflow-hidden rounded-3xl"
            style={{
              borderWidth: 1,
              borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)",
            }}
          >
            <View className={`p-5 ${
              isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
            }`}>
              <Text className={`font-bold text-lg mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Add Stock Movement
              </Text>

              {/* Movement Type Selector */}
              <View className="flex-row mb-4">
                <TouchableOpacity
                  onPress={() => setMovementForm(prev => ({ ...prev, type: 'in' }))}
                  className={`flex-1 py-3 rounded-l-xl items-center ${
                    movementForm.type === 'in' 
                      ? 'bg-green-500' 
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text className={movementForm.type === 'in' ? 'text-white' : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                    Stock In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMovementForm(prev => ({ ...prev, type: 'out' }))}
                  className={`flex-1 py-3 items-center ${
                    movementForm.type === 'out' 
                      ? 'bg-red-500' 
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text className={movementForm.type === 'out' ? 'text-white' : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                    Stock Out
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMovementForm(prev => ({ ...prev, type: 'adjustment' }))}
                  className={`flex-1 py-3 rounded-r-xl items-center ${
                    movementForm.type === 'adjustment' 
                      ? 'bg-orange-500' 
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text className={movementForm.type === 'adjustment' ? 'text-white' : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                    Adjustment
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quantity Input */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Quantity</Text>
                <View className={`flex-row items-center rounded-xl px-4 border ${
                  formErrors.quantity 
                    ? 'border-red-500' 
                    : isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}>
                  <Icon name="counter" size={20} color="#9ca3af" />
                  <TextInput
                    className={`flex-1 ml-3 py-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    placeholder="Enter quantity"
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9ca3af'}
                    keyboardType="number-pad"
                    value={movementForm.quantity}
                    onChangeText={(text) => {
                      setMovementForm(prev => ({ ...prev, quantity: text }));
                      if (formErrors.quantity) {
                        setFormErrors(prev => ({ ...prev, quantity: '' }));
                      }
                    }}
                  />
                </View>
                {formErrors.quantity && (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.quantity}</Text>
                )}
              </View>

              {/* Reason Input */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Reason</Text>
                <View className={`rounded-xl px-4 border ${
                  formErrors.reason 
                    ? 'border-red-500' 
                    : isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}>
                  <TextInput
                    className={`py-3 min-h-[80px] ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    placeholder="Enter reason for movement"
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9ca3af'}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={movementForm.reason}
                    onChangeText={(text) => {
                      setMovementForm(prev => ({ ...prev, reason: text }));
                      if (formErrors.reason) {
                        setFormErrors(prev => ({ ...prev, reason: '' }));
                      }
                    }}
                  />
                </View>
                {formErrors.reason && (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.reason}</Text>
                )}
              </View>

              {/* Reference Input */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Reference (Optional)</Text>
                <View className={`flex-row items-center rounded-xl px-4 border ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}>
                  <Icon name="tag" size={20} color="#9ca3af" />
                  <TextInput
                    className={`flex-1 ml-3 py-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    placeholder="PO number, invoice, etc."
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9ca3af'}
                    value={movementForm.reference}
                    onChangeText={(text) => setMovementForm(prev => ({ ...prev, reference: text }))}
                  />
                </View>
              </View>

              {/* Form Buttons */}
              <View className="flex-row mt-2">
                <TouchableOpacity
                  onPress={handleCancelForm}
                  className={`flex-1 py-3 rounded-xl mr-2 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`font-semibold text-center ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddMovement}
                  className="flex-1 ml-2"
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-3 rounded-xl"
                    style={{ borderRadius: 11 }}
                  >
                    <Text className="text-white font-semibold text-center">Add Movement</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        )}

        {/* Movements List */}
        <View className="px-4 mt-4 mb-8">
          <Text className={`font-bold text-lg mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Movement History</Text>

          {movements.length === 0 ? (
            <View className={`items-center justify-center py-12 rounded-3xl border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}>
              <Icon name="swap-horizontal" size={60} color={isDarkMode ? "#4B5563" : "#d1d5db"} />
              <Text className={`font-semibold mt-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>No Movements Yet</Text>
              <Text className={`text-sm text-center mt-2 px-8 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Add your first stock movement using the + button above
              </Text>
            </View>
          ) : (
            movements.map((movement, index) => {
              const movementIcon = getMovementIcon(movement.type);
              return (
                <BlurView
                  key={movement.id}
                  intensity={80}
                  tint={isDarkMode ? "dark" : "light"}
                  className="overflow-hidden rounded-2xl mb-3"
                  style={{
                    borderWidth: 1,
                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <View className={`p-4 ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
                  }`}>
                    <View className="flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: movementIcon.bg }}
                      >
                        <Icon
                          name={movementIcon.icon}
                          size={24}
                          color={movementIcon.color}
                        />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row justify-between items-start">
                          <Text className={`font-bold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {movement.type === 'in' ? 'Stock In' :
                             movement.type === 'out' ? 'Stock Out' : 'Adjustment'}
                          </Text>
                          <Text className={`text-xs ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {formatDate(movement.createdAt)}
                          </Text>
                        </View>

                        <View className="flex-row mt-2">
                          <View className="flex-1">
                            <Text className={`text-xs ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>Quantity</Text>
                            <Text
                              className={`font-bold ${
                                movement.type === 'in' 
                                  ? 'text-green-600' 
                                  : movement.type === 'out' 
                                    ? 'text-red-600' 
                                    : 'text-orange-600'
                              }`}
                            >
                              {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}
                              {movement.quantity} units
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className={`text-xs ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>Balance</Text>
                            <Text className={`font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {movement.balance} units
                            </Text>
                          </View>
                          {movement.unitPrice && (
                            <View className="flex-1">
                              <Text className={`text-xs ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>Value</Text>
                              <Text className={`font-bold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {formatCurrency(movement.quantity * movement.unitPrice)}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text className={`text-sm mt-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {movement.reason}
                        </Text>

                        <View className="flex-row items-center mt-2">
                          <Icon name="account" size={12} color="#9ca3af" />
                          <Text className={`text-xs ml-1 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {movement.createdBy.name}
                          </Text>
                          <Icon name="map-marker" size={12} color="#9ca3af" style={{ marginLeft: 12 }} />
                          <Text className={`text-xs ml-1 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {movement.location}
                          </Text>
                        </View>

                        {movement.reference && (
                          <View className="flex-row items-center mt-1">
                            <Icon name="tag" size={12} color="#9ca3af" />
                            <Text className={`text-xs ml-1 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              Ref: {movement.reference}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </BlurView>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StockMovement;