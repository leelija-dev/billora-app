// components/navigation/stacks/CategoriesStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import CategoriesScreen from "../../../screens/categories/CategoriesScreen";

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
    </Stack.Navigator>
  );
};

export default CategoriesStackNavigator;