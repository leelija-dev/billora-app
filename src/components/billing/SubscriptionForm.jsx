// components/billing/SubscriptionForm.jsx
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const SubscriptionForm = ({
  plans,
  currentPlan,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const { isDarkMode } = useThemeStore();
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlan?.id || "");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!selectedPlanId) {
      setError("Please select a plan");
      return;
    }
    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
    if (selectedPlan) {
      onSubmit(selectedPlan);
    } else {
      setError("Selected plan not found");
    }
  };

  const getPlanIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes("basic")) return "package-variant";
    if (name.includes("pro")) return "flash";
    if (name.includes("business")) return "trending-up";
    if (name.includes("enterprise")) return "shield";
    if (name.includes("premium")) return "award";
    return "star";
  };

  const getPlanColor = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes("basic")) return "#3B82F6";
    if (name.includes("pro")) return "#8B5CF6";
    if (name.includes("business")) return "#F97316";
    if (name.includes("enterprise")) return "#6366F1";
    if (name.includes("premium")) return "#F59E0B";
    return "#10B981";
  };

  const calculateDiscountedPrice = (price, discountPercentage) => {
    const originalPrice = parseFloat(price) || 0;
    const discount = parseFloat(discountPercentage) || 0;
    const discountedPrice = originalPrice - (originalPrice * discount) / 100;
    return discountedPrice;
  };

  const getPopularFeatures = (plan) => {
    const features = [];
    if (plan.limits) {
      if (plan.limits.users) features.push(`${plan.limits.users} Users`);
      if (plan.limits.products) features.push(`${plan.limits.products} Products`);
      if (plan.limits.storage) features.push(`${plan.limits.storage}GB Storage`);
      if (plan.limits.apiCalls) features.push(`${plan.limits.apiCalls.toLocaleString()} API Calls`);
    }
    return features.slice(0, 2);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {/* Header */}
        <View className={`px-6 py-4 border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                Change Your Plan
              </Text>
              <Text className={`text-sm mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                Select a plan that best fits your business needs
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              disabled={isSubmitting}
              className={`p-2 rounded-full ${
                isDarkMode ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <Icon name="close" size={24} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <View className={`mx-4 mt-4 p-4 rounded-xl ${
            isDarkMode ? "bg-red-900/30 border border-red-800" : "bg-red-50 border border-red-200"
          }`}>
            <Text className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Plans Grid */}
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap justify-between">
            {plans.map((plan, index) => {
              const iconName = getPlanIcon(plan.name);
              const iconColor = getPlanColor(plan.name);
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isSelected = selectedPlanId === plan.id;
              const originalPrice = parseFloat(plan.price) || 0;
              const discountPercentage = parseFloat(plan.discount) || 0;
              const hasDiscount = discountPercentage > 0;
              const discountedPrice = calculateDiscountedPrice(
                originalPrice,
                discountPercentage,
              );
              const popularFeatures = getPopularFeatures(plan);
              const isPopular = plan.popular || index === 1;

              return (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => setSelectedPlanId(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-[48%] mb-4 rounded-2xl overflow-hidden shadow-sm ${
                    isSelected
                      ? "border-2 border-blue-500"
                      : isCurrentPlan
                      ? "border-2 border-green-500"
                      : isDarkMode
                      ? "border border-gray-700"
                      : "border border-gray-200"
                  } ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
                  style={isSelected ? { transform: [{ scale: 1.02 }] } : {}}
                >
                  {/* Popular Badge */}
                  {isPopular && !isCurrentPlan && (
                    <View className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                      <View className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full flex-row items-center">
                        <Icon name="flash" size={12} color="#ffffff" />
                        <Text className="text-xs font-bold text-white ml-1">
                          MOST POPULAR
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <View className="absolute top-2 right-2 z-10">
                      <View className={`px-2 py-1 rounded-full flex-row items-center ${
                        isDarkMode ? "bg-green-900/30" : "bg-green-100"
                      }`}>
                        <Icon name="check-circle" size={12} color="#10B981" />
                        <Text className={`text-xs font-medium ml-1 ${
                          isDarkMode ? "text-green-400" : "text-green-700"
                        }`}>
                          Current
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="p-4">
                    {/* Icon */}
                    <View
                      className={`w-12 h-12 rounded-2xl items-center justify-center mb-3`}
                      style={{ backgroundColor: `${iconColor}20` }}
                    >
                      <Icon name={iconName} size={24} color={iconColor} />
                    </View>

                    {/* Plan Name */}
                    <Text className={`font-bold text-lg ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {plan.name}
                    </Text>

                    {/* Description */}
                    {plan.description && (
                      <Text className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`} numberOfLines={2}>
                        {plan.description.replace(/<[^>]*>/g, "")}
                      </Text>
                    )}

                    {/* Price */}
                    <View className="mt-3">
                      {hasDiscount ? (
                        <>
                          <View className="flex-row items-baseline">
                            <Text className={`text-2xl font-bold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                              {formatCurrency(discountedPrice)}
                            </Text>
                            <Text className={`text-sm ml-1 ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}>
                              /{plan.duration_days} Days
                            </Text>
                          </View>
                          <View className="flex-row items-center mt-1">
                            <Text className={`text-sm line-through ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            }`}>
                              {formatCurrency(originalPrice)}
                            </Text>
                            <View className={`ml-2 px-2 py-0.5 rounded-full flex-row items-center ${
                              isDarkMode ? "bg-green-900/30" : "bg-green-100"
                            }`}>
                              <Icon name="tag" size={10} color="#10B981" />
                              <Text className={`text-xs font-medium ml-1 ${
                                isDarkMode ? "text-green-400" : "text-green-700"
                              }`}>
                                {discountPercentage}% OFF
                              </Text>
                            </View>
                          </View>
                        </>
                      ) : (
                        <View className="flex-row items-baseline">
                          <Text className={`text-2xl font-bold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}>
                            {formatCurrency(originalPrice)}
                          </Text>
                          <Text className={`text-sm ml-1 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                            /{plan.interval || "month"}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Popular Features */}
                    {popularFeatures.length > 0 && (
                      <View className={`mt-3 p-3 rounded-xl ${
                        isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                      }`}>
                        <Text className={`text-xs font-semibold mb-2 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          KEY FEATURES
                        </Text>
                        <View className="flex-row flex-wrap">
                          {popularFeatures.map((feature, idx) => (
                            <View
                              key={idx}
                              className={`px-2 py-1 rounded-lg mr-2 mb-2 flex-row items-center ${
                                isDarkMode ? "bg-gray-700" : "bg-white"
                              }`}
                            >
                              <Icon name="check-circle" size={12} color="#10B981" />
                              <Text className={`text-xs font-medium ml-1 ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}>
                                {feature}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Plan Limits */}
                    {plan.limits && (
                      <View className={`mt-3 pt-3 border-t ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}>
                        <Text className={`text-xs font-semibold mb-2 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          PLAN FEATURES
                        </Text>
                        {plan.limits.users && (
                          <View className="flex-row items-center mb-2">
                            <Icon name="account-group" size={16} color="#3B82F6" />
                            <Text className={`flex-1 ml-2 text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}>
                              Team Members
                            </Text>
                            <Text className={`font-medium text-sm ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                              {plan.limits.users}
                            </Text>
                          </View>
                        )}
                        {plan.limits.products && (
                          <View className="flex-row items-center mb-2">
                            <Icon name="package-variant" size={16} color="#3B82F6" />
                            <Text className={`flex-1 ml-2 text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}>
                              Products
                            </Text>
                            <Text className={`font-medium text-sm ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                              {plan.limits.products}
                            </Text>
                          </View>
                        )}
                        {plan.limits.storage && (
                          <View className="flex-row items-center mb-2">
                            <Icon name="cloud" size={16} color="#3B82F6" />
                            <Text className={`flex-1 ml-2 text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}>
                              Storage
                            </Text>
                            <Text className={`font-medium text-sm ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                              {plan.limits.storage}GB
                            </Text>
                          </View>
                        )}
                        {plan.limits.apiCalls && (
                          <View className="flex-row items-center">
                            <Icon name="trending-up" size={16} color="#3B82F6" />
                            <Text className={`flex-1 ml-2 text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}>
                              API Calls
                            </Text>
                            <Text className={`font-medium text-sm ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                              {plan.limits.apiCalls.toLocaleString()}/mo
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Select Button */}
                    <View className="mt-4">
                      {isCurrentPlan ? (
                        <View className={`py-2.5 px-4 rounded-xl items-center ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}>
                          <Text className={`text-sm font-semibold ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                            Current Plan
                          </Text>
                        </View>
                      ) : (
                        <View
                          className={`py-2.5 px-4 rounded-xl items-center ${
                            isSelected
                              ? "bg-blue-600"
                              : isDarkMode
                              ? "bg-gray-700"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text className={`text-sm font-semibold ${
                            isSelected ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}>
                            {isSelected ? "Selected" : "Select Plan"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Additional Info */}
          <View className={`mt-4 p-4 rounded-xl border ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
          }`}>
            <View className="flex-row items-start">
              <Icon name="shield" size={20} color="#3B82F6" />
              <View className="ml-3 flex-1">
                <Text className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  <Text className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Need help choosing?
                  </Text>{" "}
                  All plans include 24/7 support and regular updates. Discounted prices are shown where applicable.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View className={`px-6 py-4 border-t ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center border ${
                isDarkMode ? "border-gray-600" : "border-gray-300"
              }`}
            >
              <Text className={`font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedPlanId}
              className={`flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center bg-blue-600 ${
                (isSubmitting || !selectedPlanId) ? "opacity-50" : ""
              }`}
            >
              {isSubmitting ? (
                <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Icon name="check" size={20} color="#ffffff" />
                  <Text className="font-medium text-white ml-2">
                    Update Plan
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SubscriptionForm;
