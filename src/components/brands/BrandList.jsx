// components/brands/BrandList.js
import { View, Text, FlatList, ActivityIndicator, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import BrandCard from "./BrandCard";
import BrandListCard from "./BrandListCard";

const BrandList = ({ brands = [], viewMode, sortBy, loading, onEdit, onDelete }) => {
  const { isDarkMode } = useThemeStore();

  // Sort brands
  const sortedBrands = [...brands].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sortBy === 'date') {
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    } else if (sortBy === 'status') {
      return (b.is_active === true || b.is_active === 1) - (a.is_active === true || a.is_active === 1);
    }
    return 0;
  });

  if (loading && brands.length === 0) {
    return (
      <View className="py-12 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading brands...
        </Text>
      </View>
    );
  }

  if (sortedBrands.length === 0) {
    return (
      <View className={`py-12 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <Icon name="trademark" size={60} color="#9ca3af" />
        <Text className={`text-lg font-semibold mt-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          No Brands Found
        </Text>
        <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Get started by adding your first brand.
        </Text>
      </View>
    );
  }

  // Grid View - using BrandCard (modern card design)
  if (viewMode === "grid") {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {sortedBrands.map((brand) => (
            <View key={brand.id} style={{ width: '48%' }}>
              <BrandCard
                brand={brand}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // List View - using BrandListCard (horizontal row design)
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {sortedBrands.map((brand) => (
        <BrandListCard
          key={brand.id}
          brand={brand}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ScrollView>
  );
};

export default BrandList;