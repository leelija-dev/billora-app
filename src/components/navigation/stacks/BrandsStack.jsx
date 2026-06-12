// components/navigation/stacks/BrandsStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import BrandsScreen from "../../../screens/brands/BrandsScreen";

const Stack = createNativeStackNavigator();

const BrandsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="BrandsMain" 
        component={BrandsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Brands" navigation={navigation} showBack={false} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default BrandsStackNavigator;