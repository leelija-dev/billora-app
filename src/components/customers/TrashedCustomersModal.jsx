import { LinearGradient } from "expo-linear-gradient";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { format } from 'date-fns';

const TrashedCustomersModal = ({
  visible,
  onClose,
  customers,
  onRestore,
  onPermanentDelete,
}) => {
  const { isDarkMode } = useThemeStore();

  const handleRestore = (customerId, customerName) => {
    Alert.alert(
      "Restore Customer",
      `Are you sure you want to restore "${customerName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: () => onRestore(customerId),
        },
      ]
    );
  };

  const handlePermanentDelete = (customerId, customerName) => {
    Alert.alert(
      "Permanently Delete Customer",
      `This will permanently delete "${customerName}". This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: () => onPermanentDelete(customerId),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className={`flex-1 mt-20 rounded-t-3xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header */}
          <LinearGradient
            colors={["#ef4444", "#b91c1c"]}
            className="flex-row justify-between items-center p-5 rounded-t-3xl"
          >
            <View>
              <Text className="text-xl font-semibold text-white">
                Deleted Customers
              </Text>
              <Text className="text-white/80 text-sm mt-1">
                {customers.length} {customers.length === 1 ? 'customer' : 'customers'} in trash
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Content */}
          <ScrollView className="flex-1 p-5">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <View
                  key={customer.id}
                  className={`mb-4 p-4 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className={`text-base font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {customer.name}
                      </Text>
                      <Text className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {customer.phone}
                      </Text>
                    </View>
                    <View className="bg-red-500/20 px-2 py-1 rounded-full">
                      <Text className="text-xs text-red-500 font-medium">
                        Deleted
                      </Text>
                    </View>
                  </View>

                  {customer.email && (
                    <Text className={`text-xs mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Email: {customer.email}
                    </Text>
                  )}

                  <Text className={`text-xs mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Deleted on: {format(new Date(customer.deleted_at), 'PPP')}
                  </Text>

                  <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity
                      onPress={() => handleRestore(customer.id, customer.name)}
                      className="flex-1 bg-green-500 py-2 rounded-xl flex-row items-center justify-center"
                    >
                      <Icon name="restore" size={16} color="#ffffff" />
                      <Text className="text-white text-xs font-medium ml-1">
                        Restore
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handlePermanentDelete(customer.id, customer.name)}
                      className="flex-1 bg-red-500 py-2 rounded-xl flex-row items-center justify-center"
                    >
                      <Icon name="delete-forever" size={16} color="#ffffff" />
                      <Text className="text-white text-xs font-medium ml-1">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center justify-center py-16">
                <View className={`w-24 h-24 rounded-3xl items-center justify-center mb-4 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Icon name="delete-empty" size={48} color="#9ca3af" />
                </View>
                <Text className={`text-lg font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Trash is Empty
                </Text>
                <Text className={`text-sm text-center mt-2 px-8 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Deleted customers will appear here
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {customers.length > 0 && (
            <View className={`p-5 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <TouchableOpacity
                onPress={onClose}
                className="bg-blue-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default TrashedCustomersModal;