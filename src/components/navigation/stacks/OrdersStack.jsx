// components/navigation/stacks/OrdersStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OrderDetailsScreen from "../../../screens/orders/OrderDetailsScreen";
import OrdersScreen from "../../../screens/orders/OrdersScreen";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";

const Stack = createNativeStackNavigator();

const OrdersStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen
        name="OrdersMain"
        component={OrdersScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader
              title="Orders"
              navigation={navigation}
              showBack={false}
            />
          ),
        })}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={({ navigation }) => ({
          header: () => (
            <StackHeader title="Order Details" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default OrdersStackNavigator;
