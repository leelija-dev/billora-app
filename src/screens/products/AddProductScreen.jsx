import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import SearchSelect from "../../components/common/SearchSelect";
import { useAuthStore } from "../../store/authStore";
import useBrandStore from "../../store/brandStore";
import useCategoryStore from "../../store/categoryStore";
import useMedicineTypeStore from "../../store/medicineTypeStore";
import useProductStore from "../../store/productStore";
import { useThemeStore } from "../../store/themeStore";
import useUnitStore from "../../store/unitStore";

// Create Modals
const CategoryModal = ({
  visible,
  onClose,
  onCreate,
  initialName,
  isDarkMode,
}) => {
  const { user } = useAuthStore();
  const [name, setName] = useState(initialName || "");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && initialName) {
      setName(initialName);
    } else if (!visible) {
      setName("");
      setDescription("");
    }
  }, [visible, initialName]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Category name is required",
      });
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description,
        user_id: user?.id,
        created_by: user?.id,
        is_active: true,
      });
      onClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create category",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View
          className={`rounded-xl w-full ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-xl overflow-hidden`}
        >
          <View
            className={`flex-row justify-between items-center p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <Text
              className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Create Category
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon
                name="close"
                size={24}
                color={isDarkMode ? "#9CA3AF" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>
          <View className="p-4">
            <Text
              className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Category Name *
            </Text>
            <TextInput
              className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
              placeholder="Enter category name"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={name}
              onChangeText={setName}
            />
            <Text
              className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Description (Optional)
            </Text>
            <TextInput
              className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
              placeholder="Enter description"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
            <View className="flex-row justify-end space-x-3 pt-2">
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 mr-2"
              >
                <Text
                  className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" />
                    <Text className="text-white ml-2">Create</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const BrandModal = ({
  visible,
  onClose,
  onCreate,
  initialName,
  isDarkMode,
}) => {
  const { user } = useAuthStore();
  const [name, setName] = useState(initialName || "");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && initialName) {
      setName(initialName);
    } else if (!visible) {
      setName("");
      setDescription("");
    }
  }, [visible, initialName]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Brand name is required",
      });
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description,
        user_id: user?.id,
        created_by: user?.id,
        is_active: true,
      });
      onClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create brand",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View
          className={`rounded-xl w-full ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-xl overflow-hidden`}
        >
          <View
            className={`flex-row justify-between items-center p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <Text
              className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Create Brand
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon
                name="close"
                size={24}
                color={isDarkMode ? "#9CA3AF" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>
          <View className="p-4">
            <Text
              className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Brand Name *
            </Text>
            <TextInput
              className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
              placeholder="Enter brand name"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={name}
              onChangeText={setName}
            />
            <Text
              className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Description (Optional)
            </Text>
            <TextInput
              className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
              placeholder="Enter description"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
            <View className="flex-row justify-end space-x-3 pt-2">
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 mr-2"
              >
                <Text
                  className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" />
                    <Text className="text-white ml-2">Create</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const UnitModal = ({ visible, onClose, onCreate, initialName, isDarkMode }) => {
  const { user } = useAuthStore();
  const [name, setName] = useState(initialName || "");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && initialName) {
      setName(initialName);
      const generatedCode = initialName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .substring(0, 20);
      setCode(generatedCode);
    } else if (!visible) {
      setName("");
      setCode("");
    }
  }, [visible, initialName]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unit name is required",
      });
      return;
    }
    if (!code.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unit code is required",
      });
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        user_id: user?.id,
        is_active: true,
      });
      onClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create unit",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View
          className={`rounded-xl w-full ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-xl overflow-hidden`}
        >
          <View
            className={`flex-row justify-between items-center p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <Text
              className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Create Unit
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon
                name="close"
                size={24}
                color={isDarkMode ? "#9CA3AF" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>
          <View className="p-4">
            <Text
              className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Unit Name *
            </Text>
            <TextInput
              className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
              placeholder="Enter unit name (e.g., Pieces, Kilograms)"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (
                  !code ||
                  code ===
                    name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "_")
                      .substring(0, 20)
                ) {
                  setCode(
                    text
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "_")
                      .substring(0, 20),
                  );
                }
              }}
            />
            <Text
              className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Unit Code *
            </Text>
            <TextInput
              className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
              placeholder="Enter unit code (e.g., pcs, kg)"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />
            <View className="flex-row justify-end space-x-3 pt-2">
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 mr-2"
              >
                <Text
                  className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" />
                    <Text className="text-white ml-2">Create</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const MedicineTypeModal = ({
  visible,
  onClose,
  onCreate,
  initialName,
  isDarkMode,
}) => {
  const { user } = useAuthStore();
  const [name, setName] = useState(initialName || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && initialName) {
      setName(initialName);
    } else if (!visible) {
      setName("");
    }
  }, [visible, initialName]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Medicine type name is required",
      });
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        user_id: user?.id,
        is_active: true,
      });
      onClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create medicine type",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View
          className={`rounded-xl w-full ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-xl overflow-hidden`}
        >
          <View
            className={`flex-row justify-between items-center p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <Text
              className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Create Medicine Type
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon
                name="close"
                size={24}
                color={isDarkMode ? "#9CA3AF" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>
          <View className="p-4">
            <Text
              className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Medicine Type Name *
            </Text>
            <TextInput
              className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
              placeholder="Enter medicine type (e.g., Tablet, Capsule)"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              value={name}
              onChangeText={setName}
            />
            <View className="flex-row justify-end space-x-3 pt-2">
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 mr-2"
              >
                <Text
                  className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" />
                    <Text className="text-white ml-2">Create</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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

  // Image states - IMPORTANT: Keep original image URLs for editing
  const [singleImage, setSingleImage] = useState(null); // For new image upload
  const [singleImagePreview, setSingleImagePreview] = useState(null);
  const [existingSingleImage, setExistingSingleImage] = useState(null); // Store existing image URL for edit

  const [multipleImages, setMultipleImages] = useState([]); // Array of new image objects
  const [multipleImagePreviews, setMultipleImagePreviews] = useState([]);
  const [existingMultipleImages, setExistingMultipleImages] = useState([]); // Store existing image URLs for edit

  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showMedicineTypeModal, setShowMedicineTypeModal] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [brandSearchTerm, setBrandSearchTerm] = useState("");
  const [unitSearchTerm, setUnitSearchTerm] = useState("");
  const [medicineTypeSearchTerm, setMedicineTypeSearchTerm] = useState("");

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
    // Set form values
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
      let parsedAttributes = product.attributes;
      if (typeof product.attributes === "string") {
        try {
          parsedAttributes = JSON.parse(product.attributes);
        } catch (error) {
          parsedAttributes = {};
        }
      }
      if (typeof parsedAttributes === "object" && parsedAttributes !== null) {
        const attrsArray = Object.entries(parsedAttributes).map(
          ([key, value]) => ({
            key,
            value: String(value),
          }),
        );
        setAttributes(
          attrsArray.length > 0 ? attrsArray : [{ key: "", value: "" }],
        );
      }
    }

    // Load single image - store as existing image URL
    if (product.image) {
      let imageUrl =
        typeof product.image === "string" ? product.image : product.image.url;
      if (imageUrl) {
        const fullUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `${API_BASE_URL.replace("/api", "")}/storage/${imageUrl}`;
        setSingleImagePreview(fullUrl);
        setExistingSingleImage(imageUrl); // Store the existing image URL
        setSingleImage(null); // No new image to upload
      }
    }

    // Load multiple images - store as existing image URLs
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      const previews = [];
      const existingUrls = [];
      product.images.forEach((img) => {
        let imgUrl = typeof img === "string" ? img : img.url;
        if (imgUrl) {
          const fullUrl = imgUrl.startsWith("http")
            ? imgUrl
            : `${API_BASE_URL.replace("/api", "")}/storage/${imgUrl}`;
          previews.push(fullUrl);
          existingUrls.push(imgUrl); // Store the existing image URL
        }
      });
      setMultipleImagePreviews(previews);
      setExistingMultipleImages(existingUrls);
      setMultipleImages([]); // No new images to upload
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Image picker functions for single image
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
      setSingleImage(asset); // Store the new image object
      setSingleImagePreview(asset.uri);
      setExistingSingleImage(null); // Clear existing image since we're replacing it
    }
  };

  // Image picker functions for multiple images
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
    // Check if this is a new image or an existing image
    const isNewImage = multipleImages[index];

    if (isNewImage) {
      // Remove from new images array
      setMultipleImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      // This is an existing image, remove from existing images array
      const imageToRemove =
        existingMultipleImages[index - multipleImages.length];
      setExistingMultipleImages((prev) =>
        prev.filter((url) => url !== imageToRemove),
      );
    }

    // Remove from previews
    setMultipleImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

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

  // Create handlers
  const handleCreateCategory = async (categoryData) => {
    try {
      const newCategory = await createCategory(categoryData);
      if (newCategory) {
        setFormData((prev) => ({
          ...prev,
          category_id: newCategory.id?.toString(),
        }));
        await fetchCategories();
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Category created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating category:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create category",
      });
    }
  };

  const handleCreateBrand = async (brandData) => {
    try {
      const newBrand = await createBrand(brandData);
      if (newBrand) {
        setFormData((prev) => ({ ...prev, brand_id: newBrand.id?.toString() }));
        await fetchBrands();
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Brand created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating brand:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create brand",
      });
    }
  };

  const handleCreateUnit = async (unitData) => {
    try {
      const result = await createUnit(unitData);
      if (result.success) {
        await fetchUnits();
        setFormData((prev) => ({
          ...prev,
          unit_id: result.data?.id?.toString(),
        }));
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Unit created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating unit:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create unit",
      });
    }
  };

  const handleCreateMedicineType = async (medicineTypeData) => {
    try {
      const newMedicineType = await createMedicineType(medicineTypeData);
      if (newMedicineType) {
        setFormData((prev) => ({
          ...prev,
          medicine_type_id: newMedicineType.id?.toString(),
        }));
        await fetchMedicineTypes(user?.id);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Medicine type created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating medicine type:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create medicine type",
      });
    }
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    // Prepare attributes array
    const attributesArray = attributes
      .filter((attr) => attr.key.trim() !== "")
      .reduce((acc, attr) => {
        if (acc.length === 0) acc.push({});
        acc[0][attr.key.trim()] = attr.value.trim();
        return acc;
      }, []);

    // Prepare product data with proper image handling
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

    // Handle single image - if there's a new image to upload, send the file object
    if (singleImage) {
      productData.image = singleImage; // This will be the file object for upload
    } else if (existingSingleImage) {
      productData.image = existingSingleImage; // This is the existing image URL string
    } else {
      productData.image = null;
    }

    // Handle multiple images - combine existing and new images
    const allImages = [];

    // Add existing images (as strings)
    if (existingMultipleImages.length > 0) {
      allImages.push(...existingMultipleImages);
    }

    // Add new images (as file objects for upload)
    if (multipleImages.length > 0) {
      allImages.push(...multipleImages);
    }

    productData.images = allImages;

    console.log("📸 Product Data being sent:", {
      hasSingleImage: !!productData.image,
      singleImageType: productData.image
        ? typeof productData.image === "string"
          ? "string"
          : "file"
        : "none",
      multipleImagesCount: productData.images.length,
      newImagesCount: multipleImages.length,
      existingImagesCount: existingMultipleImages.length,
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
        navigation.goBack();
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
        text2: "An error occurred while saving",
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
    <ScrollView
      className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <View className="p-4">
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

        {/* Basic Information - Same as before */}
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
            onCreateNew={(searchTerm) => {
              setBrandSearchTerm(searchTerm);
              setShowBrandModal(true);
            }}
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
            onCreateNew={(searchTerm) => {
              setCategorySearchTerm(searchTerm);
              setShowCategoryModal(true);
            }}
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
              onChangeText={(value) => handleInputChange("unit_amount", value)}
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
            onCreateNew={(searchTerm) => {
              setUnitSearchTerm(searchTerm);
              setShowUnitModal(true);
            }}
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
              onChangeText={(value) => handleInputChange("description", value)}
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

        {/* Medicine Information (Conditional) */}
        {(medicineTypes.length > 0 || medicineTypes !== undefined) && (
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
              onSelect={(value) => handleInputChange("medicine_type_id", value)}
              placeholder="Search for a medicine type..."
              isDarkMode={isDarkMode}
              onCreateNew={(searchTerm) => {
                setMedicineTypeSearchTerm(searchTerm);
                setShowMedicineTypeModal(true);
              }}
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
                  onChangeText={(value) => updateVariant(index, "size", value)}
                />
              </View>
              <View className="mb-3">
                <TextInput
                  className={`border rounded-xl px-3 py-2 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                  placeholder="Color"
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                  value={variant.color}
                  onChangeText={(value) => updateVariant(index, "color", value)}
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
                  placeholder="Key (e.g., Color)"
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
                  value={attr.key}
                  onChangeText={(value) => updateAttribute(index, "key", value)}
                />
              </View>
              <View className="flex-2 mr-2">
                <TextInput
                  className={`border rounded-xl px-3 py-2 ${isDarkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-800 bg-white"}`}
                  placeholder="Value (e.g., Red)"
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
        </View>
      </View>

      {/* Submit Button */}
      <View className="p-4 pb-24">
        <LinearGradient
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

      {/* Create Modals */}
      <CategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCreate={handleCreateCategory}
        initialName={categorySearchTerm}
        isDarkMode={isDarkMode}
      />

      <BrandModal
        visible={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        onCreate={handleCreateBrand}
        initialName={brandSearchTerm}
        isDarkMode={isDarkMode}
      />

      <UnitModal
        visible={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onCreate={handleCreateUnit}
        initialName={unitSearchTerm}
        isDarkMode={isDarkMode}
      />

      <MedicineTypeModal
        visible={showMedicineTypeModal}
        onClose={() => setShowMedicineTypeModal(false)}
        onCreate={handleCreateMedicineType}
        initialName={medicineTypeSearchTerm}
        isDarkMode={isDarkMode}
      />
    </ScrollView>
  );
};

export default AddProductScreen;
