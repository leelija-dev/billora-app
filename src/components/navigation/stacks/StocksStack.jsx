// components/navigation/stacks/StocksStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import StocksScreen from "../../../screens/stocks/StocksScreen";
import AddStockScreen from "../../../screens/stocks/AddStockScreen";
import StockDetailScreen from "../../../screens/stocks/StockDetailScreen";
import AddStockQuantityScreen from "../../../screens/stocks/AddStockQuantityScreen";

const Stack = createNativeStackNavigator();

const StocksStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="StocksMain" 
        component={StocksScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Stock Management" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="AddStock" 
        component={AddStockScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Add Stock" navigation={navigation} />,
        })}
      />
      <Stack.Screen 
        name="StockDetail" 
        component={StockDetailScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Stock Details" navigation={navigation} />,
        })}
      />
      <Stack.Screen 
        name="AddStockQuantity" 
        component={AddStockQuantityScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Add Stock Quantity" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default StocksStackNavigator;