// screens/reports/ReportDetailScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Share,
  Alert,
  Modal,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from 'expo-print';
import { useThemeStore } from "../../store/themeStore";
import { useReports } from "../../hooks/useReports";
import { formatDate } from "../../utils/dateFormatter";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { WebView } from 'react-native-webview';

const ReportDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { reportId, reportType } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { reports, loading: reportsLoading, fetchReports, summary } = useReports();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [hasFetched, setHasFetched] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printPreviewVisible, setPrintPreviewVisible] = useState(false);
  const [printHTML, setPrintHTML] = useState('');
  const [exportDropdownVisible, setExportDropdownVisible] = useState(false);
  const reportViewRef = useRef();

  useEffect(() => {
    if (!hasFetched) {
      loadReportData();
      setHasFetched(true);
    }
  }, [reportId, summary, reportType]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      console.log('Loading report data for reportId:', reportId, 'reportType:', reportType);
      console.log('Available reports:', reports);
      
      if (reports && reports.length > 0) {
        const foundReport = reports.find(r => r.id == reportId);
        console.log('Found report:', foundReport);
        if (foundReport) {
          setReport(foundReport);
          setLoading(false);
          return;
        }
      }

      console.log('No reports available, fetching reports data with wider date range...');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const { reportsAPI } = await import('../../api/reports');
      const response = await reportsAPI.getReports({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        type: reportType
      });
      
      console.log('Direct API Response:', response);
      
      let reportsData = [];
      if (response?.data && response?.salesItem_details) {
        const apiData = response.data;
        const salesItems = response.salesItem_details;
        
        if (Array.isArray(salesItems) && salesItems.length > 0) {
          reportsData = salesItems.map((item, index) => ({
            id: item.id || index + 1,
            title: `Sales Report - ${new Date(item.created_at).toLocaleDateString()}`,
            type: 'sales',
            amount: parseFloat(item.total_amount) || 0,
            count: parseInt(item.total_items) || 1,
            date: item.created_at,
            description: `Sales report for order #${item.id}`,
            status: item.status || 'completed',
            invoice_items: item.invoice_items || [],
            customer_id: item.customer_id,
            store_id: item.store_id,
            paid_amount: parseFloat(item.paid_amount) || 0,
            user_id: item.user_id,
            details: [
              { label: 'Order ID', value: `#${item.id}` },
              { label: 'Customer', value: `Customer ${item.customer_id}` },
              { label: 'Store', value: `Store ${item.store_id}` },
              { label: 'Paid Amount', value: `$${parseFloat(item.paid_amount || 0).toFixed(2)}` },
              { label: 'Total Items', value: item.total_items || '1' }
            ]
          }));
        }
      }
      
      console.log('Directly processed reports:', reportsData);
      
      if (reportsData && reportsData.length > 0) {
        const foundReport = reportsData.find(r => r.id == reportId);
        console.log('Found report from direct API:', foundReport);
        console.log('Looking for reportId:', reportId, 'type:', typeof reportId);
        console.log('Available report IDs:', reportsData.map(r => ({ id: r.id, type: typeof r.id })));
        if (foundReport) {
          setReport(foundReport);
          setLoading(false);
          return;
        }
      }

      console.log('Report not found after direct API call, creating summary report');
      createSummaryReport();
    } catch (error) {
      console.error('Error loading report:', error);
      createSummaryReport();
    } finally {
      setLoading(false);
    }
  };

  const createSummaryReport = () => {
    const summaryReport = {
      id: reportId || 'summary',
      type: reportType || 'summary',
      title: `${reportType ? reportType.charAt(0).toUpperCase() + reportType.slice(1) : 'Summary'} Report`,
      date: new Date(),
      amount: summary?.totalSales || 0,
      count: summary?.totalOrders || 0,
      status: 'completed',
      description: `Overall ${reportType || 'summary'} report for the selected period`,
      totalSales: summary?.totalSales || 0,
      totalOrders: summary?.totalOrders || 0,
      totalDue: summary?.totalDue || 0,
      customerDues: summary?.customerDues || [],
      topProducts: summary?.topProducts || [],
      lowStockItems: summary?.lowStockItems || 0,
      details: [
        { label: 'Total Sales', value: formatCurrency(summary?.totalSales || 0) },
        { label: 'Total Orders', value: (summary?.totalOrders || 0).toString() },
        { label: 'Total Due', value: formatCurrency(summary?.totalDue || 0) },
        { label: 'Low Stock Items', value: (summary?.lowStockItems || 0).toString() },
      ],
      data: [
        { name: 'Product A', quantity: 10, amount: 500 },
        { name: 'Product B', quantity: 8, amount: 400 },
        { name: 'Product C', quantity: 5, amount: 250 },
      ]
    };
    setReport(summaryReport);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${report?.title || 'Report'} - ${formatCurrency(report?.amount)}\nDate: ${formatDate(report?.date)}\nType: ${report?.type}`,
        title: report?.title || 'Report Details',
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share report");
    }
  };

  // Generate HTML for Print
  const generatePrintHTML = () => {
    const typeIcon = getTypeIcon();
    const currentDate = new Date().toLocaleString();
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${report?.title || 'Report'}</title>
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background: #fff;
              padding: 20px;
            }
            .report-container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #3b82f6;
            }
            .header h1 {
              color: #1e293b;
              font-size: 28px;
              margin-bottom: 10px;
              font-weight: 700;
            }
            .header .subtitle {
              color: #64748b;
              font-size: 14px;
            }
            .company-info {
              text-align: center;
              margin-bottom: 30px;
              color: #475569;
            }
            .report-badge {
              display: inline-block;
              padding: 8px 20px;
              background: ${typeIcon.bg === 'bg-green-500' ? '#10b981' : 
                           typeIcon.bg === 'bg-orange-500' ? '#f59e0b' :
                           typeIcon.bg === 'bg-purple-500' ? '#8b5cf6' :
                           typeIcon.bg === 'bg-blue-500' ? '#3b82f6' : '#6b7280'};
              color: white;
              border-radius: 30px;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-card {
              background: #f8fafc;
              padding: 20px;
              border-radius: 12px;
              border-left: 5px solid #3b82f6;
            }
            .info-card h3 {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .info-card .value {
              color: #0f172a;
              font-size: 24px;
              font-weight: 700;
            }
            .info-card .label {
              color: #475569;
              font-size: 12px;
              margin-top: 5px;
            }
            .metrics-section {
              margin-bottom: 30px;
            }
            .metrics-title {
              color: #1e293b;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .metric-item {
              background: #f1f5f9;
              padding: 15px;
              border-radius: 10px;
              text-align: center;
            }
            .metric-item .metric-label {
              color: #64748b;
              font-size: 13px;
              margin-bottom: 5px;
            }
            .metric-item .metric-value {
              color: #0f172a;
              font-size: 20px;
              font-weight: 700;
            }
            .details-section {
              margin-bottom: 30px;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
            }
            .details-table tr {
              border-bottom: 1px solid #e2e8f0;
            }
            .details-table td {
              padding: 12px 0;
            }
            .details-table .label {
              color: #64748b;
              font-weight: 500;
            }
            .details-table .value {
              color: #0f172a;
              font-weight: 600;
              text-align: right;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .data-table th {
              background: #3b82f6;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
            }
            .data-table td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .data-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .data-table .total-row {
              background: #e2e8f0;
              font-weight: 700;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              padding-top: 20px;
              border-top: 2px dashed #cbd5e1;
              color: #94a3b8;
              font-size: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 30px;
              font-size: 12px;
              font-weight: 600;
            }
            .status-completed {
              background: #d1fae5;
              color: #059669;
            }
            .status-pending {
              background: #fed7aa;
              color: #c2410c;
            }
            .print-button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin: 20px 0;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                padding: 0;
                background: white;
              }
              .report-container {
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div class="report-badge">${report?.type?.toUpperCase() || 'REPORT'}</div>
              <h1>${report?.title || 'Business Report'}</h1>
              <div class="subtitle">Generated on: ${currentDate}</div>
            </div>
            
            <div class="company-info">
              <strong>Your Company Name</strong><br>
              123 Business Street, City, State 12345<br>
              Phone: (555) 123-4567 | Email: info@company.com
            </div>

            <div class="info-grid">
              <div class="info-card">
                <h3>Report ID</h3>
                <div class="value">#${report?.id}</div>
                <div class="label">Unique Identifier</div>
              </div>
              <div class="info-card">
                <h3>Date</h3>
                <div class="value">${formatDate(report?.date, 'MMM DD, YYYY')}</div>
                <div class="label">${formatDate(report?.date, 'HH:mm')}</div>
              </div>
            </div>

            <div class="metrics-section">
              <h2 class="metrics-title">Key Metrics</h2>
              <div class="metrics-grid">
                <div class="metric-item">
                  <div class="metric-label">Total Amount</div>
                  <div class="metric-value" style="color: #3b82f6">${formatCurrency(report?.amount)}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Total Items</div>
                  <div class="metric-value">${report?.count || 0}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Average Value</div>
                  <div class="metric-value">${formatCurrency(report?.count ? report?.amount / report?.count : 0)}</div>
                </div>
              </div>
            </div>

            <div class="details-section">
              <h2 class="metrics-title">Report Details</h2>
              <table class="details-table">
                ${report?.details?.map(detail => `
                  <tr>
                    <td class="label">${detail.label}</td>
                    <td class="value">${detail.value}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td class="label">Status</td>
                  <td class="value">
                    <span class="status-badge ${report?.status === 'completed' ? 'status-completed' : 'status-pending'}">
                      ${report?.status || 'Completed'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            ${report?.description ? `
              <div class="metrics-section">
                <h2 class="metrics-title">Description</h2>
                <p style="color: #475569; line-height: 1.8;">${report?.description}</p>
              </div>
            ` : ''}

            ${report?.data && report?.data.length > 0 ? `
              <div class="metrics-section">
                <h2 class="metrics-title">Data Details</h2>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${report?.data.map(item => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.amount)}</td>
                      </tr>
                    `).join('')}
                    <tr class="total-row">
                      <td><strong>Total</strong></td>
                      <td><strong>${report?.data.reduce((sum, item) => sum + (item.quantity || 0), 0)}</strong></td>
                      <td><strong>${formatCurrency(report?.data.reduce((sum, item) => sum + (item.amount || 0), 0))}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ` : ''}

            <div class="footer">
              <p>This is a system-generated report. For any queries, please contact support.</p>
              <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Handle Print
  const handlePrint = async () => {
    try {
      const html = generatePrintHTML();
      setPrintHTML(html);
      setPrintModalVisible(false);
      setPrintPreviewVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to generate print preview");
      console.error(error);
    }
  };

  // Handle Direct Print
  const handleDirectPrint = async () => {
    try {
      const html = generatePrintHTML();
      await Print.printAsync({
        html,
        orientation: Print.Orientation.portrait,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to print");
      console.error(error);
    }
  };

  // Export as PDF
  const handleExportPDF = async () => {
    setExportDropdownVisible(false);
    try {
      const html = generatePrintHTML();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      const fileName = `Report_${report?.id || 'summary'}_${new Date().getTime()}.pdf`;
      const newUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        // Request permissions to save to media library
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(newUri);
          await MediaLibrary.createAlbumAsync('Reports', asset, false);
          Alert.alert("Success", "PDF saved to gallery");
        } else {
          Alert.alert("Success", `PDF saved to: ${newUri}`);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to export PDF");
      console.error(error);
    }
  };

  // Export as Excel
  const handleExportExcel = async () => {
    setExportDropdownVisible(false);
    try {
      // Prepare data for Excel
      const excelData = [];
      
      // Header
      excelData.push(['Report Export', report?.title || 'Report']);
      excelData.push(['Generated On', new Date().toLocaleString()]);
      excelData.push([]);
      
      // Report Info
      excelData.push(['REPORT INFORMATION']);
      excelData.push(['Report ID', report?.id]);
      excelData.push(['Type', report?.type]);
      excelData.push(['Date', formatDate(report?.date, 'MMMM DD, YYYY')]);
      excelData.push(['Status', report?.status || 'Completed']);
      excelData.push([]);
      
      // Key Metrics
      excelData.push(['KEY METRICS']);
      excelData.push(['Total Amount', formatCurrency(report?.amount)]);
      excelData.push(['Total Items', report?.count || 0]);
      excelData.push(['Average Value', formatCurrency(report?.count ? report?.amount / report?.count : 0)]);
      excelData.push([]);
      
      // Details
      if (report?.details && report?.details.length > 0) {
        excelData.push(['DETAILS']);
        report?.details.forEach(detail => {
          excelData.push([detail.label, detail.value]);
        });
        excelData.push([]);
      }
      
      // Data Table
      if (report?.data && report?.data.length > 0) {
        excelData.push(['DATA TABLE']);
        excelData.push(['Item', 'Quantity', 'Amount']);
        report?.data.forEach(item => {
          excelData.push([item.name, item.quantity, formatCurrency(item.amount)]);
        });
        excelData.push([]);
        
        // Totals
        const totalQty = report?.data.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalAmt = report?.data.reduce((sum, item) => sum + (item.amount || 0), 0);
        excelData.push(['TOTAL', totalQty, formatCurrency(totalAmt)]);
      }
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      
      // Generate file
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileName = `Report_${report?.id || 'summary'}_${new Date().getTime()}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Excel',
          UTI: 'com.microsoft.excel.xlsx',
        });
      } else {
        // Request permissions to save to media library
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Reports', asset, false);
          Alert.alert("Success", "Excel file saved to gallery");
        } else {
          Alert.alert("Success", `Excel file saved to: ${fileUri}`);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to export Excel");
      console.error(error);
    }
  };

  // Export as DOC (using HTML format)
  const handleExportDoc = async () => {
    setExportDropdownVisible(false);
    try {
      const html = generatePrintHTML();
      const fileName = `Report_${report?.id || 'summary'}_${new Date().getTime()}.doc`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, html, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/msword',
          dialogTitle: 'Export Document',
          UTI: 'com.microsoft.word.doc',
        });
      } else {
        // Request permissions to save to media library
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Reports', asset, false);
          Alert.alert("Success", "Document saved to gallery");
        } else {
          Alert.alert("Success", `Document saved to: ${fileUri}`);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to export document");
      console.error(error);
    }
  };

  // Toggle export dropdown
  const toggleExportDropdown = () => {
    setExportDropdownVisible(!exportDropdownVisible);
  };

  const formatCurrency = (value) => {
    return `$${parseFloat(value || 0).toFixed(2)}`;
  };

  const getTypeIcon = () => {
    if (!report?.type) return { name: "file-document", color: "#6b7280", bg: "bg-gray-500" };
    
    switch (report.type.toLowerCase()) {
      case "sales":
        return { name: "cash", color: "#10b981", bg: "bg-green-500" };
      case "purchases":
        return { name: "cart", color: "#f59e0b", bg: "bg-orange-500" };
      case "inventory":
        return { name: "package", color: "#8b5cf6", bg: "bg-purple-500" };
      case "profits":
        return { name: "chart-line", color: "#3b82f6", bg: "bg-blue-500" };
      default:
        return { name: "file-document", color: "#6b7280", bg: "bg-gray-500" };
    }
  };

  const typeIcon = getTypeIcon();

  const tabs = [
    { id: "overview", label: "Overview", icon: "information" },
    { id: "details", label: "Details", icon: "format-list-bulleted" },
    { id: "charts", label: "Charts", icon: "chart-bar" },
    { id: "data", label: "Data", icon: "table" },
  ];

  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading report details...
        </Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center p-5`}>
        <Icon name="file-document-remove" size={80} color="#9ca3af" />
        <Text className={`text-xl font-semibold mt-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Report Not Found
        </Text>
        <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          The report you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-6 bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header with Gradient */}
      <LinearGradient
        colors={isDarkMode ? ["#1f2937", "#111827"] : ["#ffffff", "#f3f4f6"]}
        className="pt-12 pb-6 px-4"
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className={`w-10 h-10 rounded-2xl items-center justify-center ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}
          >
            <Icon name="arrow-left" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          </TouchableOpacity>
          
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setPrintModalVisible(true)}
              className={`w-10 h-10 rounded-2xl items-center justify-center mr-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}
            >
              <Icon name="printer" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            
            {/* Export Button with Dropdown */}
            <View className="relative">
              <TouchableOpacity
                onPress={toggleExportDropdown}
                className={`w-10 h-10 rounded-2xl items-center justify-center mr-2 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              >
                <Icon name="export" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
              </TouchableOpacity>
              
              {/* Export Dropdown Menu */}
              {exportDropdownVisible && (
                <>
                  {/* Backdrop to close dropdown when tapping outside */}
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: -100,
                      left: -100,
                      right: -100,
                      bottom: -100,
                      backgroundColor: 'transparent',
                    }}
                    onPress={() => setExportDropdownVisible(false)}
                    activeOpacity={1}
                  />
                  
                  {/* Dropdown Menu */}
                  <View className={`absolute right-0 top-12 rounded-xl overflow-hidden shadow-lg z-50 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`} style={{ minWidth: 150 }}>
                    <TouchableOpacity
                      onPress={handleExportPDF}
                      className={`flex-row items-center px-4 py-3 border-b ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <Icon name="file-pdf-box" size={20} color="#ef4444" />
                      <Text className={`ml-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        PDF
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={handleExportExcel}
                      className={`flex-row items-center px-4 py-3 border-b ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <Icon name="microsoft-excel" size={20} color="#10b981" />
                      <Text className={`ml-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Excel
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={handleExportDoc}
                      className="flex-row items-center px-4 py-3"
                    >
                      <Icon name="file-word" size={20} color="#3b82f6" />
                      <Text className={`ml-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Word (DOC)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
            
            <TouchableOpacity
              onPress={handleShare}
              className={`w-10 h-10 rounded-2xl items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}
            >
              <Icon name="share-variant" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className={`w-16 h-16 rounded-2xl ${typeIcon.bg} items-center justify-center mr-4`}>
            <Icon name={typeIcon.name} size={32} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {report.title || `${report.type} Report`}
            </Text>
            <View className="flex-row items-center mt-1">
              <Icon name="calendar" size={16} color="#9ca3af" />
              <Text className={`text-sm ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatDate(report.date, 'MMMM DD, YYYY')}
              </Text>
              <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />
              <View className={`px-2 py-0.5 rounded-full ${typeIcon.bg}`}>
                <Text className="text-white text-xs capitalize">{report.type}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <View className="px-4 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-row items-center mr-2 px-3 py-1.5 rounded-full ${
                activeTab === tab.id
                  ? 'bg-blue-500'
                  : isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <Icon
                name={tab.icon}
                size={16}
                color={activeTab === tab.id ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
              <Text
                className={`ml-1.5 text-xs font-medium ${
                  activeTab === tab.id
                    ? 'text-white'
                    : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        ref={reportViewRef}
        className="flex-1 px-4" 
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && (
          <View className="pt-4 pb-24">
            {/* Report Information */}
            <View className={`p-5 rounded-2xl mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Report Information
              </Text>
              <View className="flex-row flex-wrap justify-between">
                <View className="w-[48%] mb-3">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Report ID
                  </Text>
                  <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    #{report.id}
                  </Text>
                </View>
                <View className="w-[48%] mb-3">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Type
                  </Text>
                  <Text className={`text-2xl font-bold capitalize ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {report.type}
                  </Text>
                </View>
                <View className="w-[48%]">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total Amount
                  </Text>
                  <Text className="text-2xl font-bold text-green-600">
                    {formatCurrency(report.amount)}
                  </Text>
                </View>
                <View className="w-[48%]">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Status
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View className={`w-2 h-2 rounded-full ${
                      report.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
                    } mr-2`} />
                    <Text className={`text-base font-medium capitalize ${
                      report.status === 'completed' ? 'text-green-500' : 'text-orange-500'
                    }`}>
                      {report.status || 'Completed'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Report Details */}
            {report.details && report.details.length > 0 && (
              <View className={`p-5 rounded-2xl mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Report Details
                </Text>
                {report.details.map((detail, index) => (
                  <View key={index} className="flex-row justify-between py-2 border-b border-gray-200">
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {detail.label || `Detail ${index + 1}`}:
                    </Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {detail.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Description */}
            {report.description && (
              <View className={`p-5 rounded-2xl mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Description
                </Text>
                <Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {report.description}
                </Text>
              </View>
            )}

            {/* Key Metrics */}
            <View className={`p-5 rounded-2xl mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Key Metrics
              </Text>
              <View className="flex-row flex-wrap justify-between">
                <View className="w-[48%] mb-3">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total Amount
                  </Text>
                  <Text className="text-2xl font-bold text-blue-600">
                    {formatCurrency(report.amount)}
                  </Text>
                </View>
                <View className="w-[48%] mb-3">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total Items
                  </Text>
                  <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {report.count || 0}
                  </Text>
                </View>
                <View className="w-[48%]">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Average Value
                  </Text>
                  <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {formatCurrency(report.count ? report.amount / report.count : 0)}
                  </Text>
                </View>
                <View className="w-[48%]">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Status
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View className={`w-2 h-2 rounded-full ${
                      report.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
                    } mr-2`} />
                    <Text className={`text-base font-medium capitalize ${
                      report.status === 'completed' ? 'text-green-500' : 'text-orange-500'
                    }`}>
                      {report.status || 'Completed'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Summary Cards */}
            <View className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Summary
              </Text>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-2">
                    <Icon name="trending-up" size={24} color="#10b981" />
                  </View>
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Growth
                  </Text>
                  <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    +12.5%
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-2">
                    <Icon name="calendar-clock" size={24} color="#3b82f6" />
                  </View>
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Period
                  </Text>
                  <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Daily
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mb-2">
                    <Icon name="star" size={24} color="#8b5cf6" />
                  </View>
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Rating
                  </Text>
                  <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    4.8/5
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === "details" && (
          <View className="pt-4 pb-24">
            {/* Detailed Information */}
            <View className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Report Details
              </Text>
              
              <View className="space-y-3">
                <DetailRow 
                  label="Report ID" 
                  value={report.id?.toString() || 'N/A'} 
                  isDarkMode={isDarkMode} 
                />
                <DetailRow 
                  label="Type" 
                  value={report.type || 'N/A'} 
                  isDarkMode={isDarkMode}
                  capitalize 
                />
                <DetailRow 
                  label="Date" 
                  value={formatDate(report.date, 'MMMM DD, YYYY')} 
                  isDarkMode={isDarkMode} 
                />
                <DetailRow 
                  label="Time" 
                  value={formatDate(report.date, 'HH:mm')} 
                  isDarkMode={isDarkMode} 
                />
                <DetailRow 
                  label="Amount" 
                  value={formatCurrency(report.amount)} 
                  isDarkMode={isDarkMode}
                  highlight 
                />
                <DetailRow 
                  label="Items Count" 
                  value={report.count?.toString() || '0'} 
                  isDarkMode={isDarkMode} 
                />
                <DetailRow 
                  label="Status" 
                  value={report.status || 'Completed'} 
                  isDarkMode={isDarkMode}
                  status 
                />
                <DetailRow 
                  label="Created By" 
                  value={report.createdBy || 'System'} 
                  isDarkMode={isDarkMode} 
                />
              </View>
            </View>

            {/* Additional Details */}
            {report.details && report.details.length > 0 && (
              <View className={`p-5 rounded-2xl mt-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Additional Information
                </Text>
                {report.details.map((detail, index) => (
                  <View key={index} className="flex-row justify-between py-2 border-b border-gray-200">
                    <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {detail.label}:
                    </Text>
                    <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {detail.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === "charts" && (
          <View className="pt-4 pb-24">
            {/* Chart Placeholders */}
            <View className={`p-5 rounded-2xl mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Performance Chart
              </Text>
              <View className={`h-64 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} items-center justify-center`}>
                <Icon name="chart-line" size={48} color="#9ca3af" />
                <Text className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Chart visualization will appear here
                </Text>
              </View>
            </View>

            <View className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Distribution
              </Text>
              <View className={`h-48 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} items-center justify-center`}>
                <Icon name="chart-pie" size={48} color="#9ca3af" />
                <Text className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Pie chart will appear here
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "data" && (
          <View className="pt-4 pb-24">
            {/* Data Table */}
            <View className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Raw Data
                </Text>
                <TouchableOpacity
                  onPress={handleExportExcel}
                  className="flex-row items-center bg-green-500 px-3 py-2 rounded-lg"
                >
                  <Icon name="microsoft-excel" size={16} color="#ffffff" />
                  <Text className="text-white text-sm ml-1">Export</Text>
                </TouchableOpacity>
              </View>

              {/* Table Header */}
              <View className={`flex-row p-3 rounded-lg mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Text className={`flex-1 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Item
                </Text>
                <Text className={`w-20 text-sm font-semibold text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Quantity
                </Text>
                <Text className={`w-24 text-sm font-semibold text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Amount
                </Text>
              </View>

              {/* Table Rows */}
              {report.data?.map((item, index) => (
                <View key={index} className="flex-row p-3 border-b border-gray-200">
                  <Text className={`flex-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.name || `Item ${index + 1}`}
                  </Text>
                  <Text className={`w-20 text-sm text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.quantity || 0}
                  </Text>
                  <Text className={`w-24 text-sm text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {formatCurrency(item.amount || 0)}
                  </Text>
                </View>
              ))}

              {(!report.data || report.data.length === 0) && (
                <View className="items-center justify-center py-8">
                  <Icon name="table-off" size={48} color="#9ca3af" />
                  <Text className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No data available
                  </Text>
                </View>
              )}

              {/* Table Footer */}
              {report.data && report.data.length > 0 && (
                <View className={`flex-row p-3 mt-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Text className={`flex-1 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Total
                  </Text>
                  <Text className={`w-20 text-sm font-semibold text-right ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {report.data.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                  </Text>
                  <Text className={`w-24 text-sm font-semibold text-right text-blue-600`}>
                    {formatCurrency(report.data.reduce((sum, item) => sum + (item.amount || 0), 0))}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Print Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={printModalVisible}
        onRequestClose={() => setPrintModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-3xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="items-center mb-4">
              <View className="w-12 h-1 rounded-full bg-gray-300 mb-4" />
              <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Print Options
              </Text>
            </View>

            <TouchableOpacity
              onPress={handlePrint}
              className={`flex-row items-center p-4 rounded-xl mb-3 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
                <Icon name="eye" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Preview & Print
                </Text>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Preview before printing
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDirectPrint}
              className={`flex-row items-center p-4 rounded-xl mb-3 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center mr-3">
                <Icon name="printer" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Direct Print
                </Text>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Print immediately
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportPDF}
              className={`flex-row items-center p-4 rounded-xl mb-3 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center mr-3">
                <Icon name="file-pdf-box" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Save as PDF
                </Text>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Export as PDF file
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPrintModalVisible(false)}
              className="p-4 rounded-xl bg-red-500 mt-2"
            >
              <Text className="text-white text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Print Preview Modal */}
      <Modal
        animationType="slide"
        visible={printPreviewVisible}
        onRequestClose={() => setPrintPreviewVisible(false)}
      >
        <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <View className={`flex-row justify-between items-center p-4 border-b ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <TouchableOpacity
              onPress={() => setPrintPreviewVisible(false)}
              className="p-2"
            >
              <Icon name="close" size={24} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Print Preview
            </Text>
            <TouchableOpacity
              onPress={handleDirectPrint}
              className="p-2 bg-blue-500 rounded-lg px-4"
            >
              <Text className="text-white font-semibold">Print</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ flex: 1 }}>
            <PrintHTMLView html={printHTML} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Helper Component for Detail Rows
const DetailRow = ({ label, value, isDarkMode, capitalize, highlight, status }) => {
  const getStatusColor = (val) => {
    const statusVal = val?.toLowerCase() || '';
    if (statusVal === 'completed') return 'text-green-500';
    if (statusVal === 'pending') return 'text-orange-500';
    if (statusVal === 'failed') return 'text-red-500';
    return isDarkMode ? 'text-white' : 'text-gray-800';
  };

  return (
    <View className="flex-row justify-between py-2 border-b border-gray-200">
      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}:
      </Text>
      <Text 
        className={`text-sm font-medium ${
          highlight 
            ? 'text-blue-600 font-bold' 
            : status 
              ? getStatusColor(value)
              : capitalize 
                ? `capitalize ${isDarkMode ? 'text-white' : 'text-gray-800'}`
                : isDarkMode ? 'text-white' : 'text-gray-800'
        }`}
      >
        {value}
      </Text>
    </View>
  );
};

// Helper component to render HTML for print preview
const PrintHTMLView = ({ html }) => {
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={{ flex: 1 }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      renderLoading={() => (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
    />
  );
};

export default ReportDetailScreen;