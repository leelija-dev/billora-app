import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const SellerCard = ({ seller, onEdit, onDelete }) => {
  const { isDarkMode } = useThemeStore();

  const dueAmount = parseFloat(seller.due_amount) || 0;
  const hasDue = dueAmount > 0;

  return (
    <TouchableOpacity
      className={`rounded-xl p-4 shadow-sm ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text
            className={`text-base font-semibold ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
            numberOfLines={1}
          >
            {seller.name}
          </Text>
          <Text
            className={`text-xs mt-1 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            #{seller.id}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => onEdit(seller)}
            className={`w-8 h-8 rounded-lg items-center justify-center ${
              isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
            }`}
          >
            <Icon name="pencil" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(seller)}
            className={`w-8 h-8 rounded-lg items-center justify-center ${
              isDarkMode ? "bg-red-900/30" : "bg-red-50"
            }`}
          >
            <Icon name="delete" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Info */}
      <View className="space-y-1 mb-3">
        {seller.phone && (
          <View className="flex-row items-center">
            <Icon name="phone" size={12} color="#9ca3af" />
            <Text
              className={`text-xs ml-2 flex-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
              numberOfLines={1}
            >
              {seller.phone}
            </Text>
          </View>
        )}
        {seller.email && (
          <View className="flex-row items-center">
            <Icon name="email" size={12} color="#9ca3af" />
            <Text
              className={`text-xs ml-2 flex-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
              numberOfLines={1}
            >
              {seller.email}
            </Text>
          </View>
        )}
        {seller.city && (
          <View className="flex-row items-center">
            <Icon name="map-marker" size={12} color="#9ca3af" />
            <Text
              className={`text-xs ml-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
              numberOfLines={1}
            >
              {seller.city}
            </Text>
          </View>
        )}
      </View>

      {/* Due Amount */}
      <View
        className={`px-3 py-2 rounded-lg ${
          hasDue
            ? isDarkMode
              ? "bg-orange-900/30"
              : "bg-orange-50"
            : isDarkMode
            ? "bg-green-900/30"
            : "bg-green-50"
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Icon
              name={hasDue ? "alert-circle" : "check-circle"}
              size={14}
              color={hasDue ? "#f97316" : "#22c55e"}
            />
            <Text
              className={`text-xs ml-1 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {hasDue ? "Due Amount" : "No Due"}
            </Text>
          </View>
          <Text
            className={`text-sm font-semibold ${
              hasDue ? "text-orange-500" : "text-green-500"
            }`}
          >
            ₹{dueAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* GST Badge */}
      {seller.gst_number && (
        <View className="mt-2">
          <View
            className={`flex-row items-center px-2 py-1 rounded-full self-start ${
              isDarkMode ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <Icon name="barcode" size={10} color="#9ca3af" />
            <Text
              className={`text-xs ml-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              GST Registered
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default SellerCard;
