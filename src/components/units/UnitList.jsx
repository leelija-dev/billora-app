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
import UnitCard from "./UnitCard";

const UnitList = ({
  viewMode = "grid",
  searchQuery = "",
  sortBy = "code",
  units = [],
  loading = false,
  onRefresh = () => {},
  onDelete = () => {},
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

  // Filter and sort units
  const filteredUnits = useMemo(() => {
    if (!Array.isArray(units)) return [];
    let filtered = [...units];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.code?.toLowerCase().includes(query) ||
          u.name?.toLowerCase().includes(query) ||
          u.id?.toString().includes(query)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'code':
          return (a.code || '').localeCompare(b.code || '');
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'date':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'id':
          return (a.id || 0) - (b.id || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [units, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    if (!Array.isArray(units)) return {
      total: 0,
    };
    
    return {
      total: units.length,
    };
  }, [units]);

  const handleUnitPress = (unit) => {
    navigation.navigate("UnitDetail", { unitId: unit.id });
  };

  const handleDeleteUnit = async (unitId) => {
    console.log('UnitList: Deleting unit:', unitId);
    if (onDelete) {
      const result = await onDelete(unitId);
      console.log('UnitList: Delete result:', result);
      return result;
    }
    return { success: false };
  };

  const onRefreshLocal = async () => {
    console.log('UnitList: Refreshing...');
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <View className="flex-row justify-between items-center">
        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="ruler" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {filteredUnits.length} {filteredUnits.length === 1 ? 'unit' : 'units'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-3">
      <UnitCard 
        unit={item} 
        onDelete={handleDeleteUnit}
      />
    </View>
  );

  const renderListItem = (item) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleUnitPress(item)}
      className={`flex-row rounded-xl mb-3 p-4 shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      <View className="mr-3">
        <View className={`w-10 h-10 rounded-xl items-center justify-center ${
          isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
        }`}>
          <Icon name="ruler" size={20} color="#3b82f6" />
        </View>
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className={`text-base font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}
              numberOfLines={1}
            >
              {item.code} - {item.name}
            </Text>
          </View>
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            #{item.id}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <Icon name="account" size={14} color="#9ca3af" />
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              By: {item.created_by || `User ${item.user_id}`}
            </Text>
          </View>
          
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredUnits.length; i += 2) {
      const rowItems = filteredUnits.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading && !refreshing && filteredUnits.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading units...
        </Text>
      </View>
    );
  }

  if (!filteredUnits || filteredUnits.length === 0) {
    return (
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshLocal}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        <View className="px-4">
          {renderHeader()}
          <View className="items-center justify-center py-16">
            <View className={`w-24 h-24 rounded-3xl items-center justify-center mb-4 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Icon name="ruler" size={48} color="#9ca3af" />
            </View>
            <Text className={`text-lg font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Units Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Tap the + button to add your first unit"}
            </Text>
          </View>
        </View>
      </ScrollView>
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
            onRefresh={onRefreshLocal}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        <View className="pb-4">
          {viewMode === "grid"
            ? renderGridItems()
            : filteredUnits.map(item => renderListItem(item))}
        </View>
      </ScrollView>
    </View>
  );
};

export default UnitList;