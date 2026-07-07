// components/navigation/stacks/InvoicesStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import InvoicesScreen from "../../../screens/invoices/InvoicesScreen";
import InvoiceDetailScreen from "../../../screens/invoices/InvoiceDetailScreen";
import InvoiceFormScreen from "../../../screens/invoices/InvoiceFormScreen";

const Stack = createNativeStackNavigator();

const InvoicesStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="InvoicesMain" 
        component={InvoicesScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Invoices" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="InvoiceDetail" 
        component={InvoiceDetailScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Invoice Details" navigation={navigation} />,
        })}
      />
      <Stack.Screen 
        name="InvoiceForm" 
        component={InvoiceFormScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Create Invoice" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default InvoicesStackNavigator;
