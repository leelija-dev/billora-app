// screens/products/AddProductScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../../components/common/Header";
import SearchSelect from "../../components/common/SearchSelect";
import FormModal from "../../components/modals/FormModal";
import CategoryForm from "../../components/forms/CategoryForm";
import BrandForm from "../../components/forms/BrandForm";
import UnitForm from "../../components/forms/UnitForm";
import MedicineTypeForm from "../../components/forms/MedicineTypeForm";
import { useAuthStore } from "../../store/authStore";
import useBrandStore from "../../store/brandStore";
import useCategoryStore from "../../store/categoryStore";
import useMedicineTypeStore from "../../store/medicineTypeStore";
import useProductStore from "../../store/productStore";
import { useThemeStore } from "../../store/themeStore";
import useUnitStore from "../../store/unitStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.173:8000/api";

const AddProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const { createProduct, updateProduct, getProduct } = useProductStore();
  const { categories, fetchCategories, createCategory } = useCategoryStore();
  const { brands, fetchBrands, createBrand } = useBrandStore();
  const { units, fetchUnits, createUnit } = useUnitStore();
  const { medicineTypes, fetchMedicineTypes, createMedicineType } =
    useMedicineTypeStore();
  const { isDarkMode } = useThemeStore();

  const productId = route.params?.productId;
  const editingProduct = route.params?.product;

  // Form state
  const [formData, setFormData] = useState({
    user_id: user?.id || "",
    name: "",
    sku: "",
    brand_id: "",
    category_id: "",
    unit_amount: "",
    unit_id: "",
    selling_price: "",
    purchase_price: "",
    gst_percentage: "",
    purchase_gst_percentage: "",
    discount_percentage: "",
    description: "",
    is_active: true,
    created_by: user?.id || "",
    conversion_factor: "",
    minimum_stock_quantity: "",
    maximum_stock_quantity: "",
    current_stock: "",
    mrp: "",
    wholesale_price: "",
    gst_hsn_code: "",
    discount_amount: "",
    cess_percentage: "",
    medicine_type_id: "",
    expiry_date: "",
    batch_number: "",
    manufacturer_name: "",
    prescription_required: false,
    schedule_type: "",
    salt_composition: "",
    perishable: false,
    organic_certified: false,
    harvest_date: "",
    storage_instructions: "",
    short_description: "",
    is_featured: false,
    is_returnable: false,
    is_refundable: false,
    warranty_months: "",
    warehouse_location: "",
    supplier_id: "",
    updated_by: user?.id || "",
  });

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Image states
  const [singleImage, setSingleImage] = useState(null);
  const [singleImagePreview, setSingleImagePreview] = useState(null);
  const [existingSingleImage, setExistingSingleImage] = useState(null);

  const [multipleImages, setMultipleImages] = useState([]);
  const [multipleImagePreviews, setMultipleImagePreviews] = useState([]);
  const [existingMultipleImages, setExistingMultipleImages] = useState([]);

  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalIcon, setModalIcon] = useState("");
  const [entitySearchTerm, setEntitySearchTerm] = useState("");

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        await Promise.all([fetchCategories(), fetchBrands(), fetchUnits()]);
        try {
          await fetchMedicineTypes(user?.id);
        } catch (error) {
          console.log("Medicine types not available");
        }
      } catch (error) {
        console.error("Failed to load form data:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load form data",
        });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Load product data if editing
  useEffect(() => {
    if (productId && editingProduct) {
      loadProductData(editingProduct);
    } else if (productId) {
      fetchProductData(productId);
    }
  }, [productId, editingProduct]);

  const fetchProductData = async (id) => {
    try {
      const product = await getProduct(id);
      if (product) {
        loadProductData(product);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load product data",
      });
    }
  };

  const loadProductData = (product) => {
    console.log("🔄 Loading product data for editing:", product.id);

    setFormData((prev) => ({
      ...prev,
      name: product.name || "",
      sku: product.sku || "",
      brand_id: product.brand_id?.toString() || "",
      category_id: product.category_id?.toString() || "",
      unit_amount: product.unit_amount?.toString() || "",
      unit_id: product.unit_id?.toString() || "",
      selling_price: product.selling_price?.toString() || "",
      purchase_price: product.purchase_price?.toString() || "",
      gst_percentage: product.gst_percentage?.toString() || "",
      purchase_gst_percentage:
        product.purchase_gst_percentage?.toString() || "",
      discount_percentage: product.discount_percentage?.toString() || "",
      description: product.description || "",
      is_active: product.is_active === 1,
      conversion_factor: product.conversion_factor?.toString() || "",
      minimum_stock_quantity: product.minimum_stock_quantity?.toString() || "",
      maximum_stock_quantity: product.maximum_stock_quantity?.toString() || "",
      current_stock: product.current_stock?.toString() || "",
      mrp: product.mrp?.toString() || "",
      wholesale_price: product.wholesale_price?.toString() || "",
      gst_hsn_code: product.gst_hsn_code?.toString() || "",
      discount_amount: product.discount_amount?.toString() || "",
      cess_percentage: product.cess_percentage?.toString() || "",
      medicine_type_id: product.medicine_type_id?.toString() || "",
      expiry_date: product.expiry_date || "",
      batch_number: product.batch_number || "",
      manufacturer_name: product.manufacturer_name || "",
      prescription_required: product.prescription_required === 1,
      schedule_type: product.schedule_type || "",
      salt_composition: product.salt_composition || "",
      perishable: product.perishable === 1,
      organic_certified: product.organic_certified === 1,
      harvest_date: product.harvest_date || "",
      storage_instructions: product.storage_instructions || "",
      short_description: product.short_description || "",
      is_featured: product.is_featured === 1,
      is_returnable: product.is_returnable === 1,
      is_refundable: product.is_refundable === 1,
      warranty_months: product.warranty_months?.toString() || "",
      warehouse_location: product.warehouse_location || "",
      supplier_id: product.supplier_id?.toString() || "",
    }));

    // Load variants
    if (product.variants && Array.isArray(product.variants)) {
      setVariants(product.variants);
    }

    // Load attributes
    if (product.attributes) {
      console.log("📋 Loading attributes:", product.attributes);

      let parsedAttributes = product.attributes;

      if (typeof product.attributes === "string") {
        try {
          parsedAttributes = JSON.parse(product.attributes);
          console.log("📋 Parsed attributes from string:", parsedAttributes);
        } catch (error) {
          console.error("Error parsing attributes JSON:", error);
          parsedAttributes = {};
        }
      }

      let attrsArray = [];

      if (Array.isArray(parsedAttributes) && parsedAttributes.length > 0) {
        const mergedAttributes = {};
        parsedAttributes.forEach((attrObj) => {
          if (typeof attrObj === "object" && attrObj !== null) {
            Object.assign(mergedAttributes, attrObj);
          }
        });

        attrsArray = Object.entries(mergedAttributes).map(([key, value]) => ({
          key: key,
          value: String(value),
        }));

        console.log("📋 Attributes from array format:", attrsArray);
      } else if (
        typeof parsedAttributes === "object" &&
        parsedAttributes !== null
      ) {
        attrsArray = Object.entries(parsedAttributes).map(([key, value]) => ({
          key: key,
          value: String(value),
        }));

        console.log("📋 Attributes from object format:", attrsArray);
      }

      if (attrsArray.length > 0) {
        setAttributes(attrsArray);
      } else {
        setAttributes([{ key: "", value: "" }]);
      }
    } else {
      setAttributes([{ key: "", value: "" }]);
    }

    // Load single image
    if (product.image) {
      let imageUrl =
        typeof product.image === "string" ? product.image : product.image.url;
      if (imageUrl) {
        const fullUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `${API_BASE_URL}/storage/${imageUrl}`;
        setSingleImagePreview(fullUrl);
        setExistingSingleImage(imageUrl);
        setSingleImage(null);
      }
    }

    // Load multiple images
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      console.log("📸 Loading multiple images:", product.images.length);

      const previews = [];
      const existingUrls = [];

      product.images.forEach((img, index) => {
        let imgUrl = null;

        if (typeof img === "string") {
          imgUrl = img;
        } else if (img && typeof img === "object") {
          imgUrl = img.image || img.url || img.path || img.src;
        }

        if (imgUrl) {
          const fullUrl = imgUrl.startsWith("http")
            ? imgUrl
            : `${API_BASE_URL}/storage/${imgUrl}`;
          previews.push(fullUrl);
          existingUrls.push(imgUrl);
          console.log(`📸 Image ${index}: ${fullUrl}`);
        }
      });

      setMultipleImagePreviews(previews);
      setExistingMultipleImages(existingUrls);
      setMultipleImages([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Open modal for creating new entity
  const openCreateModal = (type, searchValue = "") => {
    setModalType(type);
    setEntitySearchTerm(searchValue);

    switch (type) {
      case "category":
        setModalTitle("Create Category");
        setModalIcon("shape");
        break;
      case "brand":
        setModalTitle("Create Brand");
        setModalIcon("trademark");
        break;
      case "unit":
        setModalTitle("Create Unit");
        setModalIcon("ruler");
        break;
      case "medicineType":
        setModalTitle("Create Medicine Type");
        setModalIcon("pill");
        break;
      default:
        setModalTitle("Create");
        setModalIcon("plus-circle");
    }

    setModalVisible(true);
  };

  // Create handlers with proper modal closing and success messages
  const handleCreateCategory = async (data) => {
    try {
      const newCategory = await createCategory(data);
      if (newCategory && newCategory.id) {
        await fetchCategories();
        setFormData((prev) => ({
          ...prev,
          category_id: newCategory.id.toString(),
        }));
        setModalVisible(false); // Close modal after success
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Category created successfully",
        });
        return newCategory;
      }
    } catch (error) {
      console.error("Error creating category:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to create category",
      });
      throw error;
    }
  };

  const handleCreateBrand = async (data) => {
    try {
      const newBrand = await createBrand(data);
      if (newBrand && newBrand.id) {
        await fetchBrands();
        setFormData((prev) => ({ ...prev, brand_id: newBrand.id.toString() }));
        setModalVisible(false); // Close modal after success
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Brand created successfully",
        });
        return newBrand;
      }
    } catch (error) {
      console.error("Error creating brand:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to create brand",
      });
      throw error;
    }
  };

  // In AddProductScreen.js, update the handleCreateUnit function
// In AddProductScreen.js, update the handleCreateUnit function
const handleCreateUnit = async (data) => {
  try {
    console.log("Creating unit with data:", data);
    const result = await createUnit(data);
    console.log("Unit creation result:", result);
    
    // Check if the result is successful
    if (result && result.success) {
      // Refresh units list
      await fetchUnits();
      
      // If we have the new unit data, set it in form
      if (result.data && result.data.id) {
        setFormData((prev) => ({ 
          ...prev, 
          unit_id: result.data.id.toString() 
        }));
        console.log("Unit ID set in form:", result.data.id);
      } else {
        // If we don't have the ID from result, wait a bit and get the latest unit
        // The newly created unit should be the last one in the units array
        setTimeout(() => {
          const { units } = useUnitStore.getState();
          if (units && units.length > 0) {
            const latestUnit = units[units.length - 1];
            if (latestUnit && latestUnit.id) {
              setFormData((prev) => ({ 
                ...prev, 
                unit_id: latestUnit.id.toString() 
              }));
              console.log("Unit ID set from latest unit:", latestUnit.id);
            }
          }
        }, 500);
      }
      
      // Close modal after success
      setModalVisible(false);
      
      // Show success message
      Toast.show({ 
        type: "success", 
        text1: "Success", 
        text2: "Unit created successfully" 
      });
      
      return result;
    } else {
      throw new Error(result?.error || "Failed to create unit");
    }
  } catch (error) {
    console.error("Error creating unit:", error);
    Toast.show({ 
      type: "error", 
      text1: "Error", 
      text2: error.message || "Failed to create unit" 
    });
    throw error;
  }
};

  const handleCreateMedicineType = async (data) => {
    try {
      const newMedicineType = await createMedicineType(data);
      if (newMedicineType && newMedicineType.id) {
        await fetchMedicineTypes(user?.id);
        setFormData((prev) => ({
          ...prev,
          medicine_type_id: newMedicineType.id.toString(),
        }));
        setModalVisible(false); // Close modal after success
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Medicine type created successfully",
        });
        return newMedicineType;
      }
    } catch (error) {
      console.error("Error creating medicine type:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to create medicine type",
      });
      throw error;
    }
  };

  // Image picker functions
  const pickSingleImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant camera roll permissions to upload images",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSingleImage(asset);
      setSingleImagePreview(asset.uri);
      setExistingSingleImage(null);
    }
  };

  const pickMultipleImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant camera roll permissions to upload images",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = [...multipleImages, ...result.assets];
      const newPreviews = [
        ...multipleImagePreviews,
        ...result.assets.map((asset) => asset.uri),
      ];
      setMultipleImages(newImages);
      setMultipleImagePreviews(newPreviews);
    }
  };

  const removeSingleImage = () => {
    setSingleImage(null);
    setSingleImagePreview(null);
    setExistingSingleImage(null);
  };

  const removeMultipleImage = (index) => {
    const isNewImage = multipleImages[index];

    if (isNewImage) {
      setMultipleImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const imageToRemove =
        existingMultipleImages[index - multipleImages.length];
      setExistingMultipleImages((prev) =>
        prev.filter((url) => url !== imageToRemove),
      );
    }

    setMultipleImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Variant functions
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { size: "", color: "", material: "", gender: "" },
    ]);
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Attribute functions
  const addAttribute = () => {
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateAttribute = (index, field, value) => {
    setAttributes((prev) =>
      prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr)),
    );
  };

  const removeAttribute = (index) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Product name is required",
      });
      return false;
    }
    if (!formData.sku.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Product SKU is required",
      });
      return false;
    }
    if (!formData.category_id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Category is required",
      });
      return false;
    }
    if (!formData.unit_amount) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unit amount is required",
      });
      return false;
    }
    if (!formData.unit_id) {
      Toast.show({ type: "error", text1: "Error", text2: "Unit is required" });
      return false;
    }

    const sellingPrice = parseFloat(formData.selling_price);
    const purchasePrice = parseFloat(formData.purchase_price);
    if (sellingPrice && purchasePrice && sellingPrice < purchasePrice) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Selling price must be greater than or equal to purchase price",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    const attributesArray = attributes
      .filter((attr) => attr.key && attr.key.trim() !== "")
      .reduce((acc, attr) => {
        if (acc.length === 0) {
          acc.push({});
        }
        acc[0][attr.key.trim()] = attr.value.trim();
        return acc;
      }, []);

    console.log("📋 Attributes being sent:", attributesArray);

    const productData = {
      ...formData,
      user_id: user?.id,
      created_by: user?.id,
      updated_by: user?.id,
      variants: variants.filter(
        (v) => v.size || v.color || v.material || v.gender,
      ),
      attributes: attributesArray.length > 0 ? attributesArray : [],
      is_active: formData.is_active ? 1 : 0,
      prescription_required: formData.prescription_required ? 1 : 0,
      perishable: formData.perishable ? 1 : 0,
      organic_certified: formData.organic_certified ? 1 : 0,
      is_featured: formData.is_featured ? 1 : 0,
      is_returnable: formData.is_returnable ? 1 : 0,
      is_refundable: formData.is_refundable ? 1 : 0,
    };

    // Handle single image
    if (singleImage) {
      productData.image = singleImage;
    } else if (existingSingleImage) {
      productData.image = existingSingleImage;
    } else {
      productData.image = null;
    }

    // Handle multiple images
    const allImages = [];
    if (existingMultipleImages.length > 0) {
      allImages.push(...existingMultipleImages);
    }
    if (multipleImages.length > 0) {
      allImages.push(...multipleImages);
    }
    productData.images = allImages;

    console.log("📸 Product Data being sent:", {
      hasSingleImage: !!productData.image,
      multipleImagesCount: productData.images.length,
      newImagesCount: multipleImages.length,
      existingImagesCount: existingMultipleImages.length,
      attributesCount: attributesArray.length,
    });

    try {
      let result;
      if (productId) {
        result = await updateProduct(productId, productData);
      } else {
        result = await createProduct(productData);
      }

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: productId
            ? "Product updated successfully"
            : "Product created successfully",
        });
        // Navigate back after a short delay to ensure toast is shown
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: result.error || "Failed to save product",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "An error occurred while saving",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text
          className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Loading form data...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <Header
        title={productId ? "Edit Product" : "Add Product"}
        showBackButton={true}
        showSidebar={false}
        rightComponent={null}
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 pb-32">
          {/* Single Image Upload */}
          <View
            className={`rounded-2xl p-4 mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
          >
            <Text
              className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Main Product Image
            </Text>
            <Text
              className={`text-xs mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Upload the main product image
            </Text>

            {singleImagePreview ? (
              <View className="relative w-32 h-32">
                <Image
                  source={{ uri: singleImagePreview }}
                  className="w-32 h-32 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={removeSingleImage}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                >
                  <Icon name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickSingleImage}
                className={`border-2 border-dashed rounded-xl p-6 items-center ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
              >
                <Icon
                  name="cloud-upload"
                  size={40}
                  color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                />
                <Text
                  className={`mt-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  Tap to upload main image
                </Text>
                <Text
                  className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                  PNG, JPG, GIF up to 10MB
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Multiple Images Upload */}
          <View
            className={`rounded-2xl p-4 mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text
                className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Additional Images
              </Text>
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {multipleImagePreviews.length} images
              </Text>
            </View>
            <Text
              className={`text-xs mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Upload additional product images (optional)
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row flex-wrap">
                {multipleImagePreviews.map((preview, index) => (
                  <View key={index} className="relative mr-2 mb-2">
                    <Image
                      source={{ uri: preview }}
                      className="w-24 h-24 rounded-lg"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => removeMultipleImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                    >
                      <Icon name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={pickMultipleImages}
                  className={`border-2 border-dashed rounded-lg w-24 h-24 items-center justify-center ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                >
                  <Icon
                    name="plus"
                    size={30}
                    color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                  />
                  <Text
                    className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Basic Information */}
          <View
            className={`rounded-2xl p-4 mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
          >
            <Text
              className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Basic Information
            </Text>

            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Product Name *
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                placeholder="Enter product name"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
              />
            </View>

            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Product Code (SKU) *
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                placeholder="Enter product SKU"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                value={formData.sku}
                onChangeText={(value) =>
                  handleInputChange("sku", value.toUpperCase())
                }
              />
            </View>

            <SearchSelect
              label="Brand"
              options={brands.map((b) => ({
                value: b.id.toString(),
                label: b.name,
              }))}
              value={formData.brand_id}
              onSelect={(value) => handleInputChange("brand_id", value)}
              placeholder="Search for a brand..."
              isDarkMode={isDarkMode}
              onCreateNew={(searchTerm) => openCreateModal("brand", searchTerm)}
            />

            <SearchSelect
              label="Category *"
              options={categories.map((c) => ({
                value: c.id.toString(),
                label: c.name,
              }))}
              value={formData.category_id}
              onSelect={(value) => handleInputChange("category_id", value)}
              placeholder="Search for a category..."
              required
              isDarkMode={isDarkMode}
              onCreateNew={(searchTerm) =>
                openCreateModal("category", searchTerm)
              }
            />
          </View>

          {/* Pricing Information */}
          <View
            className={`rounded-2xl p-4 mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
          >
            <Text
              className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Pricing Information
            </Text>

            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Unit Amount *
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                placeholder="Enter unit amount"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                keyboardType="numeric"
                value={formData.unit_amount}
                onChangeText={(value) =>
                  handleInputChange("unit_amount", value)
                }
              />
            </View>

            <SearchSelect
              label="Unit *"
              options={units.map((u) => ({
                value: u.id.toString(),
                label: `${u.name} (${u.code})`,
              }))}
              value={formData.unit_id}
              onSelect={(value) => handleInputChange("unit_id", value)}
              placeholder="Search for a unit..."
              required
              isDarkMode={isDarkMode}
              onCreateNew={(searchTerm) => openCreateModal("unit", searchTerm)}
            />

            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Purchase Price
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                placeholder="Enter purchase price"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                keyboardType="numeric"
                value={formData.purchase_price}
                onChangeText={(value) =>
                  handleInputChange("purchase_price", value)
                }
              />
            </View>

            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Selling Price
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                placeholder="Enter selling price"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                keyboardType="numeric"
                value={formData.selling_price}
                onChangeText={(value) =>
                  handleInputChange("selling_price", value)
                }
              />
            </View>

            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                GST Percentage
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                placeholder="Enter GST percentage"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                keyboardType="numeric"
                value={formData.gst_percentage}
                onChangeText={(value) => {
                  handleInputChange("gst_percentage", value);
                  handleInputChange("purchase_gst_percentage", value);
                }}
              />
            </View>

            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Discount Percentage
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                placeholder="Enter discount percentage"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                keyboardType="numeric"
                value={formData.discount_percentage}
                onChangeText={(value) =>
                  handleInputChange("discount_percentage", value)
                }
              />
            </View>
          </View>

          {/* Product Description */}
          <View
            className={`rounded-2xl p-4 mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
          >
            <Text
              className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Product Description
            </Text>

            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Description
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                placeholder="Enter detailed product description..."
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(value) =>
                  handleInputChange("description", value)
                }
              />
            </View>

            <View className="flex-row items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-gray-700">
              <View>
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Active Product
                </Text>
                <Text
                  className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Enable this product for sales and display
                </Text>
              </View>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => handleInputChange("is_active", value)}
                trackColor={{ false: "#767577", true: "#3b82f6" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Medicine Information */}
          {medicineTypes.length > 0 && (
            <View
              className={`rounded-2xl p-4 mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
            >
              <Text
                className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Medicine Information
              </Text>

              <SearchSelect
                label="Medicine Type"
                options={medicineTypes.map((m) => ({
                  value: m.id.toString(),
                  label: m.name,
                }))}
                value={formData.medicine_type_id}
                onSelect={(value) =>
                  handleInputChange("medicine_type_id", value)
                }
                placeholder="Search for a medicine type..."
                isDarkMode={isDarkMode}
                onCreateNew={(searchTerm) =>
                  openCreateModal("medicineType", searchTerm)
                }
              />
            </View>
          )}

          {/* Variants Section */}
          <View
            className={`rounded-2xl p-4 mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Product Variants
              </Text>
              <TouchableOpacity
                onPress={addVariant}
                className="bg-blue-500 px-3 py-2 rounded-lg"
              >
                <Text className="text-white text-sm">Add Variant</Text>
              </TouchableOpacity>
            </View>

            {variants.map((variant, index) => (
              <View
                key={index}
                className="mb-4 p-3 border rounded-xl border-gray-200 dark:border-gray-700"
              >
                <View className="flex-row justify-end mb-2">
                  <TouchableOpacity onPress={() => removeVariant(index)}>
                    <Icon name="close-circle" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View className="mb-3">
                  <TextInput
                    className={`border rounded-xl px-3 py-2 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                    placeholder="Size"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                    value={variant.size}
                    onChangeText={(value) =>
                      updateVariant(index, "size", value)
                    }
                  />
                </View>
                <View className="mb-3">
                  <TextInput
                    className={`border rounded-xl px-3 py-2 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                    placeholder="Color"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                    value={variant.color}
                    onChangeText={(value) =>
                      updateVariant(index, "color", value)
                    }
                  />
                </View>
                <View className="mb-3">
                  <TextInput
                    className={`border rounded-xl px-3 py-2 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                    placeholder="Material"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                    value={variant.material}
                    onChangeText={(value) =>
                      updateVariant(index, "material", value)
                    }
                  />
                </View>
                <View>
                  <Text
                    className={`text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Gender
                  </Text>
                  <View className="flex-row">
                    {["male", "female", "unisex"].map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        onPress={() => updateVariant(index, "gender", gender)}
                        className={`mr-3 px-4 py-1 rounded-full ${variant.gender === gender ? "bg-blue-500" : isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                      >
                        <Text
                          className={`capitalize ${variant.gender === gender ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {gender}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ))}

            {variants.length === 0 && (
              <Text
                className={`text-center py-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                No variants added. Tap "Add Variant" to add product variants.
              </Text>
            )}
          </View>

          {/* Attributes Section */}
          <View
            className={`rounded-2xl p-4 mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Product Attributes
              </Text>
              <TouchableOpacity
                onPress={addAttribute}
                className="bg-blue-500 px-3 py-2 rounded-lg"
              >
                <Text className="text-white text-sm">Add Attribute</Text>
              </TouchableOpacity>
            </View>

            {attributes.map((attr, index) => (
              <View key={index} className="mb-3 flex-row items-center">
                <View className="flex-1 mr-2">
                  <TextInput
                    className={`border rounded-xl px-3 py-2 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                    placeholder="Key (e.g., Color, Size, Material)"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                    value={attr.key}
                    onChangeText={(value) =>
                      updateAttribute(index, "key", value)
                    }
                  />
                </View>
                <View className="flex-2 mr-2">
                  <TextInput
                    className={`border rounded-xl px-3 py-2 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                    placeholder="Value (e.g., Red, Large, Cotton)"
                    placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                    value={attr.value}
                    onChangeText={(value) =>
                      updateAttribute(index, "value", value)
                    }
                  />
                </View>
                <TouchableOpacity onPress={() => removeAttribute(index)}>
                  <Icon name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {attributes.length === 1 &&
              attributes[0].key === "" &&
              attributes[0].value === "" && (
                <Text
                  className={`text-center py-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  No attributes added. Tap "Add Attribute" to add product
                  specifications.
                </Text>
              )}
          </View>
          <LinearGradient
            style={{ borderRadius: 8 }}
            colors={["#3b82f6", "#2563eb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-xl"
          >
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="py-4 items-center"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  {productId ? "Update Product" : "Create Product"}
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Form Modal for Creating Entities */}
      <FormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        icon={modalIcon}
        isDarkMode={isDarkMode}
      >
        {modalType === "category" && (
          <CategoryForm
            onSubmit={handleCreateCategory}
            initialData={{ name: entitySearchTerm }}
            isDarkMode={isDarkMode}
            onCancel={() => setModalVisible(false)}
          />
        )}
        {modalType === "brand" && (
          <BrandForm
            onSubmit={handleCreateBrand}
            initialData={{ name: entitySearchTerm }}
            isDarkMode={isDarkMode}
            onCancel={() => setModalVisible(false)}
          />
        )}
        {modalType === "unit" && (
          <UnitForm
            onSubmit={handleCreateUnit}
            initialData={{ name: entitySearchTerm }}
            isDarkMode={isDarkMode}
            onCancel={() => setModalVisible(false)}
          />
        )}
        {modalType === "medicineType" && (
          <MedicineTypeForm
            onSubmit={handleCreateMedicineType}
            initialData={{ name: entitySearchTerm }}
            isDarkMode={isDarkMode}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </FormModal>
    </KeyboardAvoidingView>
  );
};

export default AddProductScreen;
