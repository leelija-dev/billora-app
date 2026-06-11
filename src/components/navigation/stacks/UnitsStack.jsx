// components/navigation/stacks/UnitsStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import UnitsScreen from "../../../screens/units/UnitsScreen";
import AddUnitScreen from "../../../screens/units/AddUnitScreen";
import UnitDetailScreen from "../../../screens/units/UnitDetailScreen";

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
      <Stack.Screen 
        name="AddUnit" 
        component={AddUnitScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Add Unit" navigation={navigation} />,
        })}
      />
      <Stack.Screen 
        name="UnitDetail" 
        component={UnitDetailScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Unit Details" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default UnitsStackNavigator;