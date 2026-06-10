// screens/reports/ReportDetailScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { WebView } from "react-native-webview";
import * as XLSX from "xlsx";
import { reportsAPI } from "../../api";
import { useThemeStore } from "../../store/themeStore";
import { formatDate } from "../../utils/dateFormatter";

const ReportDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { reportId, reportType } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printPreviewVisible, setPrintPreviewVisible] = useState(false);
  const [printHTML, setPrintHTML] = useState("");
  const [exportDropdownVisible, setExportDropdownVisible] = useState(false);
  const reportViewRef = useRef();

  useEffect(() => {
    loadReportData();
  }, [reportId, reportType]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      console.log(
        "Loading report data for reportId:",
        reportId,
        "reportType:",
        reportType,
      );

      // Try to get single report by ID first
      let reportData = null;

      try {
        const response = await reportsAPI.getSingleReport(reportId);
        console.log("Single report API response:", response);

        if (response && response.data) {
          reportData = response.data;
        } else if (response && response.report) {
          reportData = response.report;
        } else if (response) {
          reportData = response;
        }
      } catch (singleReportError) {
        console.log(
          "Single report fetch failed, trying with date range:",
          singleReportError,
        );

        // If single report fetch fails, try fetching with date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const response = await reportsAPI.getReports(
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0],
          1,
        );

        console.log("Reports API Response:", response);

        let reportsData = [];
        if (response && response.data) {
          reportsData = response.data.reports || response.data || [];
        } else if (response && response.reports) {
          reportsData = response.reports;
        } else if (Array.isArray(response)) {
          reportsData = response;
        } else {
          reportsData = response || [];
        }

        reportData = reportsData.find(
          (r) => r.id == reportId || r.invoice_number == reportId,
        );
      }

      if (reportData) {
        const formattedReport = formatReportData(reportData);
        setReport(formattedReport);
      } else {
        console.log("Report not found, creating summary report");
        createSummaryReport();
      }
    } catch (error) {
      console.error("Error loading report:", error);
      createSummaryReport();
    } finally {
      setLoading(false);
    }
  };

  const formatReportData = (data) => {
    // Format the report data based on the API response structure
    return {
      id: data.id || data.invoice_number || "N/A",
      title:
        data.title ||
        `${data.type || "Report"} - ${formatDate(data.date || data.created_at, "MMM DD, YYYY")}`,
      type: data.type || reportType || "general",
      amount: parseFloat(data.amount || data.total_amount || data.total || 0),
      count: parseInt(data.count || data.total_items || data.items_count || 1),
      date: data.date || data.created_at || new Date(),
      status: data.status || "completed",
      description:
        data.description || `${data.type || "Report"} details for period`,
      invoice_items: data.invoice_items || data.items || [],
      customer_id: data.customer_id,
      store_id: data.store_id,
      paid_amount: parseFloat(data.paid_amount || 0),
      user_id: data.user_id,
      invoice_number: data.invoice_number,
      customer_name: data.customer_name,
      store_name: data.store_name,
      details: [
        { label: "Report ID", value: `#${data.id || data.invoice_number}` },
        { label: "Type", value: data.type || reportType || "General" },
        {
          label: "Date",
          value: formatDate(data.date || data.created_at, "MMMM DD, YYYY"),
        },
        {
          label: "Time",
          value: formatDate(data.date || data.created_at, "HH:mm"),
        },
        {
          label: "Total Amount",
          value: formatCurrency(
            data.amount || data.total_amount || data.total || 0,
          ),
        },
        {
          label: "Items Count",
          value: (
            data.count ||
            data.total_items ||
            data.items_count ||
            1
          ).toString(),
        },
        { label: "Status", value: data.status || "Completed" },
      ].filter((detail) => detail.value !== undefined && detail.value !== null),
      data: data.items ||
        data.invoice_items ||
        data.data || [
          { name: "Item 1", quantity: 1, amount: data.amount || 0 },
        ],
    };
  };

  const createSummaryReport = () => {
    const summaryReport = {
      id: reportId || "summary",
      type: reportType || "summary",
      title: `${reportType ? reportType.charAt(0).toUpperCase() + reportType.slice(1) : "Summary"} Report`,
      date: new Date(),
      amount: 0,
      count: 0,
      status: "completed",
      description: `Overall ${reportType || "summary"} report for the selected period`,
      totalSales: 0,
      totalOrders: 0,
      totalDue: 0,
      customerDues: [],
      topProducts: [],
      lowStockItems: 0,
      details: [
        { label: "Total Sales", value: formatCurrency(0) },
        { label: "Total Orders", value: "0" },
        { label: "Total Due", value: formatCurrency(0) },
        { label: "Low Stock Items", value: "0" },
      ],
      data: [
        { name: "Sample Product A", quantity: 10, amount: 500 },
        { name: "Sample Product B", quantity: 8, amount: 400 },
        { name: "Sample Product C", quantity: 5, amount: 250 },
      ],
    };
    setReport(summaryReport);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${report?.title || "Report"} - ${formatCurrency(report?.amount)}\nDate: ${formatDate(report?.date)}\nType: ${report?.type}`,
        title: report?.title || "Report Details",
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
          <title>${report?.title || "Report"}</title>
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
              background: ${
                typeIcon.bg === "bg-green-500"
                  ? "#10b981"
                  : typeIcon.bg === "bg-orange-500"
                    ? "#f59e0b"
                    : typeIcon.bg === "bg-purple-500"
                      ? "#8b5cf6"
                      : typeIcon.bg === "bg-blue-500"
                        ? "#3b82f6"
                        : "#6b7280"
              };
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
              <div class="report-badge">${report?.type?.toUpperCase() || "REPORT"}</div>
              <h1>${report?.title || "Business Report"}</h1>
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
                <div class="value">${formatDate(report?.date, "MMM DD, YYYY")}</div>
                <div class="label">${formatDate(report?.date, "HH:mm")}</div>
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
                ${report?.details
                  ?.map(
                    (detail) => `
                  <tr>
                    <td class="label">${detail.label}</td>
                    <td class="value">${detail.value}</td>
                  </tr>
                `,
                  )
                  .join("")}
                <tr>
                  <td class="label">Status</td>
                  <td class="value">
                    <span class="status-badge ${report?.status === "completed" ? "status-completed" : "status-pending"}">
                      ${report?.status || "Completed"}
                    </span>
                   </td>
                </tr>
              </table>
            </div>

            ${
              report?.description
                ? `
              <div class="metrics-section">
                <h2 class="metrics-title">Description</h2>
                <p style="color: #475569; line-height: 1.8;">${report?.description}</p>
              </div>
            `
                : ""
            }

            ${
              report?.data && report?.data.length > 0
                ? `
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
                    ${report?.data
                      .map(
                        (item) => `
                      <tr>
                        <td>${item.name || item.product_name || "Item"}</td>
                        <td>${item.quantity || item.qty || 1}</td>
                        <td>${formatCurrency(item.amount || item.price || item.total || 0)}</td>
                      </tr>
                    `,
                      )
                      .join("")}
                    <tr class="total-row">
                      <td><strong>Total</strong></td>
                      <td><strong>${report?.data.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0)}</strong></td>
                      <td><strong>${formatCurrency(report?.data.reduce((sum, item) => sum + (item.amount || item.price || item.total || 0), 0))}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `
                : ""
            }

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

      const fileName = `Report_${report?.id || "summary"}_${new Date().getTime()}.pdf`;
      const newUri = FileSystem.documentDirectory + fileName;

      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: "application/pdf",
          dialogTitle: "Export PDF",
        });
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          const asset = await MediaLibrary.createAssetAsync(newUri);
          await MediaLibrary.createAlbumAsync("Reports", asset, false);
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
      const excelData = [];

      excelData.push(["Report Export", report?.title || "Report"]);
      excelData.push(["Generated On", new Date().toLocaleString()]);
      excelData.push([]);

      excelData.push(["REPORT INFORMATION"]);
      excelData.push(["Report ID", report?.id]);
      excelData.push(["Type", report?.type]);
      excelData.push(["Date", formatDate(report?.date, "MMMM DD, YYYY")]);
      excelData.push(["Status", report?.status || "Completed"]);
      excelData.push([]);

      excelData.push(["KEY METRICS"]);
      excelData.push(["Total Amount", formatCurrency(report?.amount)]);
      excelData.push(["Total Items", report?.count || 0]);
      excelData.push([
        "Average Value",
        formatCurrency(report?.count ? report?.amount / report?.count : 0),
      ]);
      excelData.push([]);

      if (report?.details && report?.details.length > 0) {
        excelData.push(["DETAILS"]);
        report?.details.forEach((detail) => {
          excelData.push([detail.label, detail.value]);
        });
        excelData.push([]);
      }

      if (report?.data && report?.data.length > 0) {
        excelData.push(["DATA TABLE"]);
        excelData.push(["Item", "Quantity", "Amount"]);
        report?.data.forEach((item) => {
          excelData.push([
            item.name || item.product_name || "Item",
            item.quantity || item.qty || 1,
            formatCurrency(item.amount || item.price || item.total || 0),
          ]);
        });
        excelData.push([]);

        const totalQty = report?.data.reduce(
          (sum, item) => sum + (item.quantity || item.qty || 0),
          0,
        );
        const totalAmt = report?.data.reduce(
          (sum, item) => sum + (item.amount || item.price || item.total || 0),
          0,
        );
        excelData.push(["TOTAL", totalQty, formatCurrency(totalAmt)]);
      }

      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const fileName = `Report_${report?.id || "summary"}_${new Date().getTime()}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Excel",
        });
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync("Reports", asset, false);
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

  // Export as DOC
  const handleExportDoc = async () => {
    setExportDropdownVisible(false);
    try {
      const html = generatePrintHTML();
      const fileName = `Report_${report?.id || "summary"}_${new Date().getTime()}.doc`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, html, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/msword",
          dialogTitle: "Export Document",
        });
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync("Reports", asset, false);
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

  const toggleExportDropdown = () => {
    setExportDropdownVisible(!exportDropdownVisible);
  };

  const formatCurrency = (value) => {
    return `$${parseFloat(value || 0).toFixed(2)}`;
  };

  const getTypeIcon = () => {
    if (!report?.type)
      return { name: "file-document", color: "#6b7280", bg: "bg-gray-500" };

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
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text
          className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Loading report details...
        </Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center p-5`}
      >
        <Icon name="file-document-remove" size={80} color="#9ca3af" />
        <Text
          className={`text-xl font-semibold mt-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
        >
          Report Not Found
        </Text>
        <Text
          className={`text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
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
    <View
      className={`flex-1 pb-4 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <LinearGradient
        colors={isDarkMode ? ["#1f2937", "#111827"] : ["#ffffff", "#f3f4f6"]}
        className="pt-12 pb-6 px-4"
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className={`w-10 h-10 rounded-2xl items-center justify-center ${
              isDarkMode ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <Icon
              name="arrow-left"
              size={22}
              color={isDarkMode ? "#9CA3AF" : "#4b5563"}
            />
          </TouchableOpacity>

          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setPrintModalVisible(true)}
              className={`w-10 h-10 rounded-2xl items-center justify-center mr-2 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <Icon
                name="printer"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>

            <View className="relative">
              <TouchableOpacity
                onPress={toggleExportDropdown}
                className={`w-10 h-10 rounded-2xl items-center justify-center mr-2 ${
                  isDarkMode ? "bg-gray-800" : "bg-gray-200"
                }`}
              >
                <Icon
                  name="export"
                  size={20}
                  color={isDarkMode ? "#9CA3AF" : "#4b5563"}
                />
              </TouchableOpacity>

              {exportDropdownVisible && (
                <>
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      top: -100,
                      left: -100,
                      right: -100,
                      bottom: -100,
                      backgroundColor: "transparent",
                    }}
                    onPress={() => setExportDropdownVisible(false)}
                    activeOpacity={1}
                  />

                  <View
                    className={`absolute right-0 top-12 rounded-xl overflow-hidden shadow-lg z-50 ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    }`}
                    style={{ minWidth: 150 }}
                  >
                    <TouchableOpacity
                      onPress={handleExportPDF}
                      className={`flex-row items-center px-4 py-3 border-b ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <Icon name="file-pdf-box" size={20} color="#ef4444" />
                      <Text
                        className={`ml-3 font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                      >
                        PDF
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleExportExcel}
                      className={`flex-row items-center px-4 py-3 border-b ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <Icon name="microsoft-excel" size={20} color="#10b981" />
                      <Text
                        className={`ml-3 font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                      >
                        Excel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleExportDoc}
                      className="flex-row items-center px-4 py-3"
                    >
                      <Icon name="file-word" size={20} color="#3b82f6" />
                      <Text
                        className={`ml-3 font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                      >
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
                isDarkMode ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <Icon
                name="share-variant"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center">
          <View
            className={`w-16 h-16 rounded-2xl ${typeIcon.bg} items-center justify-center mr-4`}
          >
            <Icon name={typeIcon.name} size={32} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text
              className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              {report.title || `${report.type} Report`}
            </Text>
            <View className="flex-row items-center mt-1">
              <Icon name="calendar" size={16} color="#9ca3af" />
              <Text
                className={`text-sm ml-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {formatDate(report.date, "MMMM DD, YYYY")}
              </Text>
              <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />
              <View className={`px-2 py-0.5 rounded-full ${typeIcon.bg}`}>
                <Text className="text-white text-xs capitalize">
                  {report.type}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View className="px-4 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-row items-center mr-2 px-3 py-1.5 rounded-full ${
                activeTab === tab.id
                  ? "bg-blue-500"
                  : isDarkMode
                    ? "bg-gray-800"
                    : "bg-white"
              }`}
            >
              <Icon
                name={tab.icon}
                size={16}
                color={
                  activeTab === tab.id
                    ? "#ffffff"
                    : isDarkMode
                      ? "#9CA3AF"
                      : "#4b5563"
                }
              />
              <Text
                className={`ml-1.5 text-xs font-medium ${
                  activeTab === tab.id
                    ? "text-white"
                    : isDarkMode
                      ? "text-gray-300"
                      : "text-gray-700"
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
            <View
              className={`p-5 rounded-2xl mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
            >
              <Text
                className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Report Information
              </Text>
              <View className="flex-row flex-wrap justify-between">
                <View className="w-[48%] mb-3">
                  <Text
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Report ID
                  </Text>
                  <Text
                    className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    #{report.id}
                  </Text>
                </View>
                <View className="w-[48%] mb-3">
                  <Text
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Type
                  </Text>
                  <Text
                    className={`text-2xl font-bold capitalize ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    {report.type}
                  </Text>
                </View>
                <View className="w-[48%]">
                  <Text
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Total Amount
                  </Text>
                  <Text className="text-2xl font-bold text-green-600">
                    {formatCurrency(report.amount)}
                  </Text>
                </View>
                <View className="w-[48%]">
                  <Text
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Status
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View
                      className={`w-2 h-2 rounded-full ${
                        report.status === "completed"
                          ? "bg-green-500"
                          : "bg-orange-500"
                      } mr-2`}
                    />
                    <Text
                      className={`text-base font-medium capitalize ${
                        report.status === "completed"
                          ? "text-green-500"
                          : "text-orange-500"
                      }`}
                    >
                      {report.status || "Completed"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {report.details && report.details.length > 0 && (
              <View
                className={`p-5 rounded-2xl mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
              >
                <Text
                  className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Report Details
                </Text>
                {report.details.map((detail, index) => (
                  <View
                    key={index}
                    className="flex-row justify-between py-2 border-b border-gray-200"
                  >
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {detail.label}:
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                    >
                      {detail.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {report.description && (
              <View
                className={`p-5 rounded-2xl mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
              >
                <Text
                  className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Description
                </Text>
                <Text
                  className={`text-base ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  {report.description}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "details" && (
          <View className="pt-4 pb-24">
            <View
              className={`p-5 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
            >
              <Text
                className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Report Details
              </Text>

              <View className="space-y-3">
                <DetailRow
                  label="Report ID"
                  value={report.id?.toString() || "N/A"}
                  isDarkMode={isDarkMode}
                />
                <DetailRow
                  label="Type"
                  value={report.type || "N/A"}
                  isDarkMode={isDarkMode}
                  capitalize
                />
                <DetailRow
                  label="Date"
                  value={formatDate(report.date, "MMMM DD, YYYY")}
                  isDarkMode={isDarkMode}
                />
                <DetailRow
                  label="Time"
                  value={formatDate(report.date, "HH:mm")}
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
                  value={report.count?.toString() || "0"}
                  isDarkMode={isDarkMode}
                />
                <DetailRow
                  label="Status"
                  value={report.status || "Completed"}
                  isDarkMode={isDarkMode}
                  status
                />
              </View>
            </View>

            {report.invoice_number && (
              <View
                className={`p-5 rounded-2xl mt-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
              >
                <Text
                  className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Invoice Information
                </Text>
                <DetailRow
                  label="Invoice Number"
                  value={report.invoice_number}
                  isDarkMode={isDarkMode}
                />
                {report.customer_name && (
                  <DetailRow
                    label="Customer"
                    value={report.customer_name}
                    isDarkMode={isDarkMode}
                  />
                )}
                {report.store_name && (
                  <DetailRow
                    label="Store"
                    value={report.store_name}
                    isDarkMode={isDarkMode}
                  />
                )}
                {report.paid_amount && (
                  <DetailRow
                    label="Paid Amount"
                    value={formatCurrency(report.paid_amount)}
                    isDarkMode={isDarkMode}
                  />
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === "charts" && (
          <View className="pt-4 pb-24">
            <View
              className={`p-5 rounded-2xl mb-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
            >
              <Text
                className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Performance Chart
              </Text>
              <View
                className={`h-64 rounded-xl ${isDarkMode ? "bg-gray-700" : "bg-gray-100"} items-center justify-center`}
              >
                <Icon name="chart-line" size={48} color="#9ca3af" />
                <Text
                  className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Chart visualization will appear here
                </Text>
              </View>
            </View>

            <View
              className={`p-5 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
            >
              <Text
                className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Distribution
              </Text>
              <View
                className={`h-48 rounded-xl ${isDarkMode ? "bg-gray-700" : "bg-gray-100"} items-center justify-center`}
              >
                <Icon name="chart-pie" size={48} color="#9ca3af" />
                <Text
                  className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Pie chart will appear here
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "data" && (
          <View className="pt-4 pb-24">
            <View
              className={`p-5 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
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

              <View
                className={`flex-row p-3 rounded-lg mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <Text
                  className={`flex-1 text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  Item
                </Text>
                <Text
                  className={`w-20 text-sm font-semibold text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  Quantity
                </Text>
                <Text
                  className={`w-24 text-sm font-semibold text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  Amount
                </Text>
              </View>

              {report.data?.map((item, index) => (
                <View
                  key={index}
                  className="flex-row p-3 border-b border-gray-200"
                >
                  <Text
                    className={`flex-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    {item.name || item.product_name || `Item ${index + 1}`}
                  </Text>
                  <Text
                    className={`w-20 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    {item.quantity || item.qty || 0}
                  </Text>
                  <Text
                    className={`w-24 text-sm text-right font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    {formatCurrency(
                      item.amount || item.price || item.total || 0,
                    )}
                  </Text>
                </View>
              ))}

              {(!report.data || report.data.length === 0) && (
                <View className="items-center justify-center py-8">
                  <Icon name="table-off" size={48} color="#9ca3af" />
                  <Text
                    className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No data available
                  </Text>
                </View>
              )}

              {report.data && report.data.length > 0 && (
                <View
                  className={`flex-row p-3 mt-2 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                >
                  <Text
                    className={`flex-1 text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    Total
                  </Text>
                  <Text
                    className={`w-20 text-sm font-semibold text-right ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    {report.data.reduce(
                      (sum, item) => sum + (item.quantity || item.qty || 0),
                      0,
                    )}
                  </Text>
                  <Text
                    className={`w-24 text-sm font-semibold text-right text-blue-600`}
                  >
                    {formatCurrency(
                      report.data.reduce(
                        (sum, item) =>
                          sum + (item.amount || item.price || item.total || 0),
                        0,
                      ),
                    )}
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
          <View
            className={`rounded-t-3xl p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="items-center mb-4">
              <View className="w-12 h-1 rounded-full bg-gray-300 mb-4" />
              <Text
                className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Print Options
              </Text>
            </View>

            <TouchableOpacity
              onPress={handlePrint}
              className={`flex-row items-center p-4 rounded-xl mb-3 ${
                isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
                <Icon name="eye" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Preview & Print
                </Text>
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Preview before printing
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDirectPrint}
              className={`flex-row items-center p-4 rounded-xl mb-3 ${
                isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center mr-3">
                <Icon name="printer" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Direct Print
                </Text>
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Print immediately
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportPDF}
              className={`flex-row items-center p-4 rounded-xl mb-3 ${
                isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center mr-3">
                <Icon name="file-pdf-box" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Save as PDF
                </Text>
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Export as PDF file
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPrintModalVisible(false)}
              className="p-4 rounded-xl bg-red-500 mt-2"
            >
              <Text className="text-white text-center font-semibold">
                Cancel
              </Text>
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
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <View
            className={`flex-row justify-between items-center p-4 border-b ${
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            }`}
          >
            <TouchableOpacity
              onPress={() => setPrintPreviewVisible(false)}
              className="p-2"
            >
              <Icon
                name="close"
                size={24}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            <Text
              className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
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

const DetailRow = ({
  label,
  value,
  isDarkMode,
  capitalize,
  highlight,
  status,
}) => {
  const getStatusColor = (val) => {
    const statusVal = val?.toLowerCase() || "";
    if (statusVal === "completed") return "text-green-500";
    if (statusVal === "pending") return "text-orange-500";
    if (statusVal === "failed") return "text-red-500";
    return isDarkMode ? "text-white" : "text-gray-800";
  };

  return (
    <View className="flex-row justify-between py-2 border-b border-gray-200">
      <Text
        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        {label}:
      </Text>
      <Text
        className={`text-sm font-medium ${
          highlight
            ? "text-blue-600 font-bold"
            : status
              ? getStatusColor(value)
              : capitalize
                ? `capitalize ${isDarkMode ? "text-white" : "text-gray-800"}`
                : isDarkMode
                  ? "text-white"
                  : "text-gray-800"
        }`}
      >
        {value}
      </Text>
    </View>
  );
};

const PrintHTMLView = ({ html }) => {
  return (
    <WebView
      originWhitelist={["*"]}
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
