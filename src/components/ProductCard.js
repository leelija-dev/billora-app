// components/ProductCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const ProductCard = ({ 
  product, 
  stock, 
  onPress, 
  onEdit, 
  onDelete 
}) => {
  return (
    <TouchableOpacity
      className="bg-white rounded-xl p-3.5 mb-3 shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
            {product.name}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            SKU: {product.sku || 'N/A'}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${product.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
          <Text className={`text-xs font-medium ${product.is_active ? 'text-green-700' : 'text-red-700'}`}>
            {product.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-1">
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-700 ml-1">
              ${(product.selling_price || 0).toFixed(2)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="cube-outline" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-700 ml-1">
              Stock: {stock}
            </Text>
          </View>
        </View>
        <View className="flex-row space-x-1.5">
          <TouchableOpacity
            onPress={onEdit}
            className="p-1.5 bg-blue-50 rounded-full"
          >
            <Feather name="edit-2" size={16} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            className="p-1.5 bg-red-50 rounded-full"
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;