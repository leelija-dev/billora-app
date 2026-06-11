// components/common/CustomModal.js
import { Modal, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useEffect, useRef } from "react";

// Success Modal Component
export const SuccessModal = ({ visible, message, onClose, autoClose = true, autoCloseDelay = 2000 }) => {
  const { isDarkMode } = useThemeStore();
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (autoClose && visible) {
      timeoutRef.current = setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, autoCloseDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, autoClose, autoCloseDelay, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="flex-1 items-center justify-center px-4">
          <View
            className={`rounded-2xl p-6 w-full max-w-sm items-center ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-3">
              <Icon name="check-circle" size={32} color="#10b981" />
            </View>
            <Text
              className={`text-lg font-semibold text-center ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Success!
            </Text>
            <Text
              className={`text-sm text-center mt-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {message}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Error Modal Component
export const ErrorModal = ({ visible, message, onClose }) => {
  const { isDarkMode } = useThemeStore();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="flex-1 items-center justify-center px-4">
          <View
            className={`rounded-2xl p-6 w-full max-w-sm items-center ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-3">
              <Icon name="alert-circle" size={32} color="#ef4444" />
            </View>
            <Text
              className={`text-lg font-semibold text-center ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Error!
            </Text>
            <Text
              className={`text-sm text-center mt-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {message}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="mt-4 px-6 py-2 rounded-xl bg-red-500"
            >
              <Text className="text-white font-medium">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Confirmation Modal Component
export const ConfirmationModal = ({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  confirmButtonColor = "#ef4444",
  loading = false
}) => {
  const { isDarkMode } = useThemeStore();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View className="flex-1 items-center justify-center px-4">
          <View
            className={`rounded-2xl p-6 w-full max-w-sm ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-3">
                <Icon name="alert-circle" size={32} color="#ef4444" />
              </View>
              <Text
                className={`text-lg font-semibold text-center ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {title || "Confirm"}
              </Text>
              <Text
                className={`text-sm text-center mt-2 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {message}
              </Text>
            </View>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={onCancel}
                className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600"
              >
                <Text
                  className={`text-center font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirm}
                disabled={loading}
                className={`flex-1 py-3 rounded-xl flex-row items-center justify-center`}
                style={{ backgroundColor: confirmButtonColor }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white text-center font-medium">
                    {confirmText}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Info Modal Component
export const InfoModal = ({ visible, title, message, onClose, icon = "information", iconColor = "#3b82f6" }) => {
  const { isDarkMode } = useThemeStore();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="flex-1 items-center justify-center px-4">
          <View
            className={`rounded-2xl p-6 w-full max-w-sm items-center ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mb-3">
              <Icon name={icon} size={32} color={iconColor} />
            </View>
            <Text
              className={`text-lg font-semibold text-center ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              {title}
            </Text>
            <Text
              className={`text-sm text-center mt-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {message}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="mt-4 px-6 py-2 rounded-xl bg-blue-500"
            >
              <Text className="text-white font-medium">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Loading Modal Component
export const LoadingModal = ({ visible, message = "Loading..." }) => {
  const { isDarkMode } = useThemeStore();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View
          className={`rounded-2xl p-6 items-center ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text
            className={`mt-3 text-center ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
};