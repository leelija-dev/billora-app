// components/navigation/ModernTabBar.js
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const { width } = Dimensions.get("window");

// Define the 4 fixed tabs to display
const FIXED_TABS = [
  {
    name: "Products",
    label: "Products",
    icon: "package-variant",
    iconActive: "package-variant",
  },
  {
    name: "Invoices",
    label: "Invoices",
    icon: "file-document",
    iconActive: "file-document",
  },
  { name: "Orders", label: "Orders", icon: "shopping", iconActive: "shopping" },
  { name: "Settings", label: "Settings", icon: "cog", iconActive: "cog" },
];

const ModernTabBar = ({ state, descriptors, navigation, tabs }) => {
  const { isDarkMode } = useThemeStore();
  const [tabPositions, setTabPositions] = useState({});
  const [sliderWidth, setSliderWidth] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  // Use fixed tabs instead of the passed tabs
  const visibleTabs = FIXED_TABS;

  // Find the original route index for the fixed tab
  const getRouteIndexForTab = (tabName) => {
    return state.routes.findIndex((route) => route.name === tabName);
  };

  useEffect(() => {
    // Find which fixed tab corresponds to the current route
    const currentRouteName = state.routes[state.index]?.name;
    const currentTabIndex = visibleTabs.findIndex(
      (tab) => tab.name === currentRouteName,
    );

    if (currentTabIndex !== -1 && tabPositions[currentTabIndex]) {
      const { x, width } = tabPositions[currentTabIndex];
      Animated.spring(animation, {
        toValue: x,
        useNativeDriver: false,
        tension: 300,
        friction: 25,
      }).start();
      setSliderWidth(width);
    }
  }, [state.index, tabPositions, state.routes]);

  const handleTabPress = (index) => {
    const tab = visibleTabs[index];
    if (!tab) return;

    // Check if the tab's screen exists in the navigator
    const routeExists = state.routes.some((route) => route.name === tab.name);

    if (routeExists) {
      const event = navigation.emit({
        type: "tabPress",
        target: state.routes.find((r) => r.name === tab.name)?.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(tab.name);
      }
    }
  };

  const onTabLayout = (index, event) => {
    const { x, width } = event.nativeEvent.layout;
    setTabPositions((prev) => ({ ...prev, [index]: { x, width } }));
    if (index === 0 && !tabPositions[0]) {
      setSliderWidth(width);
      animation.setValue(x);
    }
  };

  if (!visibleTabs || visibleTabs.length === 0) {
    return null;
  }

  // Get current active index based on route name
  const currentRouteName = state.routes[state.index]?.name;
  const activeIndex = visibleTabs.findIndex(
    (tab) => tab.name === currentRouteName,
  );

  return (
    <View className="absolute bottom-0 left-0 right-0 hidden">
      <View className="mx-4 mb-2 rounded-3xl overflow-hidden">
        <BlurView
          intensity={80}
          tint={isDarkMode ? "dark" : "light"}
          className="overflow-hidden"
          style={{
            backgroundColor: isDarkMode
              ? "rgba(17, 24, 39, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            borderRadius: 30,
          }}
        >
          <View
            className="flex-row items-center"
            style={{
              position: "relative",
              height: 45,
            }}
          >
            {/* Animated Sliding Background */}
            <Animated.View
              style={{
                position: "absolute",
                left: animation,
                width: sliderWidth,
                height: 45,
                backgroundColor: isDarkMode ? "#4f46e5" : "#6366F1",
                borderRadius: 25,
                marginVertical: 5,
              }}
            />

            {visibleTabs.map((tab, index) => {
              const isFocused = activeIndex === index;

              return (
                <TouchableOpacity
                  key={tab.name}
                  onPress={() => handleTabPress(index)}
                  onLayout={(event) => onTabLayout(index, event)}
                  activeOpacity={0.7}
                  className="items-center justify-center flex-1"
                  style={{
                    flexDirection: "row",
                    paddingVertical: 12,
                    paddingHorizontal: isFocused ? 18 : 12,
                    zIndex: 1,
                  }}
                >
                  <Icon
                    name={isFocused ? tab.iconActive : tab.icon}
                    size={22}
                    color={
                      isFocused ? "white" : isDarkMode ? "#9CA3AF" : "#6B7280"
                    }
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>

      {/* Extra bottom padding for safe area */}
      <View
        style={{
          height: 10,
          backgroundColor: isDarkMode ? "#111827" : "#F8FAFC",
          width: "100%",
        }}
      />
    </View>
  );
};

export default ModernTabBar;
