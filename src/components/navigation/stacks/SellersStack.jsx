// components/navigation/stacks/SellersStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import SellersScreen from "../../../screens/sellers/SellersScreen";
import SellerDetailScreen from "../../../screens/sellers/SellerDetailScreen";

const Stack = createNativeStackNavigator();

const SellersStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="SellersMain" 
        component={SellersScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Sellers" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="SellerDetail" 
        component={SellerDetailScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Seller Details" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default SellersStackNavigator;
