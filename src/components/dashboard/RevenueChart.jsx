import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/helpers';

const { width: screenWidth } = Dimensions.get('window');

const RevenueChart = ({
  data = [],
  title = 'Revenue Trend',
  period = 'month',
  style,
}) => {
  const { isDarkMode } = useThemeStore();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    const labels = data.map(item => {
      switch (period) {
        case 'day':
          return item.date?.split('-')[2] || '';
        case 'week':
          return `W${item.week}`;
        case 'month':
          return item.month?.substring(0, 3) || '';
        case 'year':
          return item.year?.toString() || '';
        default:
          return item.date || '';
      }
    });

    const values = data.map(item => item.revenue || 0);

    return {
      labels,
      datasets: [{ data: values }],
    };
  }, [data, period]);

  const chartConfig = {
    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    backgroundGradientFrom: isDarkMode ? '#1F2937' : '#FFFFFF',
    backgroundGradientTo: isDarkMode ? '#1F2937' : '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode 
      ? `rgba(255, 255, 255, ${opacity})` 
      : `rgba(75, 85, 99, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#6366F1',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: isDarkMode ? '#374151' : '#E5E7EB',
      strokeWidth: 1,
    },
    formatYLabel: (value) => {
      const num = parseFloat(value);
      if (num >= 1000) {
        return `$${Math.round(num / 1000)}k`;
      }
      return `$${Math.round(num)}`;
    },
  };

  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const averageRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  return (
    <View 
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
    >
      <View className="mb-4">
        <Text className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </Text>
        <View className="flex-row gap-6">
          <View className="flex-1">
            <Text className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Total
            </Text>
            <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(totalRevenue)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Average
            </Text>
            <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(averageRevenue)}
            </Text>
          </View>
        </View>
      </View>
      
      <View className="items-center">
        <LineChart
          data={chartData}
          width={screenWidth - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            borderRadius: 16,
          }}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          withHorizontalLines={true}
          withDots={true}
          withShadow={false}
          segments={4}
        />
      </View>
    </View>
  );
};

export default RevenueChart;