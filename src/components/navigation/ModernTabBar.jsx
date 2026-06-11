// components/navigation/ModernTabBar.js
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const { width } = Dimensions.get("window");

const ModernTabBar = ({ state, descriptors, navigation, tabs }) => {
  const { isDarkMode } = useThemeStore();
  const [tabPositions, setTabPositions] = useState({});
  const [sliderWidth, setSliderWidth] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabPositions[state.index]) {
      const { x, width } = tabPositions[state.index];
      Animated.spring(animation, {
        toValue: x,
        useNativeDriver: false,
        tension: 300,
        friction: 25,
      }).start();
      setSliderWidth(width);
    }
  }, [state.index, tabPositions]);

  const handleTabPress = (index) => {
    const event = navigation.emit({
      type: "tabPress",
      target: state.routes[index].key,
      canPreventDefault: true,
    });

    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(tabs[index].name);
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

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <View className="absolute bottom-0 left-0 right-0">
      <View className="mx-4 mb-2 rounded-3xl overflow-hidden">
        <BlurView
          intensity={50}
          tint={isDarkMode ? "dark" : "light"}
          className="overflow-hidden"
          style={{
            backgroundColor: isDarkMode
              ? "rgba(31, 41, 55, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
            borderRadius: 30,
          }}
        >
          <View
            className="flex-row items-center"
            style={{
              backgroundColor: isDarkMode
                ? "rgba(31, 41, 55, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              position: "relative",
              height: 50,
            }}
          >
            {/* Animated Sliding Background */}
            <Animated.View
              style={{
                position: "absolute",
                left: animation,
                width: sliderWidth,
                height: 50,
                backgroundColor: isDarkMode ? "#4f46e5" : "#6366F1",
                borderRadius: 30,
                marginVertical: 6,
              }}
            />

            {tabs.map((tab, index) => {
              const isFocused = state.index === index;
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
                  {isFocused && (
                    <Text
                      className="ml-2 font-medium"
                      style={{ color: "white", fontSize: 14 }}
                    >
                      {tab.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>

      <View
        style={{
          height: 20,
          backgroundColor: isDarkMode ? "#111827" : "#F8FAFC",
          width: "100%",
        }}
      />
    </View>
  );
};

export default ModernTabBar;