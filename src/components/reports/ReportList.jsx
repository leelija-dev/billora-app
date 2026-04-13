// components/reports/ReportList.js
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import ReportCard from "./ReportCard";
import { formatDate } from "../../utils/dateFormatter";

const ReportList = ({
  viewMode = "list",
  searchQuery = "",
  reportType = "all",
  startDate,
  endDate,
  onRefresh,
  loading = false,
  reports = [], // Receive reports from parent
  error = null, // Receive error from parent
}) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Filter reports based on props
  const filteredReports = useMemo(() => {
    if (!reports || !Array.isArray(reports)) return [];
    
    let filtered = [...reports];

    // Report type filter
    if (reportType !== "all") {
      filtered = filtered.filter(
        (r) => r.type?.toLowerCase() === reportType.toLowerCase()
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.type?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [reports, reportType, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {filteredReports.length}{" "}
          {filteredReports.length === 1 ? "report" : "reports"} found
        </Text>
        <View className={`flex-row items-center px-3 py-1.5 rounded-full shadow-sm ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="file-document" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {reportType === "all" ? "All Types" : reportType}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderGridItem = (item) => (
    <View key={item.id?.toString()} className="w-[48%] mx-[1%] mb-3">
      <ReportCard report={item} viewMode="grid" />
    </View>
  );

  const renderListItem = (item) => (
    <ReportCard key={item.id?.toString()} report={item} viewMode="list" />
  );

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredReports.length; i += 2) {
      const rowItems = filteredReports.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading reports...
        </Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <Icon name="alert-circle" size={50} color="#ef4444" />
        <Text className="text-red-500 mt-4 text-center">{error}</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!filteredReports || filteredReports.length === 0) {
    return (
      <View className="flex-1">
        {renderHeader()}
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3b82f6"]}
              tintColor="#3b82f6"
            />
          }
        >
          <View className="items-center justify-center py-16">
            <Icon name="file-document-outline" size={80} color="#d1d5db" />
            <Text className={`text-lg font-semibold mt-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Reports Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {searchQuery || reportType !== "all"
                ? "Try adjusting your search or filters"
                : "No reports available for the selected date range"}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {renderHeader()}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      >
        <View className="pb-4">
          {viewMode === "grid" 
            ? renderGridItems() 
            : filteredReports.map(item => renderListItem(item))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ReportList;