// screens/brands/AddBrandScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import { Text, View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import useBrandStore from "../../store/brandStore";
import BrandForm from "../../components/brands/BrandForm";
import { useState, useEffect } from "react";

const AddBrandScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { brandId, brand } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { updateBrand, createBrand, getBrand, brands } = useBrandStore();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [loadingBrand, setLoadingBrand] = useState(false);

  const isEditing = !!brandId || !!brand;

  // Fetch brand data if editing and not passed directly
  useEffect(() => {
    if (isEditing && !brand && brandId) {
      const fetchBrand = async () => {
        setLoadingBrand(true);
        try {
          // Try to find brand in existing brands list first
          const existingBrand = brands?.find(b => b.id === parseInt(brandId) || b.id === brandId);
          if (existingBrand) {
            console.log('Found brand in store:', existingBrand);
            setInitialData(existingBrand);
          } else {
            // Fetch from API if not in store
            const fetchedBrand = await getBrand(brandId);
            console.log('Fetched brand from API:', fetchedBrand);
            setInitialData(fetchedBrand);
          }
        } catch (error) {
          console.error('Failed to fetch brand:', error);
          Alert.alert("Error", "Failed to load brand data");
        } finally {
          setLoadingBrand(false);
        }
      };
      fetchBrand();
    } else if (isEditing && brand) {
      // Brand data passed directly
      setInitialData(brand);
    }
  }, [brandId, brand, isEditing, brands, getBrand]);

  const handleSubmit = async (brandData) => {
    setFormSubmitting(true);
    try {
      if (isEditing) {
        const id = brandId || brand?.id || initialData?.id;
        await updateBrand(id, brandData);
        Alert.alert("Success", "Brand updated successfully");
      } else {
        await createBrand(brandData);
        Alert.alert("Success", "Brand created successfully");
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || `Failed to ${isEditing ? 'update' : 'create'} brand`);
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loadingBrand) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Loading brand...
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header */}
        <View className={`px-4 py-3 flex-row items-center border-b ${
          isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
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
          <Text className={`flex-1 text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {isEditing ? "Edit Brand" : "Add New Brand"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <BrandForm
            initialData={initialData}
            mode={isEditing ? 'edit' : 'add'}
            onSubmit={handleSubmit}
            onCancel={() => navigation.goBack()}
            isSubmitting={formSubmitting}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AddBrandScreen;