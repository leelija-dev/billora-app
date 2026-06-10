// components/dashboard/StatsCard.js
import { Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const StatsCard = ({ title, value, icon, trend, color, onPress, style }) => {
  const { isDarkMode } = useThemeStore();

  const getTrendIcon = () => {
    if (!trend && trend !== 0) return null;
    return trend > 0 ? "trending-up" : trend < 0 ? "trending-down" : "minus";
  };

  const getTrendColor = () => {
    if (!trend && trend !== 0) return isDarkMode ? "#9CA3AF" : "#6B7280";
    return trend > 0 ? "#10B981" : trend < 0 ? "#EF4444" : (isDarkMode ? "#9CA3AF" : "#6B7280");
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      className={`rounded-2xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
      style={[{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }, style]}
    >
      <View style={{ height: 4, backgroundColor: color }} />
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {title}
            </Text>
            <Text className={`text-2xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{value}</Text>
            {trend !== undefined && trend !== null && (
              <View className="flex-row items-center mt-2">
                <Icon name={getTrendIcon()} size={14} color={getTrendColor()} />
                <Text className={`text-xs font-medium ml-1 ${getTrendColor() === "#10B981" ? "text-green-600" : getTrendColor() === "#EF4444" ? "text-red-600" : isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {trend === 0 ? "No change" : `${Math.abs(trend)}%`}
                </Text>
                <Text className={`text-xs ml-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>vs last period</Text>
              </View>
            )}
          </View>
          <View style={{ padding: 12, borderRadius: 16, backgroundColor: `${color}15` }}>
            <Icon name={icon} size={24} color={color} />
          </View>
        </View>
      </View>
    </CardComponent>
  );
};

export default StatsCard;