// components/categories/CategoryList.js
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import CategoryCard from "./CategoryCard";

const CategoryList = ({ categories = [], viewMode, sortBy, loading, onEdit, onDelete }) => {
  const { isDarkMode } = useThemeStore();

  const sortedCategories = [...categories].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'date') return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    if (sortBy === 'status') return ((b.is_active === true || b.is_active === 1) - (a.is_active === true || a.is_active === 1));
    return 0;
  });

  if (loading && categories.length === 0) {
    return (
      <View className="py-12 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading categories...</Text>
      </View>
    );
  }

  if (sortedCategories.length === 0) {
    return (
      <View className={`py-12 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <Icon name="shape" size={60} color="#9ca3af" />
        <Text className={`text-lg font-semibold mt-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>No Categories Found</Text>
        <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get started by adding your first category.</Text>
      </View>
    );
  }

  if (viewMode === "grid") {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {sortedCategories.map((category) => (
            <View key={category.id} style={{ width: '48%' }}>
              <CategoryCard category={category} onEdit={onEdit} onDelete={onDelete} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {sortedCategories.map((category) => (
        <CategoryCard key={category.id} category={category} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ScrollView>
  );
};

export default CategoryList;