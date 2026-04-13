import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { billsAPI } from "../../api/bills";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import A4BillTemplate from "../../components/bills/A4BillTemplate";
import ThermalBillTemplate from "../../components/bills/ThermalBillTemplate";
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const BillDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { billId } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printFormat, setPrintFormat] = useState('a4');

  useEffect(() => {
    fetchBill();
  }, [billId]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const response = await billsAPI.getById(billId);
      
      let billData = null;
      if (response?.data?.data) {
        billData = response.data.data;
      } else if (response?.data) {
        billData = response.data;
      } else {
        billData = response;
      }
      
      // Debug log to see the actual structure
      console.log('Bill data received:', billData);
      console.log('Total amount:', billData?.total_amount);
      console.log('Invoice items:', billData?.invoice_items);
      
      setBill(billData);
    } catch (err) {
      setError(err.message || 'Failed to fetch bill');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate("CreateBill", { billId });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Bill",
      "Are you sure you want to delete this bill?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await billsAPI.delete(billId);
              Alert.alert("Success", "Bill deleted successfully");
              navigation.goBack();
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to delete bill");
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      // Helper function to parse numbers
      const parseNumber = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value) || 0;
        return 0;
      };

      const formatCurrency = (value) => {
        return parseNumber(value).toFixed(2);
      };

      const billText = `
Invoice: ${bill?.invoice_no || 'N/A'}
Date: ${bill?.created_at ? format(new Date(bill.created_at), 'PPP') : 'N/A'}
Customer ID: ${bill?.customer_id || 'Walk-in Customer'}
Total: $${formatCurrency(bill?.total_amount)}
Paid: $${formatCurrency(bill?.paid_amount)}
Change: $${formatCurrency(bill?.change_amount)}
      `;
      
      await Share.share({
        message: billText,
        title: `Invoice ${bill?.invoice_no || 'Unknown'}`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handlePrint = (format) => {
    setPrintFormat(format);
    setShowPrintPreview(true);
  };

  const executePrint = async () => {
    try {
      if (!bill) {
        Alert.alert('Error', 'No bill data available for printing');
        return;
      }

      // Debug log to see bill structure before printing
      console.log('Bill data for printing:', bill);
      console.log('Bill total_amount type:', typeof bill.total_amount);
      console.log('Bill total_amount value:', bill.total_amount);

      // Generate HTML for bill
      const html = generateBillHTML(bill, printFormat);
      
      // Print bill
      await Print.printAsync({
        html,
        name: `Invoice_${bill.invoice_no || 'Unknown'}`,
        orientation: printFormat === 'a4' ? 'portrait' : 'portrait',
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
      });

      setShowPrintPreview(false);
      Alert.alert('Success', 'Bill sent to printer successfully');
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print bill. Please check your printer connection.');
    }
  };

  const shareAsPDF = async () => {
    try {
      if (!bill) {
        Alert.alert('Error', 'No bill data available for sharing');
        return;
      }

      // Generate HTML for bill
      const html = generateBillHTML(bill, printFormat);
      
      // Create PDF file
      const { uri } = await Print.printToFileAsync({
        html,
        name: `Invoice_${bill.invoice_no || 'Unknown'}`,
        orientation: printFormat === 'a4' ? 'portrait' : 'portrait',
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
      });

      // Share PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Invoice ${bill.invoice_no || 'Unknown'}`,
        UTI: 'com.adobe.pdf',
      });

      setShowPrintPreview(false);
    } catch (error) {
      console.error('Share PDF error:', error);
      Alert.alert('Error', 'Failed to create PDF for sharing');
    }
  };

  const generateBillHTML = (bill, printFormat) => {
    const isA4 = printFormat === 'a4';
    const width = isA4 ? '210mm' : '80mm';
    const padding = isA4 ? '20px' : '10px';
    const fontSize = isA4 ? '12px' : '10px';
    
    // Helper function to parse numbers
    const parseNumber = (value) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value) || 0;
      return 0;
    };

    const formatCurrency = (value) => {
      return parseNumber(value).toFixed(2);
    };

    // Calculate totals
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${bill.invoice_no || 'Unknown'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: ${fontSize};
            margin: 0;
            padding: ${padding};
            width: ${width};
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .store-name {
            font-size: ${isA4 ? '24px' : '18px'};
            font-weight: bold;
            margin-bottom: 5px;
          }
          .invoice-title {
            font-size: ${isA4 ? '20px' : '16px'};
            font-weight: bold;
            margin: 15px 0;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .customer-info {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .items-table .text-right {
            text-align: right;
          }
          .summary {
            margin-top: 20px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .total-row {
            border-top: 1px solid #ddd;
            padding-top: 10px;
            margin-top: 10px;
            font-weight: bold;
            font-size: ${isA4 ? '16px' : '14px'};
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: ${isA4 ? '12px' : '10px'};
            color: #666;
          }
          .text-success {
            color: #28a745;
          }
          .text-info {
            color: #17a2b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">Your Store Name</div>
          <div>Store Address</div>
          <div>Store Phone</div>
        </div>

        <div class="invoice-title">TAX INVOICE</div>
        
        <div class="invoice-info">
          <div>
            <div><strong>Invoice No:</strong> ${bill.invoice_no || 'N/A'}</div>
            <div><strong>Date:</strong> ${bill.created_at ? format(new Date(bill.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</div>
          </div>
        </div>

        <div class="customer-info">
          <div><strong>Customer ID:</strong> ${bill.customer_id || 'Walk-in Customer'}</div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">GST</th>
              <th class="text-right">Disc</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.invoice_items?.map((item, index) => {
              const itemPrice = parseNumber(item.price);
              const itemTotal = parseNumber(item.total_price);
              const itemGst = parseNumber(item.gst);
              const itemDiscount = parseNumber(item.discount);
              const quantity = parseNumber(item.quantity);
              
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>Product #${item.product_id}</td>
                  <td class="text-right">${quantity}</td>
                  <td class="text-right">$${formatCurrency(itemPrice)}</td>
                  <td class="text-right">${itemGst || 0}%</td>
                  <td class="text-right">${itemDiscount || 0}%</td>
                  <td class="text-right text-success">$${formatCurrency(itemTotal)}</td>
                </tr>
              `;
            }).join('') || ''}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${formatCurrency(bill.total_amount)}</span>
          </div>
          <div class="summary-row">
            <span>Total GST:</span>
            <span>$${formatCurrency(calculateTotalGST())}</span>
          </div>
          <div class="summary-row">
            <span>Total Discount:</span>
            <span class="text-success">-$${formatCurrency(calculateTotalDiscount())}</span>
          </div>
          <div class="total-row">
            <span>Grand Total:</span>
            <span>$${formatCurrency(bill.total_amount)}</span>
          </div>
          <div class="summary-row">
            <span>Amount Paid:</span>
            <span class="text-success">$${formatCurrency(bill.paid_amount)}</span>
          </div>
          ${parseNumber(bill.change_amount) > 0 ? `
            <div class="summary-row">
              <span>Change Returned:</span>
              <span class="text-info">$${formatCurrency(bill.change_amount)}</span>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <div>This is a computer generated invoice</div>
          <div>Thank you for your business!</div>
        </div>
      </body>
      </html>
    `;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1">
          <Loading text="Loading bill details..." />
        </SafeAreaView>
      </View>
    );
  }

  if (error || !bill) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1">
          <ErrorState
            title="Bill Not Found"
            description="The bill you're looking for doesn't exist or couldn't be loaded."
            onRetry={() => navigation.goBack()}
          />
        </SafeAreaView>
      </View>
    );
  }

  // Helper function for number parsing in the main component
  const parseNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  const formatCurrency = (value) => {
    return parseNumber(value).toFixed(2);
  };

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header */}
        <View className={`px-4 py-3 flex-row items-center border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <Icon name="arrow-left" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
          </TouchableOpacity>
          <Text className={`flex-1 text-center text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Bill Details
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleShare}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon name="share-variant" size={22} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}
            >
              <Icon name="pencil" size={22} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Invoice Header */}
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            className="rounded-2xl p-6 mt-4 mb-4"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="items-center">
              <Text className="text-white/80 text-sm">INVOICE</Text>
              <Text className="text-white text-3xl font-bold mt-1">
                {bill.invoice_no || 'N/A'}
              </Text>
              <View className="flex-row mt-2">
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white text-sm">
                    {formatDate(bill.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Customer & Store Info */}
          <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row mb-4">
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Customer
                </Text>
                <Text className={`text-base font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {bill.customer?.name || `Customer ID: ${bill.customer_id || 'Walk-in Customer'}`}
                </Text>
                {bill.customer?.phone && (
                  <Text className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {bill.customer.phone}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Store
                </Text>
                <Text className={`text-base font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {bill.store?.name || 'Main Store'}
                </Text>
                {bill.store?.gst && (
                  <Text className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    GST: {bill.store.gst}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Items List */}
          <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Items
            </Text>

            {bill.invoice_items?.map((item, index) => {
              // Safely convert price to number
              const itemPrice = parseNumber(item.price);
              const itemTotal = parseNumber(item.total_price);
              const itemGst = parseNumber(item.gst);
              const itemDiscount = parseNumber(item.discount);
              const quantity = parseNumber(item.quantity);
              
              return (
              <View key={item.id || index} className={`mb-3 pb-3 ${
                index < bill.invoice_items.length - 1 ? 'border-b' : ''
              } ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {item.product?.name || `Product #${item.product_id}`}
                    </Text>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Qty: {quantity} × ${formatCurrency(itemPrice)}
                      {itemGst > 0 && ` | GST: ${itemGst}%`}
                      {itemDiscount > 0 && ` | Disc: ${itemDiscount}%`}
                    </Text>
                  </View>
                  <Text className={`font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    ${formatCurrency(itemTotal)}
                  </Text>
                </View>
              </View>
              );
            })}

            {/* Totals */}
            <View className="mt-4 pt-4 border-t border-dashed ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }">
              <View className="flex-row justify-between mb-2">
                <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Subtotal
                </Text>
                <Text className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                  ${formatCurrency(bill.total_amount)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Paid Amount
                </Text>
                <Text className="text-green-500 font-semibold">
                  ${formatCurrency(bill.paid_amount)}
                </Text>
              </View>
              {parseNumber(bill.change_amount) > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Change
                  </Text>
                  <Text className="text-blue-500">
                    ${formatCurrency(bill.change_amount)}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between mt-2 pt-2 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }">
                <Text className={`text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Grand Total
                </Text>
                <Text className="text-lg font-bold text-blue-500">
                  ${formatCurrency(bill.total_amount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Print Options */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => handlePrint('a4')}
              className="flex-1 bg-purple-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="file-pdf-box" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">A4 Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePrint('thermal')}
              className="flex-1 bg-orange-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="printer" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Thermal</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={handleDelete}
              className="flex-1 bg-red-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="delete" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEdit}
              className="flex-1 bg-blue-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="pencil" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Edit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Print Preview Modal */}
      <Modal
        visible={showPrintPreview}
        animationType="slide"
        onRequestClose={() => setShowPrintPreview(false)}
      >
        <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <SafeAreaView className="flex-1">
            <View className={`px-4 py-3 flex-row items-center border-b ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <TouchableOpacity
                onPress={() => setShowPrintPreview(false)}
                className="mr-4"
              >
                <Icon name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>
              <Text className={`text-xl font-semibold flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Print Preview
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={shareAsPDF}
                  className="bg-green-500 px-4 py-2 rounded-xl flex-row items-center"
                >
                  <Icon name="share" size={16} color="#ffffff" />
                  <Text className="text-white font-semibold ml-1">Share PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={executePrint}
                  className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center"
                >
                  <Icon name="printer" size={16} color="#ffffff" />
                  <Text className="text-white font-semibold ml-1">Print</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1">
              {printFormat === 'a4' ? (
                <A4BillTemplate bill={bill} />
              ) : (
                <ThermalBillTemplate bill={bill} />
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

export default BillDetailScreen;