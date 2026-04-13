import { Easing } from "react-native";

export const fadeIn = (duration = 300) => ({
  from: { opacity: 0 },
  to: { opacity: 1 },
  config: { duration, useNativeDriver: true },
});

export const slideInFromRight = (duration = 300) => ({
  from: { translateX: 300, opacity: 0 },
  to: { translateX: 0, opacity: 1 },
  config: { duration, easing: Easing.out(Easing.cubic), useNativeDriver: true },
});

export const scaleIn = (duration = 300) => ({
  from: { scale: 0.8, opacity: 0 },
  to: { scale: 1, opacity: 1 },
  config: { duration, useNativeDriver: true },
});

export const pulseAnimation = (value, scale = 1.1) => ({
  toValue: scale,
  duration: 200,
  useNativeDriver: true,
});
