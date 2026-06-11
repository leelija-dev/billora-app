// components/navigation/stacks/CustomersStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import CustomersScreen from "../../../screens/customers/CustomersScreen";
import AddCustomerScreen from "../../../screens/customers/AddCustomerScreen";
import CustomerDetailScreen from "../../../screens/customers/CustomerDetailScreen";

const Stack = createNativeStackNavigator();

const CustomersStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="CustomersMain" 
        component={CustomersScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Customers" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="AddCustomer" 
        component={AddCustomerScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Add Customer" navigation={navigation} />,
        })}
      />
      <Stack.Screen 
        name="CustomerDetail" 
        component={CustomerDetailScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Customer Details" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default CustomersStackNavigator;