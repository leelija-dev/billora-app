// components/navigation/AuthNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { NAVIGATION_SCREENS } from '../../utils/constants';
import LoginScreen from '../../screens/auth/LoginScreen';
import RegisterScreen from '../../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <Stack.Navigator
      initialRouteName={NAVIGATION_SCREENS.AUTH.LOGIN}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { 
          backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' 
        },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_SCREENS.AUTH.LOGIN}
        component={LoginScreen}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.AUTH.REGISTER}
        component={RegisterScreen}
      />
      <Stack.Screen
        name={NAVIGATION_SCREENS.AUTH.FORGOT_PASSWORD}
        component={ForgotPasswordScreen}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;