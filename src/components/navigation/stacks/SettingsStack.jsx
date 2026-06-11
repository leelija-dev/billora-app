// components/navigation/stacks/SettingsStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeStore } from "../../../store/themeStore";
import StackHeader from "../StackHeader";
import SettingsScreen from "../../../screens/settings/SettingsScreen";
import ProfileScreen from "../../../screens/profile/ProfileScreen";
import ChangePasswordScreen from "../../../screens/profile/ChangePasswordScreen";
import NotificationSettingsScreen from "../../../screens/settings/NotificationSettingsScreen";
import AppearanceSettingsScreen from "../../../screens/settings/AppearanceSettingsScreen";
import LanguageSettingsScreen from "../../../screens/settings/LanguageSettingsScreen";
import AboutScreen from "../../../screens/settings/AboutScreen";
import PrivacyPolicyScreen from "../../../screens/settings/PrivacyPolicyScreen";
import TermsOfServiceScreen from "../../../screens/settings/TermsOfServiceScreen";

const Stack = createNativeStackNavigator();

const SettingsStackNavigator = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: isDarkMode ? "#111827" : "#F8FAFC" },
      }}
    >
      {/* Main Settings */}
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Settings" navigation={navigation} showBack={false} />,
        })}
      />

      {/* Profile Settings */}
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Profile" navigation={navigation} />,
        })}
      />

      {/* Security Settings */}
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Change Password" navigation={navigation} />,
        })}
      />

      {/* Notification Settings */}
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Notifications" navigation={navigation} />,
        })}
      />

      {/* Appearance Settings */}
      <Stack.Screen 
        name="AppearanceSettings" 
        component={AppearanceSettingsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Appearance" navigation={navigation} />,
        })}
      />

      {/* Language Settings */}
      <Stack.Screen 
        name="LanguageSettings" 
        component={LanguageSettingsScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Language" navigation={navigation} />,
        })}
      />

      {/* About */}
      <Stack.Screen 
        name="About" 
        component={AboutScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="About" navigation={navigation} />,
        })}
      />

      {/* Legal */}
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Privacy Policy" navigation={navigation} />,
        })}
      />

      <Stack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen} 
        options={({ navigation }) => ({
          header: () => <StackHeader title="Terms of Service" navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator;