import { View, Text } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { format } from 'date-fns';

const ThermalBillTemplate = ({ bill }) => {
  const { isDarkMode } = useThemeStore();

  if (!bill) return null;

  // Helper function to safely parse numbers
  const parseNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    const num = parseNumber(value);
    return num.toFixed(2);
  };

  // Calculate totals from invoice_items
  const calculateSubtotal = () => {
    if (!bill.invoice_items || !Array.isArray(bill.invoice_items)) return 0;
    return bill.invoice_items.reduce((sum, item) => {
      return sum + parseNumber(item.total_price);
    }, 0);
  };

  const calculateTotalGST = () => {
    if (!bill.invoice_items || !Array.isArray(bill.invoice_items)) return 0;
    return bill.invoice_items.reduce((sum, item) => {
      const itemPrice = parseNumber(item.price);
      const itemGst = parseNumber(item.gst);
      const quantity = parseNumber(item.quantity);
      const subtotal = itemPrice * quantity;
      return sum + (subtotal * itemGst / 100);
    }, 0);
  };

  const calculateTotalDiscount = () => {
    if (!bill.invoice_items || !Array.isArray(bill.invoice_items)) return 0;
    return bill.invoice_items.reduce((sum, item) => {
      const itemPrice = parseNumber(item.price);
      const itemDiscount = parseNumber(item.discount);
      const quantity = parseNumber(item.quantity);
      const subtotal = itemPrice * quantity;
      return sum + (subtotal * itemDiscount / 100);
    }, 0);
  };

  return (
    <View className={`p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`} style={{ width: '100%' }}>
      {/* Store Header - You might need to fetch store details separately or from context */}
      <View className="items-center mb-4">
        <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Your Store Name
        </Text>
        <Text className={`text-xs text-center mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Store Address
        </Text>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Tel: Store Phone
        </Text>
      </View>

      {/* Separator */}
      <View className={`border-t border-dashed my-2 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-300'
      }`} />

      {/* Invoice Info */}
      <View className="mb-3">
        <View className="flex-row justify-between">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Invoice:
          </Text>
          <Text className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {bill.invoice_no || 'N/A'}
          </Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Date:
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {bill.created_at ? format(new Date(bill.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Customer - You might need to fetch customer details separately */}
      <View className="mb-3">
        <Text className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Customer ID: {bill.customer_id || 'Walk-in Customer'}
        </Text>
      </View>

      {/* Separator */}
      <View className={`border-t border-dashed my-2 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-300'
      }`} />

      {/* Items */}
      <View className="mb-3">
        {/* Header */}
        <View className="flex-row mb-1">
          <Text className={`flex-[3] text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Item
          </Text>
          <Text className={`flex-1 text-xs font-bold text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Qty
          </Text>
          <Text className={`flex-1 text-xs font-bold text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Price
          </Text>
          <Text className={`flex-1 text-xs font-bold text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Total
          </Text>
        </View>

        {/* Items List */}
        {bill.invoice_items?.map((item, index) => {
          // Safely convert item values to numbers
          const itemPrice = parseNumber(item.price);
          const itemTotal = parseNumber(item.total_price);
          const quantity = parseNumber(item.quantity);
          
          return (
          <View key={item.id || index} className="flex-row py-1">
            <Text className={`flex-[3] text-xs ${isDarkMode ? 'text-white' : 'text-gray-800'}`} numberOfLines={1}>
              Product #{item.product_id}
            </Text>
            <Text className={`flex-1 text-xs text-right ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {quantity}
            </Text>
            <Text className={`flex-1 text-xs text-right ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ${formatCurrency(itemPrice)}
            </Text>
            <Text className={`flex-1 text-xs font-semibold text-right text-green-500`}>
              ${formatCurrency(itemTotal)}
            </Text>
          </View>
          );
        })}
      </View>

      {/* Separator */}
      <View className={`border-t border-dashed my-2 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-300'
      }`} />

      {/* Summary */}
      <View className="mb-3">
        <View className="flex-row justify-between mb-1">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Subtotal:
          </Text>
          <Text className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            ${formatCurrency(calculateSubtotal())}
          </Text>
        </View>
        <View className="flex-row justify-between mb-1">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            GST:
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            ${formatCurrency(calculateTotalGST())}
          </Text>
        </View>
        <View className="flex-row justify-between mb-1">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Discount:
          </Text>
          <Text className="text-xs text-green-500">
            -${formatCurrency(calculateTotalDiscount())}
          </Text>
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            TOTAL:
          </Text>
          <Text className="text-base font-bold text-blue-500">
            ${formatCurrency(bill.total_amount)}
          </Text>
        </View>
      </View>

      {/* Payment */}
      <View className="mb-3">
        <View className="flex-row justify-between">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Paid:
          </Text>
          <Text className="text-xs font-semibold text-green-500">
            ${formatCurrency(bill.paid_amount)}
          </Text>
        </View>
        {parseNumber(bill.change_amount) > 0 && (
          <View className="flex-row justify-between mt-1">
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Change:
            </Text>
            <Text className="text-xs font-semibold text-blue-500">
              ${formatCurrency(bill.change_amount)}
            </Text>
          </View>
        )}
      </View>

      {/* Separator */}
      <View className={`border-t border-dashed my-2 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-300'
      }`} />

      {/* Footer */}
      <View className="items-center">
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Thank you for your purchase!
        </Text>
        <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
        </Text>
      </View>
    </View>
  );
};

export default ThermalBillTemplate;