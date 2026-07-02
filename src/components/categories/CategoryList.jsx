// components/categories/CategoryList.js
import { View, Text, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import CategoryCard from "./CategoryCard";

const CategoryList = ({ categories = [], viewMode, sortBy, loading, onEdit, onDelete }) => {
  const { isDarkMode } = useThemeStore();

  if (categories.length === 0) {
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
      <View className="flex-row flex-wrap justify-between">
        {categories.map((category) => (
          <View key={category.id} style={{ width: '48%' }}>
            <CategoryCard category={category} onEdit={onEdit} onDelete={onDelete} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <>
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
};

export default CategoryList;