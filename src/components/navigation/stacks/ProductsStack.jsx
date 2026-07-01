// components/navigation/stacks/ProductsStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import ProductsScreen from "../../../screens/products/ProductsScreen";
import AddProductScreen from "../../../screens/products/AddProductScreen";
import DeletedProductsScreen from "../../../screens/products/DeletedProductsScreen";
import ProductDetailScreen from "../../../screens/products/ProductDetailScreen";

const Stack = createNativeStackNavigator();

const ProductsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="ProductsMain" 
        component={ProductsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Products" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="AddProduct" 
        component={AddProductScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Add Product" navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="DeletedProduct"
        component={DeletedProductsScreen}
        options={({ navigation }) => ({
          header: () => <StackHeader title="Deleted Products" navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ navigation }) => ({
          header: () => <StackHeader title="Product Details" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default ProductsStackNavigator;