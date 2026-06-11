// components/navigation/stacks/StoresStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import StoresScreen from "../../../screens/stores/StoresScreen";
import AddStoreScreen from "../../../screens/stores/AddStoreScreen";
import StoreDetailScreen from "../../../screens/stores/StoreDetailScreen";

const Stack = createNativeStackNavigator();

const StoresStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="StoresMain" 
        component={StoresScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Stores" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="AddStore" 
        component={AddStoreScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Add Store" navigation={navigation} />,
        })}
      />
      <Stack.Screen 
        name="StoreDetail" 
        component={StoreDetailScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Store Details" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default StoresStackNavigator;