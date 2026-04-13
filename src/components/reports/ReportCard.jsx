// components/reports/ReportCard.js
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { formatDate } from "../../utils/dateFormatter";
import { NAVIGATION_SCREENS } from "../../utils/constants";

const ReportCard = ({ report, viewMode = "list" }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();

  if (!report) return null;

  const {
    id,
    title,
    type,
    amount,
    count,
    date,
    description,
    status,
    details = [],
  } = report;

  const getTypeIcon = () => {
    switch (type?.toLowerCase()) {
      case "sales":
        return { name: "cash", color: "#10b981", bg: "bg-green-500" };
      case "purchases":
        return { name: "cart", color: "#f59e0b", bg: "bg-orange-500" };
      case "inventory":
        return { name: "package", color: "#8b5cf6", bg: "bg-purple-500" };
      case "profits":
        return { name: "chart-line", color: "#3b82f6", bg: "bg-blue-500" };
      default:
        return { name: "file-document", color: "#6b7280", bg: "bg-gray-500" };
    }
  };

  const typeIcon = getTypeIcon();

  const handlePress = () => {
    // Safety check to ensure we have valid data
    if (!id || !type) {
      console.warn('Invalid report data for navigation:', { id, type });
      return;
    }
    navigation.navigate(NAVIGATION_SCREENS.MAIN.REPORT_DETAIL, { reportId: id, reportType: type });
  };

  const formatCurrency = (value) => {
    return `$${parseFloat(value || 0).toFixed(2)}`;
  };

  if (viewMode === "grid") {
    return (
      <TouchableOpacity
        className={`w-full rounded-2xl shadow-lg overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[typeIcon.color + '20', typeIcon.color + '10']}
          className="p-4"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className={`w-12 h-12 rounded-full items-center justify-center ${typeIcon.bg}`}>
              <Icon name={typeIcon.name} size={24} color="#ffffff" />
            </View>
            <View className={`px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Text className={`text-xs capitalize ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {type}
              </Text>
            </View>
          </View>

          <Text
            className={`text-base font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            numberOfLines={2}
          >
            {title || `${type} Report`}
          </Text>

          {amount !== undefined && (
            <View className="flex-row items-baseline mb-1">
              <Text className="text-2xl font-bold text-blue-600">
                {formatCurrency(amount)}
              </Text>
              {count !== undefined && (
                <Text className={`text-xs ml-2 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  ({count} items)
                </Text>
              )}
            </View>
          )}

          {date && (
            <View className="flex-row items-center mt-2">
              <Icon name="calendar" size={14} color="#9ca3af" />
              <Text className={`text-xs ml-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {formatDate(date, 'MMM DD, YYYY')}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // List view
  return (
    <TouchableOpacity
      className={`flex-row rounded-xl mb-3 p-4 shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className={`w-14 h-14 rounded-2xl items-center justify-center ${typeIcon.bg}`}>
        <Icon name={typeIcon.name} size={28} color="#ffffff" />
      </View>

      <View className="flex-1 ml-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className={`text-base font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}
              numberOfLines={1}
            >
              {title || `${type} Report`}
            </Text>
            <View className="flex-row items-center mt-1">
              <Icon name="tag" size={12} color="#9ca3af" />
              <Text className={`text-xs ml-1 capitalize ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {type}
              </Text>
              <Text className={`text-xs mx-2 ${
                isDarkMode ? 'text-gray-700' : 'text-gray-300'
              }`}>
                •
              </Text>
              <Icon name="calendar" size={12} color="#9ca3af" />
              <Text className={`text-xs ml-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {formatDate(date, 'MMM DD, YYYY')}
              </Text>
            </View>
          </View>

          {status && (
            <View className={`px-2 py-1 rounded-full ${
              status === 'completed' 
                ? isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                : status === 'pending'
                  ? isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Text className={`text-xs capitalize ${
                status === 'completed'
                  ? 'text-green-600'
                  : status === 'pending'
                    ? 'text-orange-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {status}
              </Text>
            </View>
          )}
        </View>

        {description && (
          <Text
            className={`text-sm mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}

        <View className="flex-row justify-between items-center mt-3">
          {amount !== undefined && (
            <View>
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Total Amount
              </Text>
              <Text className="text-lg font-bold text-blue-600">
                {formatCurrency(amount)}
              </Text>
            </View>
          )}

          {count !== undefined && (
            <View className="items-end">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Items
              </Text>
              <Text className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {count}
              </Text>
            </View>
          )}

          {details && details.length > 0 && (
            <View className="flex-row items-center">
              <Icon name="dots-horizontal" size={20} color="#9ca3af" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ReportCard;