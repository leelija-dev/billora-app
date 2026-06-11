// components/navigation/StackHeader.js
import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const StackHeader = ({ title, navigation, showBack = true, rightComponent = null }) => {
  const { isDarkMode } = useThemeStore();

  return (
    <LinearGradient
      colors={isDarkMode ? ["#4f46e5", "#7c3aed"] : ["#6366F1", "#8B5CF6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="pt-12 pb-4 px-4"
      style={{
        shadowColor: isDarkMode ? "#4f46e5" : "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View className="flex-row items-center">
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 w-10 h-10 rounded-2xl bg-white/20 items-center justify-center"
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text className="text-2xl font-bold text-white flex-1">{title}</Text>
        {rightComponent ? (
          rightComponent
        ) : (
          !showBack && (
            <View className="flex-row">
              <TouchableOpacity
                className="mr-3 w-10 h-10 rounded-2xl bg-white/20 items-center justify-center"
                activeOpacity={0.7}
              >
                <Icon name="bell-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center"
                activeOpacity={0.7}
              >
                <Icon name="magnify" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
    </LinearGradient>
  );
};

export default StackHeader;