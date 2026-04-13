import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  color = '#6366F1',
  gradient,
  trend,
  onPress,
  style,
}) => {
  const { isDarkMode } = useThemeStore();

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
  };

  const getTrendColor = () => {
    if (!trend) return isDarkMode ? '#9CA3AF' : '#6B7280';
    return trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : (isDarkMode ? '#9CA3AF' : '#6B7280');
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  // If gradient is provided, render with LinearGradient
  if (gradient) {
    return (
      <CardComponent
        activeOpacity={onPress ? 0.8 : 1}
        onPress={onPress}
        style={style}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="p-4">
            <View className="flex-row justify-between items-start mb-2">
              <View className="w-10 h-10 rounded-lg bg-white/20 items-center justify-center">
                <Text className="text-white text-xl">{icon}</Text>
              </View>
              {trend !== undefined && (
                <View className="flex-row items-center">
                  <Text style={{ color: getTrendColor() }} className="text-xs mr-1">
                    {getTrendIcon()}
                  </Text>
                  <Text style={{ color: getTrendColor() }} className="text-xs font-semibold">
                    {Math.abs(trend)}%
                  </Text>
                </View>
              )}
            </View>
            
            <Text className="text-white text-2xl font-bold mb-1">{value}</Text>
            <Text className="text-white/80 text-sm">{title}</Text>
            {subtitle && <Text className="text-white/60 text-xs mt-1">{subtitle}</Text>}
          </View>
        </LinearGradient>
      </CardComponent>
    );
  }

  // Original non-gradient version with dark mode support
  return (
    <CardComponent
      className={`rounded-xl p-4 border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}
      style={[
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View 
          className="w-10 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: isDarkMode ? `${color}30` : `${color}20` }}
        >
          <Text className="text-xl" style={{ color }}>{icon}</Text>
        </View>
        {trend !== undefined && (
          <View className="flex-row items-center">
            <Text style={{ color: getTrendColor() }} className="text-xs mr-1">
              {getTrendIcon()}
            </Text>
            <Text style={{ color: getTrendColor() }} className="text-xs font-semibold">
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      
      <Text className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </Text>
      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {title}
      </Text>
      {subtitle && (
        <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {subtitle}
        </Text>
      )}
    </CardComponent>
  );
};

export default StatsCard;