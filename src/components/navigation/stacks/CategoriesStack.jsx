// components/navigation/stacks/CategoriesStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import CategoriesScreen from "../../../screens/categories/CategoriesScreen";
import AddCategoryScreen from "../../../screens/categories/AddCategoryScreen";
import CategoryDetailScreen from "../../../screens/categories/CategoryDetailScreen";

const Stack = createNativeStackNavigator();

const CategoriesStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="CategoriesMain" 
        component={CategoriesScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Categories" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="AddCategory" 
        component={AddCategoryScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Add Category" navigation={navigation} />,
        })}
      />
      <Stack.Screen 
        name="CategoryDetail" 
        component={CategoryDetailScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Category Details" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default CategoriesStackNavigator;