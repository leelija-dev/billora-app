// components/stocks/AddStockModal.js
import { Modal, Text, TouchableOpacity, View, TextInput, ActivityIndicator } from "react-native";
import { useState } from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const AddStockModal = ({ visible, onClose, stock, onAddStock, isSubmitting, isDarkMode }) => {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  const handleAddStock = () => {
    const qty = parseInt(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }
    setError("");
    onAddStock(stock?.id, qty);
    setQuantity("");
  };

  const currentStock = parseInt(stock?.quantity) || 0;
  const newStockValue = currentStock + (parseInt(quantity) || 0);
  const productName = stock?.product?.name || stock?.product_name || 'Unknown Product';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={onClose}>
        <View className="flex-1 items-center justify-center px-4">
          <View className={`rounded-2xl p-6 w-full max-w-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-3">
                <Icon name="plus-circle" size={32} color="#10b981" />
              </View>
              <Text className={`text-lg font-semibold text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}>Add Stock Quantity</Text>
            </View>

            <View className={`p-3 rounded-xl mb-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Product: <Text className="font-semibold">{productName}</Text></Text>
              <Text className={`text-sm mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Current Stock: <Text className="font-semibold">{currentStock}</Text></Text>
            </View>

            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Quantity to Add</Text>
              <TextInput value={quantity} onChangeText={(text) => { setQuantity(text); setError(""); }} placeholder="Enter quantity" keyboardType="numeric" placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"} className={`rounded-xl px-4 py-3 ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"} ${error ? 'border border-red-500' : ''}`} />
              {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
            </View>

            {quantity && parseInt(quantity) > 0 && (
              <View className={`p-3 rounded-xl mb-4 ${isDarkMode ? "bg-green-900/20" : "bg-green-50"}`}>
                <Text className={`text-sm font-medium mb-1 ${isDarkMode ? "text-green-400" : "text-green-700"}`}>Stock Summary</Text>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Current: <Text className="font-semibold">{currentStock}</Text></Text>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Adding: <Text className="font-semibold text-green-600">+{parseInt(quantity)}</Text></Text>
                <Text className={`text-sm font-semibold mt-1 ${isDarkMode ? "text-green-400" : "text-green-700"}`}>New Stock: {newStockValue}</Text>
              </View>
            )}

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity onPress={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600">
                <Text className={`text-center font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddStock} disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-green-500 flex-row items-center justify-center">
                {isSubmitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text className="text-white text-center font-medium">Add Stock</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default AddStockModal;