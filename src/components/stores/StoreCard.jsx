// components/stores/StoreCard.js
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const StoreCard = ({ store, onEdit, onDelete, listView = false }) => {
  const { isDarkMode } = useThemeStore();
  const [showActions, setShowActions] = useState(false);

  if (!store) return null;

  const isActive = store.status === true || store.status === "active";

  if (listView) {
    return (
      <TouchableOpacity
        onLongPress={() => setShowActions(true)}
        delayLongPress={500}
        className={`mb-3 rounded-2xl overflow-hidden shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <LinearGradient
          colors={["#3b82f6", "#2563eb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-3"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                <Icon name="store" size={24} color="#ffffff" />
              </View>
              <View className="ml-3 flex-1">
                <Text
                  className="text-white font-semibold text-base"
                  numberOfLines={1}
                >
                  {store.name}
                </Text>
                <Text className="text-white/80 text-xs" numberOfLines={1}>
                  GST: {store.gst || "N/A"}
                </Text>
              </View>
            </View>
            <View
              className={`px-2 py-1 rounded-full ${isActive ? "bg-green-500" : "bg-gray-500"}`}
            >
              <Text className="text-white text-xs font-medium">
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View className="p-4">
          {store.email && (
            <View className="flex-row items-center mb-2">
              <Icon
                name="email"
                size={16}
                color={isDarkMode ? "#9CA3AF" : "#6b7280"}
              />
              <Text
                className={`ml-2 text-sm flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                numberOfLines={1}
              >
                {store.email}
              </Text>
            </View>
          )}
          {store.mobile && (
            <View className="flex-row items-center mb-2">
              <Icon
                name="phone"
                size={16}
                color={isDarkMode ? "#9CA3AF" : "#6b7280"}
              />
              <Text
                className={`ml-2 text-sm flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                {store.mobile}
              </Text>
            </View>
          )}
          {(store.address || store.city) && (
            <View className="flex-row items-center">
              <Icon
                name="map-marker"
                size={16}
                color={isDarkMode ? "#9CA3AF" : "#6b7280"}
              />
              <Text
                className={`ml-2 text-sm flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                numberOfLines={2}
              >
                {store.address}
                {store.city && `, ${store.city}`}
              </Text>
            </View>
          )}
          <View className="flex-row justify-end mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => onEdit(store)}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-2"
            >
              <Text className="text-blue-600 dark:text-blue-400 font-medium">
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(store)}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-xl"
            >
              <Text className="text-red-600 dark:text-red-400 font-medium">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
            <View
              className={`absolute bottom-0 left-0 right-0 rounded-t-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <View className="items-center pt-2">
                <View
                  className={`w-12 h-1 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}
                />
              </View>
              <View className="p-5">
                <Text
                  className={`text-lg font-semibold mb-4 text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  {store.name}
                </Text>
                <TouchableOpacity
                  className={`flex-row items-center p-4 rounded-xl mb-2 ${isDarkMode ? "bg-blue-900/30" : "bg-blue-50"}`}
                  onPress={() => {
                    setShowActions(false);
                    onEdit(store);
                  }}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-blue-900/50" : "bg-blue-100"}`}
                  >
                    <Icon name="pencil" size={20} color="#3b82f6" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text
                      className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                    >
                      Edit Store
                    </Text>
                    <Text
                      className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Modify store details
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-row items-center p-4 rounded-xl ${isDarkMode ? "bg-red-900/30" : "bg-red-50"}`}
                  onPress={() => {
                    setShowActions(false);
                    onDelete(store);
                  }}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-red-900/50" : "bg-red-100"}`}
                  >
                    <Icon name="delete" size={20} color="#ef4444" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text
                      className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                    >
                      Delete Store
                    </Text>
                    <Text
                      className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Remove from stores
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity
                  className={`mt-4 p-3 rounded-xl items-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                  onPress={() => setShowActions(false)}
                >
                  <Text
                    className={`text-base font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </TouchableOpacity>
    );
  }

  // Grid View
  return (
    <TouchableOpacity
      onLongPress={() => setShowActions(true)}
      delayLongPress={500}
      className={`w-full rounded-2xl shadow-lg overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
    >
      <LinearGradient
        colors={["#3b82f6", "#2563eb"]}
        className="p-4"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
              <Icon name="store" size={24} color="#ffffff" />
            </View>
            <View className="ml-3 flex-1">
              <Text
                className="text-white font-bold text-base"
                numberOfLines={1}
              >
                {store.name}
              </Text>
              <Text className="text-white/80 text-xs" numberOfLines={1}>
                GST: {store.gst || "N/A"}
              </Text>
            </View>
          </View>
          <View
            className={`px-2 py-1 rounded-full ${isActive ? "bg-green-500" : "bg-gray-500"}`}
          >
            <Text className="text-white text-xs font-medium">
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="p-3">
        {store.email && (
          <View className="flex-row items-center mb-2">
            <Icon
              name="email"
              size={14}
              color={isDarkMode ? "#9CA3AF" : "#6b7280"}
            />
            <Text
              className={`ml-2 text-xs flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              numberOfLines={1}
            >
              {store.email}
            </Text>
          </View>
        )}
        {store.mobile && (
          <View className="flex-row items-center mb-2">
            <Icon
              name="phone"
              size={14}
              color={isDarkMode ? "#9CA3AF" : "#6b7280"}
            />
            <Text
              className={`ml-2 text-xs flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              {store.mobile}
            </Text>
          </View>
        )}
        {(store.address || store.city) && (
          <View className="flex-row items-center mb-3">
            <Icon
              name="map-marker"
              size={14}
              color={isDarkMode ? "#9CA3AF" : "#6b7280"}
            />
            <Text
              className={`ml-2 text-xs flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              numberOfLines={2}
            >
              {store.address}
              {store.city && `, ${store.city}`}
            </Text>
          </View>
        )}
        <View className="flex-row justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <TouchableOpacity
            onPress={() => onEdit(store)}
            className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"
          >
            <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(store)}
            className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30"
          >
            <Text className="text-red-600 dark:text-red-400 text-xs font-medium">
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
          <View
            className={`absolute bottom-0 left-0 right-0 rounded-t-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="items-center pt-2">
              <View
                className={`w-12 h-1 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}
              />
            </View>
            <View className="p-5">
              <Text
                className={`text-lg font-semibold mb-4 text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                {store.name}
              </Text>
              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${isDarkMode ? "bg-blue-900/30" : "bg-blue-50"}`}
                onPress={() => {
                  setShowActions(false);
                  onEdit(store);
                }}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-blue-900/50" : "bg-blue-100"}`}
                >
                  <Icon name="pencil" size={20} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    Edit Store
                  </Text>
                  <Text
                    className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Modify store details
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl ${isDarkMode ? "bg-red-900/30" : "bg-red-50"}`}
                onPress={() => {
                  setShowActions(false);
                  onDelete(store);
                }}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-red-900/50" : "bg-red-100"}`}
                >
                  <Icon name="delete" size={20} color="#ef4444" />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    Delete Store
                  </Text>
                  <Text
                    className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Remove from stores
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity
                className={`mt-4 p-3 rounded-xl items-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                onPress={() => setShowActions(false)}
              >
                <Text
                  className={`text-base font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};

export default StoreCard;
