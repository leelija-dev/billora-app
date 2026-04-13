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

const BrandCard = ({ brand, onDelete, onUpdate }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [showActions, setShowActions] = useState(false);
  const scaleValue = useState(new Animated.Value(1))[0];

  if (!brand) return null;

  const {
    id,
    name,
    description,
    slug,
    is_active,
    created_at,
    updated_at,
    user_id,
    created_by
  } = brand;

  const handlePress = () => {
    navigation.navigate("BrandDetail", { brandId: id });
  };

  const handleEdit = () => {
    setShowActions(false);
    navigation.navigate("AddBrand", { brandId: id });
  };

  const handleDelete = () => {
    setShowActions(false);
    Alert.alert(
      "Delete Brand", 
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (onDelete) {
              const result = await onDelete(id);
              console.log('BrandCard: Delete result:', result);
              if (result?.success) {
                Alert.alert("Success", "Brand deleted successfully");
              } else {
                Alert.alert("Error", result?.error || "Failed to delete brand");
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

  // Generate consistent gradient based on brand name or ID
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
    
    const index = (id?.toString().length || name?.length || 0) % gradients.length;
    return gradients[index];
  };

  const gradientColors = getGradientColors();

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
                <Icon 
                  name={is_active ? "trademark" : "trademark"} 
                  size={24} 
                  color="#ffffff" 
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                  {name}
                </Text>
                {slug && (
                  <Text className="text-white/60 text-xs" numberOfLines={1}>
                    {slug}
                  </Text>
                )}
              </View>
            </View>

            {/* Status Badge */}
            <View className={`px-2 py-1 rounded-full ${
              is_active ? 'bg-green-500/30' : 'bg-red-500/30'
            }`}>
              <Text className="text-white text-xs font-medium">
                {is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Body */}
        <View className="p-4">
          {/* Description */}
          {description && (
            <View className="mb-3">
              <Text className={`text-xs mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Description
              </Text>
              <Text
                className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
                numberOfLines={2}
              >
                {description}
              </Text>
            </View>
          )}

          {/* Info Grid */}
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Brand ID
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
                Created By
              </Text>
              <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {created_by || `User #${user_id}`}
              </Text>
            </View>

            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Created
              </Text>
              <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {new Date(created_at).toLocaleDateString()}
              </Text>
            </View>

            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Last Updated
              </Text>
              <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {new Date(updated_at).toLocaleDateString()}
              </Text>
            </View>
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
                    Edit Brand
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Modify brand details
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'
                }`}
                onPress={() => {
                  setShowActions(false);
                  navigation.navigate("Products", { brandId: id });
                }}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'
                }`}>
                  <Icon name="package-variant" size={22} color="#8b5cf6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    View Products
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    See all products from this brand
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
                    Delete Brand
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Remove from brands
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

export default BrandCard;