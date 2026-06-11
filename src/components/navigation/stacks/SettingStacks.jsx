// components/navigation/stacks/SettingsStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import SettingsScreen from "../../../screens/settings/SettingsScreen";
import ProfileScreen from "../../../screens/profile/ProfileScreen";

const Stack = createNativeStackNavigator();

const SettingsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Settings" navigation={navigation} showBack={false} />,
        })}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Profile" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator;