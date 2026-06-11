// components/navigation/stacks/ReportsStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import ReportsScreen from "../../../screens/reports/ReportsScreen";
import ReportDetailScreen from "../../../screens/reports/ReportDetailScreen";

const Stack = createNativeStackNavigator();

const ReportsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="ReportsMain" 
        component={ReportsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Reports & Analytics" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="ReportDetail" 
        component={ReportDetailScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Report Details" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default ReportsStackNavigator;