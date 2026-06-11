// components/navigation/stacks/BillsStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import BillsScreen from "../../../screens/bills/BillsScreen";
import CreateBillScreen from "../../../screens/bills/CreateBillScreen";
import BillDetailScreen from "../../../screens/bills/BillDetailScreen";

const Stack = createNativeStackNavigator();

const BillsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="BillsMain" 
        component={BillsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Bills & Invoices" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="CreateBill" 
        component={CreateBillScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Create Bill" navigation={navigation} />,
        })}
      />
      <Stack.Screen 
        name="BillDetail" 
        component={BillDetailScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Bill Details" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default BillsStackNavigator;