// components/brands/BrandCard.js
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const BrandCard = ({ brand, onEdit, onDelete }) => {
  const { isDarkMode } = useThemeStore();
  const [showActions, setShowActions] = useState(false);

  if (!brand) return null;

  const { id, name, description, is_active, created_at, user_id, created_by } = brand;

  const handleEdit = () => {
    setShowActions(false);
    if (onEdit) {
      onEdit(brand);
    }
  };

  const handleDeletePress = () => {
    setShowActions(false);
    // Call the parent's delete handler which will open the screen's modal
    if (onDelete) {
      onDelete(brand);
    }
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
  const isActive = is_active === true || is_active === 1;

  return (
    <>
      <TouchableOpacity
        className={`rounded-2xl overflow-hidden shadow-sm mb-4 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
        onLongPress={() => setShowActions(true)}
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
                <Icon name="trademark" size={24} color="#ffffff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                  {name}
                </Text>
                <Text className="text-white/70 text-xs mt-0.5">ID: #{id}</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View
              className={`px-2 py-1 rounded-full ${
                isActive ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <Text className="text-white text-xs font-medium">
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Body */}
        <View className="p-4">
          {/* Description */}
          {description ? (
            <Text
              className={`text-sm leading-5 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
              numberOfLines={2}
            >
              {description}
            </Text>
          ) : (
            <Text
              className={`text-sm italic ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              No description
            </Text>
          )}

          {/* Footer with meta info and actions */}
          <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center">
              <Icon
                name="account"
                size={14}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
              <Text
                className={`text-xs ml-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                {created_by || `User ${user_id}`}
              </Text>
              <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />
              <Icon
                name="calendar"
                size={14}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
              <Text
                className={`text-xs ml-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                {new Date(created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View>
            <View className="flex-row pt-2 justify-between">
              {/* Edit Button */}
              <TouchableOpacity
                onPress={handleEdit}
                className="flex-1 p-2 rounded-lg mr-2 bg-blue-100 dark:bg-blue-900/30 items-center"
              >
                <Icon name="pencil" size={18} color="#3b82f6" />
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={handleDeletePress}
                className="flex-1 p-2 rounded-lg bg-red-100 dark:bg-red-900/30 items-center"
              >
                <Icon name="delete" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Modal for Long Press */}
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
          <View
            className={`absolute bottom-0 left-0 right-0 rounded-t-3xl ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="items-center pt-2">
              <View
                className={`w-12 h-1 rounded-full ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-300"
                }`}
              />
            </View>

            <View className="p-5">
              <Text
                className={`text-lg font-semibold mb-4 text-center ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {name}
              </Text>

              {/* Edit Option */}
              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                }`}
                onPress={handleEdit}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    isDarkMode ? "bg-blue-900/50" : "bg-blue-100"
                  }`}
                >
                  <Icon name="pencil" size={22} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Edit Brand
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Modify brand details
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Delete Option */}
              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  isDarkMode ? "bg-red-900/30" : "bg-red-50"
                }`}
                onPress={handleDeletePress}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    isDarkMode ? "bg-red-900/50" : "bg-red-100"
                  }`}
                >
                  <Icon name="delete" size={22} color="#ef4444" />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Delete Brand
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Remove from brands
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                className={`mt-4 p-3 rounded-xl items-center ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
                onPress={() => setShowActions(false)}
              >
                <Text
                  className={`text-base font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
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