// components/navigation/stacks/PackagesStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import PackagesScreen from "../../../screens/packages/PackagesScreen";

const Stack = createNativeStackNavigator();

const PackagesStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="PackagesMain" 
        component={PackagesScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Packages" navigation={navigation} showBack={false} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default PackagesStackNavigator;
