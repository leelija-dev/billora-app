import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useCategoryForm } from "../../hooks/useCategoryForm";
import CategoryForm from "../../components/categories/CategoryForm";

const AddCategoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId } = route.params || {};
  const { isDarkMode } = useThemeStore();

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Minimal Header */}
        <View className={`px-4 py-3 flex-row items-center ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Icon 
              name="arrow-left" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#1F2937'} 
            />
          </TouchableOpacity>
          <Text className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {categoryId ? "Edit Category" : "Add Category"}
          </Text>
        </View>

        <CategoryForm categoryId={categoryId} />
      </SafeAreaView>
    </View>
  );
};

export default AddCategoryScreen;