// components/products/ProductForm.js
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, Text, TouchableOpacity, View, Modal, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { productsAPI } from "../../api";
import { brandsAPI } from "../../api/brands";
import { categoriesAPI } from "../../api/categories";
import { unitsAPI } from "../../api/units";
import { useMutation } from "../../hooks/useApi";
import { useProductStore } from "../../store/productStore";
import { useUIStore } from "../../store/uiStore";
import Button from "../common/Button";
import Input from "../common/Input";

const ProductForm = ({ productId }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useThemeStore();
  const { selectedProduct, updateProduct, addProduct } = useProductStore();
  const { showSuccess, showError } = useUIStore();

  const isEditing = productId || selectedProduct?.id;
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  // Image upload state
  const [productImages, setProductImages] = useState([]);
  
  // API data states
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  
  // Dropdown visibility states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  // Image picker function
  const handleImagePicker = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `product_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg'
        }));
        setProductImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showError('Failed to pick image');
    }
  };

  // Camera function
  const handleCamera = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImage = {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || `product_${Date.now()}.jpg`,
          type: result.assets[0].mimeType || 'image/jpeg'
        };
        setProductImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showError('Failed to take photo');
    }
  };

  // Show image options
  const showImageOptions = () => {
    Alert.alert(
      'Add Product Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: handleCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: handleImagePicker,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  // Remove image
  const removeImage = (index) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        
        // Fetch categories
        const categoriesResponse = await categoriesAPI.getAll();
        let categoriesData = [];
        if (categoriesResponse?.data?.data) {
          if (categoriesResponse.data.data.data && Array.isArray(categoriesResponse.data.data.data)) {
            categoriesData = categoriesResponse.data.data.data;
          } else if (Array.isArray(categoriesResponse.data.data)) {
            categoriesData = categoriesResponse.data.data;
          }
        } else if (Array.isArray(categoriesResponse?.data)) {
          categoriesData = categoriesResponse.data;
        }
        setCategories(categoriesData);
        
        // Fetch brands
        const brandsResponse = await brandsAPI.getAll();
        let brandsData = [];
        if (brandsResponse?.data?.data) {
          if (brandsResponse.data.data.data && Array.isArray(brandsResponse.data.data.data)) {
            brandsData = brandsResponse.data.data.data;
          } else if (Array.isArray(brandsResponse.data.data)) {
            brandsData = brandsResponse.data.data;
          }
        } else if (Array.isArray(brandsResponse?.data)) {
          brandsData = brandsResponse.data;
        }
        setBrands(brandsData);
        
        // Fetch units
        const unitsResponse = await unitsAPI.getAll();
        let unitsData = [];
        if (unitsResponse?.data?.data) {
          if (unitsResponse.data.data.data && Array.isArray(unitsResponse.data.data.data)) {
            unitsData = unitsResponse.data.data.data;
          } else if (Array.isArray(unitsResponse.data.data)) {
            unitsData = unitsResponse.data.data;
          }
        } else if (Array.isArray(unitsResponse?.data)) {
          unitsData = unitsResponse.data;
        }
        setUnits(unitsData);
        
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        showError('Failed to load dropdown data');
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      user_id: "1", // This should come from auth store
      name: "",
      sku: "",
      description: "",
      selling_price: "",
      purchase_price: "",
      gst_percentage: "",
      discount_percentage: "",
      unit_amount: "",
      is_active: true,
      created_by: "1", // This should come from auth store
    },
  });

  const { mutate: createProduct } = useMutation(productsAPI.createProduct);
  const { mutate: updateProductApi } = useMutation((data) =>
    productsAPI.updateProduct(
      productId || selectedProduct?.id,
      data,
    ),
  );

  useEffect(() => {
    if (isEditing && productId) {
      // Fetch product data for editing
      const fetchProductForEdit = async () => {
        try {
          setLoading(true);
          const response = await productsAPI.getById(productId);
          
          // Handle paginated API response structure
          let productData = null;
          if (response?.data?.data) {
            if (response.data.data.data && Array.isArray(response.data.data.data)) {
              // This is for list endpoints - not expected here
              productData = response.data.data.data.find(item => item.id == productId);
            } else if (response.data.data.id) {
              // Single product response
              productData = response.data.data;
            }
          } else if (response?.data?.id) {
            // Direct product data
            productData = response.data;
          } else if (response?.id) {
            // Response itself is the product
            productData = response;
          }
          
          if (productData) {
            reset({
              user_id: productData.user_id?.toString() || "1",
              name: productData.name || "",
              sku: productData.sku || "",
              description: productData.description || "",
              selling_price: productData.selling_price?.toString() || "",
              purchase_price: productData.purchase_price?.toString() || "",
              gst_percentage: productData.gst_percentage?.toString() || "",
              discount_percentage: productData.discount_percentage?.toString() || "",
              unit_amount: productData.unit_amount?.toString() || "",
              is_active: productData.is_active ?? true,
              created_by: productData.created_by || "1",
            });
            setSelectedCategory(productData.category_id || "");
            setSelectedBrand(productData.brand_id || "");
            setSelectedUnit(productData.unit_id || "");
            setIsActive(productData.is_active ?? true);
          }
        } catch (error) {
          console.error('Error fetching product for edit:', error);
          showError('Failed to load product data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchProductForEdit();
    }
  }, [isEditing, productId, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const productData = {
        user_id: parseInt(data.user_id) || 1, // Ensure user_id is sent as integer
        name: data.name,
        sku: data.sku,
        description: data.description,
        selling_price: parseFloat(data.selling_price) || 0,
        purchase_price: parseFloat(data.purchase_price) || 0,
        gst_percentage: parseFloat(data.gst_percentage) || 0,
        discount_percentage: parseFloat(data.discount_percentage) || 0,
        unit_amount: parseFloat(data.unit_amount) || 1,
        category_id: selectedCategory ? parseInt(selectedCategory) : null,
        brand_id: selectedBrand ? parseInt(selectedBrand) : null,
        unit_id: selectedUnit ? parseInt(selectedUnit) : null,
        is_active: isActive,
        created_by: parseInt(data.created_by) || 1,
      };

      console.log('Submitting product data:', productData);

      if (isEditing) {
        const response = await updateProductApi(productData);
        console.log('Update response:', response);
        const product = response.data?.data || response.data || response;
        updateProduct(selectedProduct.id, product);
        showSuccess("Product updated successfully");
      } else {
        const response = await createProduct(productData);
        console.log('Create response:', response);
        const product = response.data?.data || response.data || response;
        addProduct(product);
        showSuccess("Product created successfully");
      }

      navigation.goBack();
    } catch (error) {
      console.error('Product creation error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to save product";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await productsAPI.deleteProduct(selectedProduct.id);
              navigation.goBack();
              showSuccess("Product deleted successfully");
            } catch (error) {
              showError(error.message || "Failed to delete product");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderDropdown = (items, selectedValue, onSelect, onClose, title) => (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="flex-1 justify-center items-center p-5">
          <View className={`w-full max-h-96 rounded-xl overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className={`p-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <Text className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Select {title}
              </Text>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`p-4 border-b ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-100'
                  } ${selectedValue === item.id ? isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50' : ''}`}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                >
                  <Text className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-16 pt-0"
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload Section */}
        <View className="mb-6">
          <Text className={`text-base font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Product Images
          </Text>
          
          {/* Image Preview */}
          {productImages.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {productImages.map((image, index) => (
                <View key={index} className="relative">
                  <Image 
                    source={{ uri: image.uri }} 
                    className="w-20 h-20 rounded-lg"
                    style={{ width: 80, height: 80 }}
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                  >
                    <Icon name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          {/* Add Image Button */}
          <TouchableOpacity
            onPress={showImageOptions}
            className={`w-full h-32 rounded-2xl border-2 border-dashed items-center justify-center ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-200 border-gray-300'
            }`}
          >
            <Icon name="camera-plus" size={40} color="#9ca3af" />
            <Text className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Add Product Images
            </Text>
          </TouchableOpacity>
        </View>

        {/* Basic Information Section */}
        <View className={`rounded-2xl p-4 shadow-sm mb-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Text className={`text-base font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Basic Information
          </Text>

          {/* Hidden user_id field */}
          <Controller
            control={control}
            name="user_id"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                containerClassName="hidden"
                isDarkMode={isDarkMode}
              />
            )}
          />

          {/* Product Name */}
          <Controller
            control={control}
            name="name"
            rules={{
              required: "Product name is required",
              maxLength: {
                value: 100,
                message: "Name must be less than 100 characters",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Product Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter product name"
                error={errors.name?.message}
                leftIcon="tag"
                containerClassName="mb-4"
                isDarkMode={isDarkMode}
              />
            )}
          />

          {/* SKU */}
          <Controller
            control={control}
            name="sku"
            rules={{
              required: "SKU is required",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="SKU"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter SKU"
                error={errors.sku?.message}
                leftIcon="barcode"
                containerClassName="mb-4"
                isDarkMode={isDarkMode}
              />
            )}
          />

          {/* Description */}
          <Controller
            control={control}
            name="description"
            rules={{
              maxLength: {
                value: 1000,
                message: "Description must be less than 1000 characters",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter product description"
                multiline
                numberOfLines={4}
                error={errors.description?.message}
                leftIcon="text"
                containerClassName="mb-4"
                inputClassName="h-24"
                isDarkMode={isDarkMode}
              />
            )}
          />
        </View>

        {/* Category, Brand, Unit Section */}
        <View className={`rounded-2xl p-4 shadow-sm mb-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Text className={`text-base font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Classification
          </Text>

          {/* Category Dropdown */}
          <View className="mb-4">
            <Text className={`text-sm mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Category <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryDropdown(true)}
              className={`flex-row items-center p-3 rounded-xl border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Icon name="shape" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              <Text className={`flex-1 ml-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {selectedCategory 
                  ? categories.find(c => c.id == selectedCategory)?.name 
                  : 'Select category'}
              </Text>
              <Icon name="chevron-down" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          {/* Brand Dropdown */}
          <View className="mb-4">
            <Text className={`text-sm mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Brand <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowBrandDropdown(true)}
              className={`flex-row items-center p-3 rounded-xl border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Icon name="factory" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              <Text className={`flex-1 ml-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {selectedBrand 
                  ? brands.find(b => b.id == selectedBrand)?.name 
                  : 'Select brand'}
              </Text>
              <Icon name="chevron-down" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          {/* Unit Dropdown */}
          <View className="mb-4">
            <Text className={`text-sm mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Unit <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowUnitDropdown(true)}
              className={`flex-row items-center p-3 rounded-xl border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Icon name="scale" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              <Text className={`flex-1 ml-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {selectedUnit 
                  ? `${units.find(u => u.id == selectedUnit)?.name} (${units.find(u => u.id == selectedUnit)?.code})`
                  : 'Select unit'}
              </Text>
              <Icon name="chevron-down" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unit Amount */}
        <View className={`rounded-2xl p-4 shadow-sm mb-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Text className={`text-base font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Unit Information
          </Text>
          <Controller
            control={control}
            name="unit_amount"
            rules={{
              required: "Unit amount is required",
              validate: {
                positive: (value) =>
                  parseFloat(value) > 0 || "Unit amount must be greater than 0",
                numeric: (value) =>
                  !isNaN(value) || "Unit amount must be a number",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Unit Amount"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter unit amount"
                keyboardType="decimal-pad"
                error={errors.unit_amount?.message}
                leftIcon="counter"
                isDarkMode={isDarkMode}
              />
            )}
          />
        </View>

        {/* Pricing Section */}
        <View className={`rounded-2xl p-4 shadow-sm mb-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Text className={`text-base font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Pricing & Taxes
          </Text>

          <View className="flex-row gap-4 mb-4">
            {/* Selling Price */}
            <View className="flex-1">
              <Controller
                control={control}
                name="selling_price"
                rules={{
                  required: "Selling price is required",
                  validate: {
                    positive: (value) =>
                      parseFloat(value) > 0 || "Price must be greater than 0",
                    numeric: (value) =>
                      !isNaN(value) || "Price must be a number",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Selling Price"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    error={errors.selling_price?.message}
                    leftIcon="currency-usd"
                    isDarkMode={isDarkMode}
                  />
                )}
              />
            </View>

            {/* Purchase Price */}
            <View className="flex-1">
              <Controller
                control={control}
                name="purchase_price"
                rules={{
                  required: "Purchase price is required",
                  validate: {
                    positive: (value) =>
                      parseFloat(value) > 0 || "Price must be greater than 0",
                    numeric: (value) =>
                      !isNaN(value) || "Price must be a number",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Purchase Price"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    error={errors.purchase_price?.message}
                    leftIcon="cart"
                    isDarkMode={isDarkMode}
                  />
                )}
              />
            </View>
          </View>

          <View className="flex-row gap-4 mb-4">
            {/* GST Percentage */}
            <View className="flex-1">
              <Controller
                control={control}
                name="gst_percentage"
                rules={{
                  validate: {
                    numeric: (value) =>
                      !value || !isNaN(value) || "GST must be a number",
                    range: (value) =>
                      !value || 
                      (parseFloat(value) >= 0 && parseFloat(value) <= 100) ||
                      "GST must be between 0 and 100",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="GST (%)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    error={errors.gst_percentage?.message}
                    leftIcon="percent"
                    isDarkMode={isDarkMode}
                  />
                )}
              />
            </View>

            {/* Discount Percentage */}
            <View className="flex-1">
              <Controller
                control={control}
                name="discount_percentage"
                rules={{
                  validate: {
                    numeric: (value) =>
                      !value || !isNaN(value) || "Discount must be a number",
                    range: (value) =>
                      !value || 
                      (parseFloat(value) >= 0 && parseFloat(value) <= 100) ||
                      "Discount must be between 0 and 100",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Discount (%)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    error={errors.discount_percentage?.message}
                    leftIcon="sale"
                    isDarkMode={isDarkMode}
                  />
                )}
              />
            </View>
          </View>

          {/* Profit Margin Display */}
          {watch("selling_price") && watch("purchase_price") && (
            <LinearGradient
              colors={isDarkMode ? ["#065f46", "#064e3b"] : ["#d1fae5", "#a7f3d0"]}
              className="p-3 rounded-xl"
            >
              <Text className={isDarkMode ? "text-green-400" : "text-green-800"}>
                Profit Margin:{" "}
                {(
                  ((watch("selling_price") - watch("purchase_price")) /
                    watch("purchase_price")) *
                  100
                ).toFixed(1)}
                % (₹{(watch("selling_price") - watch("purchase_price")).toFixed(2)})
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Status Section */}
        <View className={`rounded-2xl p-4 shadow-sm mb-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Text className={`text-base font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Status
          </Text>

          <TouchableOpacity
            onPress={() => setIsActive(!isActive)}
            className={`flex-row items-center justify-between p-3 rounded-xl border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <View className="flex-row items-center">
              <Icon 
                name={isActive ? "check-circle" : "close-circle"} 
                size={24} 
                color={isActive ? "#10b981" : "#ef4444"} 
              />
              <Text className={`ml-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {isActive ? "Product is Active" : "Product is Inactive"}
              </Text>
            </View>
            <View className={`w-12 h-6 rounded-full ${
              isActive ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              <View className={`w-6 h-6 rounded-full bg-white shadow-md transform ${
                isActive ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <Button
          title={isEditing ? "Update Product" : "Create Product"}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={!isValid || loading || !selectedCategory || !selectedBrand || !selectedUnit}
          className="bg-blue-500 py-4 rounded-xl"
          textClassName="text-white font-semibold text-lg"
        />

        {/* Delete Button for Edit Mode */}
        {isEditing && (
          <TouchableOpacity
            onPress={handleDelete}
            className="mt-4 py-4 rounded-xl bg-red-500 items-center"
            disabled={loading}
          >
            <Text className="text-white font-semibold text-lg">Delete Product</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Dropdown Modals */}
      {showCategoryDropdown && renderDropdown(
        categories, 
        selectedCategory, 
        setSelectedCategory, 
        () => setShowCategoryDropdown(false),
        "Category"
      )}

      {showBrandDropdown && renderDropdown(
        brands, 
        selectedBrand, 
        setSelectedBrand, 
        () => setShowBrandDropdown(false),
        "Brand"
      )}

      {showUnitDropdown && renderDropdown(
        units, 
        selectedUnit, 
        setSelectedUnit, 
        () => setShowUnitDropdown(false),
        "Unit"
      )}
    </SafeAreaView>
  );
};

export default ProductForm;