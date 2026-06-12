// components/navigation/stacks/UnitsStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import UnitsScreen from "../../../screens/units/UnitsScreen";

const Stack = createNativeStackNavigator();

const UnitsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="UnitsMain" 
        component={UnitsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Units" navigation={navigation} showBack={false} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default UnitsStackNavigator;