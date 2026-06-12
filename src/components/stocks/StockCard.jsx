// components/stocks/StockCard.js
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Modal, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const StockCard = ({ stock, onEdit, onDelete, onAddQuantity }) => {
  const { isDarkMode } = useThemeStore();
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!stock) return null;

  const { id, product, quantity, selling_price, purchase_price, unit_id, created_at, updated_at, product_name } = stock;
  const productName = product?.name || product_name || 'Unknown Product';
  const productSku = product?.sku || '';
  const currentQuantity = parseInt(quantity) || 0;

  const getStockStatus = () => {
    if (currentQuantity <= 0) return { label: 'Out of Stock', color: '#ef4444', bg: '#fee2e2', icon: 'close-circle' };
    if (currentQuantity < 10) return { label: 'Low Stock', color: '#f59e0b', bg: '#fef3c7', icon: 'alert' };
    return { label: 'In Stock', color: '#10b981', bg: '#d1fae5', icon: 'check-circle' };
  };

  const status = getStockStatus();

  const handleEdit = () => {
    setShowActions(false);
    if (onEdit) onEdit(stock);
  };

  const handleAddQuantity = () => {
    setShowActions(false);
    if (onAddQuantity) onAddQuantity(stock);
  };

  const handleDeletePress = () => {
    setShowActions(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(stock);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert("Error", "Failed to delete stock");
    } finally {
      setDeleting(false);
    }
  };

  // Get gradient based on stock status
  const getGradientColors = () => {
    if (currentQuantity <= 0) return ["#ef4444", "#b91c1c"];
    if (currentQuantity < 10) return ["#f59e0b", "#b45309"];
    return ["#10b981", "#047857"];
  };

  const gradientColors = getGradientColors();

  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toFixed(2)}`;

  return (
    <>
      <TouchableOpacity
        className={`rounded-2xl overflow-hidden shadow-sm mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        onLongPress={() => setShowActions(true)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {/* Header with Gradient */}
        <LinearGradient colors={gradientColors} className="p-4" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View className="flex-row justify-between items-start">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                <Icon name="package-variant" size={24} color="#ffffff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                  {productName}
                </Text>
                {productSku && (
                  <Text className="text-white/80 text-xs" numberOfLines={1}>
                    SKU: {productSku}
                  </Text>
                )}
              </View>
            </View>

            {/* Status Badge */}
            <View className="px-2 py-1 rounded-full" style={{ backgroundColor: `${status.color}30` }}>
              <Text className="text-xs font-medium" style={{ color: status.color }}>
                {status.label}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Body */}
        <View className="p-4">
          {/* Quantity and Price */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Quantity</Text>
              <View className="flex-row items-baseline">
                <Text className={`text-2xl font-bold ${currentQuantity <= 0 ? 'text-red-500' : currentQuantity < 10 ? 'text-yellow-500' : isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {currentQuantity}
                </Text>
                <Text className={`ml-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>units</Text>
              </View>
            </View>
            <View>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Selling Price</Text>
              <Text className="text-xl font-bold text-green-500">{formatCurrency(selling_price)}</Text>
            </View>
          </View>

          {/* Info Grid */}
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Purchase Price</Text>
              <Text className={`text-sm font-medium ${purchase_price ? (isDarkMode ? 'text-gray-300' : 'text-gray-700') : 'text-gray-400'}`}>
                {purchase_price ? formatCurrency(purchase_price) : 'N/A'}
              </Text>
            </View>
            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Value</Text>
              <Text className="text-sm font-medium text-blue-500">{formatCurrency(currentQuantity * (selling_price || 0))}</Text>
            </View>
            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Product ID</Text>
              <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>#{stock.product_id}</Text>
            </View>
            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last Updated</Text>
              <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {new Date(updated_at || created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity onPress={handleEdit} className="flex-1 flex-row items-center justify-center py-2 mr-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Icon name="pencil" size={16} color="#3b82f6" />
              <Text className="text-blue-600 text-xs ml-1">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddQuantity} className="flex-1 flex-row items-center justify-center py-2 mx-1 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Icon name="plus-circle" size={16} color="#10b981" />
              <Text className="text-green-600 text-xs ml-1">Add Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeletePress} className="flex-1 flex-row items-center justify-center py-2 ml-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Icon name="delete" size={16} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Modal for Long Press */}
      <Modal visible={showActions} transparent animationType="slide" onRequestClose={() => setShowActions(false)}>
        <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={() => setShowActions(false)}>
          <View className={`absolute bottom-0 left-0 right-0 rounded-t-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="items-center pt-2">
              <View className={`w-12 h-1 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`} />
            </View>
            <View className="p-5">
              <Text className={`text-lg font-semibold mb-4 text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {productName}
              </Text>
              <TouchableOpacity className={`flex-row items-center p-4 rounded-xl mb-2 ${isDarkMode ? "bg-green-900/30" : "bg-green-50"}`} onPress={handleAddQuantity}>
                <View className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-green-900/50" : "bg-green-100"}`}>
                  <Icon name="plus-circle" size={22} color="#10b981" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Add Stock</Text>
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Increase quantity</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity className={`flex-row items-center p-4 rounded-xl mb-2 ${isDarkMode ? "bg-blue-900/30" : "bg-blue-50"}`} onPress={handleEdit}>
                <View className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-blue-900/50" : "bg-blue-100"}`}>
                  <Icon name="pencil" size={22} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Edit Stock</Text>
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Modify stock details</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity className={`flex-row items-center p-4 rounded-xl ${isDarkMode ? "bg-red-900/30" : "bg-red-50"}`} onPress={handleDeletePress}>
                <View className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-red-900/50" : "bg-red-100"}`}>
                  <Icon name="delete" size={22} color="#ef4444" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Delete Stock</Text>
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Remove from inventory</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity className={`mt-4 p-3 rounded-xl items-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`} onPress={() => setShowActions(false)}>
                <Text className={`text-base font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className={`rounded-2xl p-6 w-full max-w-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-3">
                <Icon name="alert-circle" size={32} color="#ef4444" />
              </View>
              <Text className={`text-lg font-semibold text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}>Delete Stock</Text>
              <Text className={`text-sm text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Are you sure you want to delete stock for "{productName}"? This action cannot be undone.
              </Text>
            </View>
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity onPress={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600">
                <Text className={`text-center font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} disabled={deleting} className="flex-1 py-3 rounded-xl bg-red-500 flex-row items-center justify-center">
                {deleting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text className="text-white text-center font-medium">Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default StockCard;