// screens/categories/AddCategoryScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import useCategoryStore from "../../store/categoryStore";
import CategoryForm from "../../components/categories/CategoryForm";
import { SuccessModal } from "../../components/common/CustomModal";
import { useState, useEffect } from "react";

const AddCategoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId, category } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { createCategory, updateCategory, getCategory, categories } = useCategoryStore();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = !!categoryId || !!category;

  // Get current user ID
  const getCurrentUserId = () => {
    if (user && user.id) {
      return user.id.toString();
    }
    return "1";
  };

  useEffect(() => {
    if (isEditing && !category && categoryId) {
      const fetchCategory = async () => {
        setLoadingCategory(true);
        try {
          const existingCategory = categories?.find(c => c.id === parseInt(categoryId) || c.id === categoryId);
          if (existingCategory) {
            setInitialData(existingCategory);
          } else {
            const fetchedCategory = await getCategory(categoryId);
            setInitialData(fetchedCategory);
          }
        } catch (error) {
          console.error('Failed to fetch category:', error);
        } finally {
          setLoadingCategory(false);
        }
      };
      fetchCategory();
    } else if (isEditing && category) {
      setInitialData(category);
    }
  }, [categoryId, category, isEditing, categories, getCategory]);

  const handleSubmit = async (categoryData) => {
    setFormSubmitting(true);
    try {
      const userId = getCurrentUserId();
      const payload = {
        ...categoryData,
        user_id: userId,
        userId: userId,
        created_by: userId,
      };
      
      if (isEditing) {
        const id = categoryId || category?.id || initialData?.id;
        await updateCategory(id, payload);
        setSuccessMessage("Category updated successfully");
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }, 2000);
      } else {
        await createCategory(payload);
        setSuccessMessage("Category created successfully");
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loadingCategory) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading category...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className={`px-4 py-3 flex-row items-center border-b ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Icon name="arrow-left" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
          </TouchableOpacity>
          <Text className={`flex-1 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{isEditing ? "Edit Category" : "Add New Category"}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <CategoryForm 
            initialData={initialData} 
            mode={isEditing ? 'edit' : 'add'} 
            onSubmit={handleSubmit} 
            onCancel={() => navigation.goBack()} 
            isSubmitting={formSubmitting}
          />
        </ScrollView>
      </SafeAreaView>

      <SuccessModal visible={showSuccessModal} message={successMessage} onClose={() => setShowSuccessModal(false)} autoClose={true} autoCloseDelay={2000} />
    </View>
  );
};

export default AddCategoryScreen;