// components/navigation/stacks/MedicineTypesStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import MedicineTypesScreen from "../../../screens/medicineTypes/MedicineTypesScreen";

const Stack = createNativeStackNavigator();

const MedicineTypesStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="MedicineTypesMain" 
        component={MedicineTypesScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Medicine Types" navigation={navigation} showBack={false} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default MedicineTypesStackNavigator;
