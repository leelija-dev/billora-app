// components/customers/CustomerCard.js
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useCustomerStore from "../../store/customerStore";
import { useThemeStore } from "../../store/themeStore";
import { SuccessModal } from "../common/CustomModal";
import PaymentModal from "./PaymentModal";

const CustomerCard = ({ customer, onEdit, onDelete, onPayment }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { addDuePayment } = useCustomerStore();
  const [showActions, setShowActions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
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
    created_at,
    status,
  } = customer;

  const hasDue = parseFloat(due_amount || 0) > 0;
  const dueAmount = parseFloat(due_amount || 0);

  const handlePress = () => {
    navigation.navigate("CustomerDetail", { customerId: id });
  };

  const handleEdit = () => {
    setShowActions(false);
    if (onEdit) onEdit(customer);
  };

  const handleDeleteClick = () => {
    setShowActions(false);
    // Call onDelete directly - parent component will handle confirmation
    if (onDelete) onDelete(customer);
  };

  const handlePayment = () => {
    setShowActions(false);
    if (onPayment) {
      onPayment(customer);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSubmit = async (amount) => {
    setPaymentProcessing(true);
    try {
      const result = await addDuePayment(customer.id, amount);
      if (result && result.success) {
        setSuccessMessage(
          `Payment of ₹${amount.toFixed(2)} processed successfully!`,
        );
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        setShowPaymentModal(false);
      } else {
        setSuccessMessage(result?.error || "Failed to process payment");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      setSuccessMessage(error.message || "Failed to process payment");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleLongPress = () => {
    setShowActions(true);
  };

  const getGradientColors = () => {
    const gradients = [
      ["#3b82f6", "#2563eb"],
      ["#8b5cf6", "#6d28d9"],
      ["#ec4899", "#be185d"],
      ["#f59e0b", "#b45309"],
      ["#10b981", "#047857"],
      ["#ef4444", "#b91c1c"],
    ];
    const index = (name?.length || 0) % gradients.length;
    return gradients[index];
  };

  const getStatusColor = () => {
    if (status === "active") return "#10b981";
    if (status === "blocked") return "#ef4444";
    return "#f59e0b";
  };

  const gradientColors = getGradientColors();

  return (
    <>
      <TouchableOpacity
        className={`w-full rounded-2xl shadow-lg overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
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
              <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                <Icon name="account" size={20} color="#ffffff" />
              </View>
              <View className="ml-3 flex-1">
                <Text
                  className="text-white font-bold text-base"
                  numberOfLines={1}
                >
                  {name}
                </Text>
                {phone && (
                  <View className="flex-row items-center mt-0.5">
                    <Icon name="phone" size={12} color="#ffffff/70" />
                    <Text
                      className="text-white/80 text-xs ml-1"
                      numberOfLines={1}
                    >
                      {phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View className="items-end">
              {hasDue && (
                <View className="bg-yellow-500/30 px-2 py-1 rounded-full mb-1">
                  <Text className="text-white text-xs font-medium">
                    ₹{dueAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              <View className={`w-2 h-2 rounded-full bg-${getStatusColor()}`} />
            </View>
          </View>
        </LinearGradient>

        {/* Body */}
        <View className="p-3">
          {email && (
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
                {email}
              </Text>
            </View>
          )}
          <View className="flex-row items-center mb-3">
            <Icon
              name="map-marker"
              size={14}
              color={isDarkMode ? "#9CA3AF" : "#6b7280"}
            />
            <Text
              className={`ml-2 text-xs flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              numberOfLines={1}
            >
              {address || "No address"}
              {city && `, ${city}`}
            </Text>
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center">
              <Icon
                name="calendar"
                size={12}
                color={isDarkMode ? "#6b7280" : "#9ca3af"}
              />
              <Text
                className={`text-xs ml-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                {created_at ? new Date(created_at).toLocaleDateString() : "N/A"}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Icon
                name="cash"
                size={12}
                color={isDarkMode ? "#6b7280" : "#9ca3af"}
              />
              <Text
                className={`text-xs ml-1 ${hasDue ? "text-red-500" : isDarkMode ? "text-gray-500" : "text-green-600"}`}
              >
                {hasDue ? `Due: ₹${dueAmount.toFixed(2)}` : "No Due"}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={handleEdit}
              className="flex-1 px-3 py-2 rounded-lg flex-row justify-center items-center bg-blue-100 dark:bg-blue-900/30"
            >
              <Icon name="pencil" size={14} color="#3b82f6" />
              <Text className="text-blue-600 dark:text-blue-400 text-xs ml-1 font-medium">
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteClick}
              className="flex-1 px-3 py-2 rounded-lg flex-row justify-center items-center bg-red-100 dark:bg-red-900/30"
            >
              <Icon name="delete" size={14} color="#ef4444" />
              <Text className="text-red-600 dark:text-red-400 text-xs ml-1 font-medium">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
          
          {hasDue && (
            <LinearGradient
              colors={["#3b82f6", "#2563eb"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 8 }}
              className="mt-2"
            >
              <TouchableOpacity
                onPress={handlePayment}
                className="px-3 py-1.5 rounded-lg flex-row items-center justify-center"
              >
                <Icon name="credit-card" size={14} color="white" />
                <Text className="text-white text-xs ml-1 font-medium">
                  Pay Now
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Modal (Long Press) */}
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
                {name}
              </Text>

              {hasDue && (
                <TouchableOpacity
                  className={`flex-row items-center p-4 rounded-xl mb-2 ${isDarkMode ? "bg-purple-900/30" : "bg-purple-50"}`}
                  onPress={handlePayment}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-purple-900/50" : "bg-purple-100"}`}
                  >
                    <Icon name="credit-card" size={20} color="#8b5cf6" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text
                      className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                    >
                      Make Payment
                    </Text>
                    <Text
                      className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Due amount: ₹{dueAmount.toFixed(2)}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${isDarkMode ? "bg-blue-900/30" : "bg-blue-50"}`}
                onPress={handleEdit}
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
                    Edit Customer
                  </Text>
                  <Text
                    className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Modify customer details
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl ${isDarkMode ? "bg-red-900/30" : "bg-red-50"}`}
                onPress={handleDeleteClick}
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
                    Delete Customer
                  </Text>
                  <Text
                    className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Remove from customers
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

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        customer={customer}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handlePaymentSubmit}
        loading={paymentProcessing}
        isDarkMode={isDarkMode}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </>
  );
};

export default CustomerCard;