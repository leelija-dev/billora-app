import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, Modal, Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const EnhancedLoading = ({
  visible = false,
  text = "Loading...",
  progress = 0,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Rotation animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      // Reset animations when hidden
      spinValue.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <LinearGradient
          colors={["#ffffff", "#f8f9fa"]}
          style={{
            width: 256,
            padding: 32,
            borderRadius: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Animated.View
            style={{
              transform: [{ rotate: spin }, { scale: pulseAnim }],
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon name="loading" size={40} color="#667eea" />
            </View>
          </Animated.View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {text}
          </Text>

          {progress > 0 && (
            <View
              style={{
                width: "100%",
                height: 8,
                backgroundColor: "#e5e7eb",
                borderRadius: 4,
                overflow: "hidden",
                marginTop: 8,
              }}
            >
              <Animated.View
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: "#667eea",
                }}
              />
            </View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default EnhancedLoading;
