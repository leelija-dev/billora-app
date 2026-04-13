import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Text, View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./components/ThemeProvider";
import { useAuthStore } from "./store/authStore";
import LoginScreen from "./screens/auth/LoginScreen";
import RegisterScreen from "./screens/auth/RegisterScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";
import MainNavigator from "./components/navigation/MainNavigator";
import "./global.css";

const Stack = createNativeStackNavigator();

const SplashScreen = ({ progress }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2", "#6b8cff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
          }}
        >
          <View style={{
            width: 128,
            height: 128,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.2)',
            marginBottom: 32,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Image
                source={"./assets/icon.png"}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <Text style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 8,
            letterSpacing: 1,
          }}>
            Your App Name
          </Text>

          <Text style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 48,
            textAlign: 'center',
          }}>
            Manage your business with ease
          </Text>

          <View style={{
            width: 256,
            height: 8,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <Animated.View
              style={{
                width: progress.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
                height: '100%',
                backgroundColor: 'white',
                borderRadius: 4,
              }}
            />
          </View>

          <Text style={{
            color: 'rgba(255,255,255,0.6)',
            marginTop: 16,
          }}>
            Setting things up...
          </Text>
        </Animated.View>
      </View>

      <Text style={{
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
      }}>
        Version 1.0.0
      </Text>
    </LinearGradient>
  );
};

const AppLoadingScreen = () => {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 100,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SplashScreen progress={progress} />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
};

const ThemedStatusBar = () => {
  const theme = useTheme();
  const barStyle = theme.isDark ? "light" : "dark";

  return (
    <StatusBar
      style={barStyle}
      backgroundColor={theme.colors.background}
      translucent={false}
    />
  );
};

const AuthStack = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

const AppContent = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (appReady && !authLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [appReady, authLoading]);

  const initializeApp = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setAppReady(true);
    } catch (error) {
      console.error("App initialization error:", error);
    }
  };

  if (!appReady || authLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        colors: {
          background: theme?.colors?.background || (theme?.isDark ? '#111827' : '#F8FAFC')
        },
        fonts: {
          regular: {
            fontFamily: Platform.select({
              ios: 'Arial',
              android: 'Roboto',
              default: 'Arial'
            })
          }
        }
      }}
    >
      <ThemedStatusBar />
      <Animated.View 
        style={{ 
          flex: 1, 
          opacity: fadeAnim,
          backgroundColor: theme?.colors?.background || (theme?.isDark ? '#111827' : '#F8FAFC')
        }}
      >
        {isAuthenticated ? <MainNavigator /> : <AuthStack />}
      </Animated.View>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}