import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const CustomerCard = ({ customer, onDelete, onDuePayment }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [showActions, setShowActions] = useState(false);
  const scaleValue = useState(new Animated.Value(1))[0];

  if (!customer) return null;

  const {
    id,
    name,
    email,
    phone,
    address,
    city,
    due_amount,
    total_purchases,
    total_paid,
    created_at,
    updated_at,
  } = customer;

  const handlePress = () => {
    navigation.navigate("CustomerDetail", { customerId: id });
  };

  const handleEdit = () => {
    setShowActions(false);
    navigation.navigate("AddCustomer", { customerId: id });
  };

  const handleAddDue = () => {
    setShowActions(false);
    if (onDuePayment) {
      // This would open a due payment modal in the parent
      onDuePayment(id, name);
    }
  };

  const handleDelete = () => {
    setShowActions(false);
    Alert.alert(
      "Delete Customer", 
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (onDelete) {
              const result = await onDelete(id);
              if (result?.success) {
                Alert.alert("Success", "Customer deleted successfully");
              } else {
                Alert.alert("Error", result?.error || "Failed to delete customer");
              }
            }
          },
        },
      ]
    );
  };

  const handleLongPress = () => {
    setShowActions(true);
  };

  // Generate consistent gradient based on customer name
  const getGradientColors = () => {
    const gradients = [
      ["#3b82f6", "#2563eb"], // Blue
      ["#8b5cf6", "#6d28d9"], // Purple
      ["#ec4899", "#be185d"], // Pink
      ["#f59e0b", "#b45309"], // Orange
      ["#10b981", "#047857"], // Green
      ["#ef4444", "#b91c1c"], // Red
      ["#6366f1", "#4f46e5"], // Indigo
      ["#14b8a6", "#0d9488"], // Teal
    ];
    
    // Use name to pick a consistent color
    const index = (name?.length || 0) % gradients.length;
    return gradients[index];
  };

  const gradientColors = getGradientColors();
  const hasDue = due_amount > 0;

  return (
    <>
      <TouchableOpacity
        className={`w-full rounded-2xl shadow-lg overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={gradientColors}
          className="p-4"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                <Icon name="account" size={24} color="#ffffff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                  {name}
                </Text>
                {phone && (
                  <Text className="text-white/80 text-xs" numberOfLines={1}>
                    {phone}
                  </Text>
                )}
              </View>
            </View>

            {/* Due Badge */}
            {hasDue && (
              <View className="bg-yellow-500/30 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-medium">
                  Due: ${due_amount?.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Body */}
        <View className="p-4">
          {/* Email and City */}
          {email && (
            <View className="flex-row items-center mb-2">
              <Icon name="email" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <Text
                className={`ml-2 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
                numberOfLines={1}
              >
                {email}
              </Text>
            </View>
          )}

          <View className="flex-row items-center mb-3">
            <Icon name="map-marker" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
            <Text
              className={`ml-2 text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
              numberOfLines={1}
            >
              {address}
              {city && `, ${city}`}
            </Text>
          </View>

          {/* Info Grid */}
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Total Purchases
              </Text>
              <Text className={`text-sm font-medium text-blue-500`}>
                ${total_purchases?.toFixed(2) || '0.00'}
              </Text>
            </View>

            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Total Paid
              </Text>
              <Text className={`text-sm font-medium text-green-500`}>
                ${total_paid?.toFixed(2) || '0.00'}
              </Text>
            </View>

            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Customer ID
              </Text>
              <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                #{id}
              </Text>
            </View>

            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Member Since
              </Text>
              <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {new Date(created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row mt-3 gap-2">
            {hasDue && (
              <TouchableOpacity
                onPress={handleAddDue}
                className="flex-1 bg-yellow-500 py-2 rounded-xl flex-row items-center justify-center"
              >
                <Icon name="cash-plus" size={16} color="#ffffff" />
                <Text className="text-white text-xs font-medium ml-1">Add Due</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleEdit}
              className={`flex-1 py-2 rounded-xl flex-row items-center justify-center ${
                hasDue ? 'bg-blue-500' : 'bg-blue-500'
              }`}
            >
              <Icon name="pencil" size={16} color="#ffffff" />
              <Text className="text-white text-xs font-medium ml-1">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowActions(false)}
        >
          <View className={`absolute bottom-0 left-0 right-0 rounded-t-3xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="items-center pt-2">
              <View className={`w-12 h-1 rounded-full ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`} />
            </View>

            <View className="p-5">
              <Text className={`text-lg font-semibold mb-4 text-center ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {name}
              </Text>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                }`}
                onPress={handleEdit}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <Icon name="pencil" size={22} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Edit Customer
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Modify customer details
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
                }`}
                onPress={handleAddDue}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                }`}>
                  <Icon name="cash-plus" size={22} color="#f59e0b" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Add Due Payment
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Add amount to customer's due
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl ${
                  isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                }`}
                onPress={handleDelete}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                }`}>
                  <Icon name="delete" size={22} color="#ef4444" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Delete Customer
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Remove from customers
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`mt-4 p-3 rounded-xl items-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                onPress={() => setShowActions(false)}
              >
                <Text className={`text-base font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default CustomerCard;