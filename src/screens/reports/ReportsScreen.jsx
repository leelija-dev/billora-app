// screens/reports/ReportsScreen.js - UPDATED WITH INFINITE SCROLLING
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as XLSX from "xlsx";
import Header from "../../components/common/Header";
import ExportDropdown from "../../components/common/ExportDropdown";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems";
import { useAuthStore } from "../../store/authStore";
import useReportsStore from "../../store/reportsStore";
import { useThemeStore } from "../../store/themeStore";
import { formatDate } from "../../utils/dateFormatter";
import { generateReportHTML } from "../../utils/reportPrintHelper";
import { generateWordReport } from "../../utils/wordExportHelper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ReportsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const {
    reports = [],
    totalReports,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    lastPage,
    filters,
    summaryStats,
    fetchReports,
    loadMoreReports,
    setFilters,
    resetFilters,
  } = useReportsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState(false);
  
  // Date filter states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateRangeText, setDateRangeText] = useState("Last 30 Days");
  const [selectedFilter, setSelectedFilter] = useState("30days");

  // Print related states
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const scrollViewRef = useRef(null);

  // Get today's date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Calculate local filtered reports for search
  const filteredReports = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return reports;

    const searchLower = searchQuery.toLowerCase().trim();
    return reports.filter((report) => {
      return (
        (report.id && report.id.toString().includes(searchLower)) ||
        (report.invoice_number &&
          report.invoice_number.toLowerCase().includes(searchLower)) ||
        (report.customer_name &&
          report.customer_name.toLowerCase().includes(searchLower)) ||
        (report.store_name &&
          report.store_name.toLowerCase().includes(searchLower))
      );
    });
  }, [reports, searchQuery]);

  // Update date range text
  const updateDateRangeText = useCallback((filterType) => {
    switch (filterType) {
      case "today":
        setDateRangeText("Today");
        break;
      case "7days":
        setDateRangeText("Last 7 Days");
        break;
      case "30days":
        setDateRangeText("Last 30 Days");
        break;
      case "currentMonth":
        setDateRangeText("This Month");
        break;
      case "pastMonth":
        setDateRangeText("Past Month");
        break;
      default:
        setDateRangeText("All Time");
    }
  }, []);

  // Load reports on mount
  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      handleQuickFilter("30days");
    }, []),
  );

  // Reset trigger flag when loading more is complete
  useEffect(() => {
    if (!isLoadingMore && !loadingMore) {
      setHasTriggeredLoadMore(false);
    }
  }, [isLoadingMore, loadingMore]);

  // Quick filter functions
  const handleQuickFilter = (filterType) => {
    setSelectedFilter(filterType);
    updateDateRangeText(filterType);
    const today = new Date();
    let start = "";
    let end = "";

    switch (filterType) {
      case "today":
        start = end = getTodayDate();
        break;
      case "7days":
        end = getTodayDate();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        start = sevenDaysAgo.toISOString().split("T")[0];
        break;
      case "30days":
        end = getTodayDate();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        start = thirtyDaysAgo.toISOString().split("T")[0];
        break;
      case "pastMonth":
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        start = lastMonth.toISOString().split("T")[0];
        end = lastMonthEnd.toISOString().split("T")[0];
        break;
      case "currentMonth":
        const currentMonthStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        );
        const currentMonthEnd = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
        );
        start = currentMonthStart.toISOString().split("T")[0];
        end = currentMonthEnd.toISOString().split("T")[0];
        break;
      case "all":
      default:
        start = "";
        end = "";
        break;
    }

    setStartDate(start);
    setEndDate(end);
    setFilters({ start_date: start, end_date: end });
    fetchReports(1, { start_date: start, end_date: end }, false).finally(() => {
      setInitialLoading(false);
    });
  };

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports(1, { start_date: startDate, end_date: endDate }, false);
    setRefreshing(false);
  }, [fetchReports, startDate, endDate]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || loadingMore || loading) {
      console.log('⏭️ Skipping - already loading');
      return;
    }
    
    if (!hasMore) {
      console.log('⏭️ Skipping - no more data');
      return;
    }

    if (currentPage >= lastPage) {
      console.log('⏭️ Skipping - reached last page');
      return;
    }

    console.log(`📜 Triggering loadMoreReports - currentPage: ${currentPage}, lastPage: ${lastPage}`);
    setIsLoadingMore(true);
    await loadMoreReports();
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, loadingMore, loading, hasMore, currentPage, lastPage, loadMoreReports]);

  // Handle scroll for pagination
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    
    const maxScroll = totalContentHeight - scrollViewHeight;
    const scrollPercentage = maxScroll > 0 ? (currentScrollPosition / maxScroll) * 100 : 0;
    
    const triggerThreshold = 50;
    const shouldLoadMore = scrollPercentage >= triggerThreshold;
    
    if (shouldLoadMore && !hasTriggeredLoadMore && !isLoadingMore && !loadingMore && hasMore && !loading) {
      console.log(`🎯 Triggering load more at ${Math.floor(scrollPercentage)}% scroll`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, hasMore, loading, handleLoadMore]);

  // Clear filters
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    resetFilters();
    handleQuickFilter("30days");
  };

  // Calculate statistics from filtered reports
  const stats = useMemo(() => {
    if (!filteredReports.length) {
      return {
        total: 0,
        revenue: 0,
        orders: 0,
        products: 0,
        averageOrder: 0,
        due: 0,
      };
    }

    const calculatedStats = filteredReports.reduce(
      (acc, report) => ({
        total: acc.total + (parseFloat(report.total_amount) || 0),
        revenue: acc.revenue + (parseFloat(report.paid_amount) || 0),
        orders: acc.orders + 1,
        products: acc.products + (parseInt(report.total_items) || 0),
        due:
          acc.due +
          ((parseFloat(report.total_amount) || 0) -
            (parseFloat(report.paid_amount) || 0)),
      }),
      { total: 0, revenue: 0, orders: 0, products: 0, due: 0 },
    );

    return {
      ...calculatedStats,
      averageOrder: calculatedStats.orders > 0 ? calculatedStats.revenue / calculatedStats.orders : 0,
    };
  }, [filteredReports]);

  // Generate Invoice Print HTML
  const generateInvoiceHTML = (report) => {
    const formatCurrency = (amount) => {
      return `₹${parseFloat(amount || 0).toFixed(2)}`;
    };

    const currentDate = new Date().toLocaleString();
    const statusColor =
      report.status === "completed"
        ? "#10b981"
        : report.status === "pending"
          ? "#f59e0b"
          : "#ef4444";
    const statusBg =
      report.status === "completed"
        ? "#d1fae5"
        : report.status === "pending"
          ? "#fed7aa"
          : "#fee2e2";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice #${report.invoice_number || report.id}</title>
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
            .invoice-container {
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
            .invoice-title {
              text-align: center;
              margin-bottom: 30px;
            }
            .invoice-title h2 {
              color: #3b82f6;
              font-size: 24px;
              margin: 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-card {
              background: #f8fafc;
              padding: 15px;
              border-radius: 10px;
              border-left: 4px solid #3b82f6;
            }
            .info-card h3 {
              color: #64748b;
              font-size: 12px;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .info-card .value {
              color: #0f172a;
              font-size: 18px;
              font-weight: 600;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              background: ${statusBg};
              color: ${statusColor};
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th {
              background: #3b82f6;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
            }
            .items-table td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .items-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .total-row {
              background: #f1f5f9;
              font-weight: 700;
            }
            .total-row td {
              padding: 12px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              padding-top: 20px;
              border-top: 2px dashed #cbd5e1;
              color: #94a3b8;
              font-size: 11px;
            }
            @media print {
              body {
                padding: 0;
                background: white;
              }
              .invoice-container {
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>INVOICE</h1>
              <div class="subtitle">Tax Invoice / Bill of Supply</div>
            </div>
            
            <div class="company-info">
              <strong>${user?.store_name || "Your Store Name"}</strong><br>
              ${user?.store_address || "123 Business Street, City, State 12345"}<br>
              Phone: ${user?.store_phone || "(555) 123-4567"} | Email: ${user?.email || "info@company.com"}<br>
              GST: ${user?.gst_number || "GSTIN123456"}
            </div>

            <div class="invoice-title">
              <h2>Invoice #${report.invoice_number || report.id}</h2>
              <div class="status-badge" style="margin-top: 10px;">${(report.status || "COMPLETED").toUpperCase()}</div>
            </div>

            <div class="info-grid">
              <div class="info-card">
                <h3>Customer Details</h3>
                <div class="value">${report.customer_name || "Deleted Customer"}</div>
                <div style="font-size: 12px; margin-top: 5px;">Customer ID: ${report.customer_id || "N/A"}</div>
              </div>
              <div class="info-card">
                <h3>Invoice Details</h3>
                <div class="value">Date: ${report.created_at ? new Date(report.created_at).toLocaleDateString() : "N/A"}</div>
                <div style="font-size: 12px; margin-top: 5px;">Store: ${report.store_name || "Deleted Store"}</div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${
                  report.invoice_items && report.invoice_items.length > 0
                    ? report.invoice_items
                        .map(
                          (item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.product_name || item.name || `Item ${idx + 1}`}</td>
                    <td>${item.quantity || 1}</td>
                    <td>${formatCurrency(item.price || item.unit_price || 0)}</td>
                    <td>${formatCurrency(item.total || (item.quantity || 1) * (item.price || 0))}</td>
                  </tr>
                `,
                        )
                        .join("")
                    : `
                  <tr>
                    <td>1</td>
                    <td>Product / Service</td>
                    <td>${report.total_items || 1}</td>
                    <td>${formatCurrency(report.total_amount / (report.total_items || 1))}</td>
                    <td>${formatCurrency(report.total_amount)}</td>
                  </tr>
                `
                }
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Subtotal:</strong></td>
                  <td>${formatCurrency(report.total_amount)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Paid Amount:</strong></td>
                  <td>${formatCurrency(report.paid_amount)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Due Amount:</strong></td>
                  <td>${formatCurrency(parseFloat(report.total_amount || 0) - parseFloat(report.paid_amount || 0))}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Total Items:</strong></td>
                  <td>${report.total_items || 0}</td>
                </tr>
              </tbody>
            </table>

            ${report.notes ? `<div style="margin: 20px 0; padding: 15px; background: #fef3c7; border-radius: 8px;"><strong>Notes:</strong><br>${report.notes}</div>` : ""}

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>This is a system-generated invoice. For any queries, please contact support.</p>
              <p>Generated on: ${currentDate}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Print single invoice
  const handlePrintInvoice = async (report) => {
    try {
      setPrintingInvoice(true);
      const html = generateInvoiceHTML(report);

      await Print.printAsync({
        html,
        orientation: Print.Orientation.portrait,
      });
    } catch (error) {
      console.error("Print invoice error:", error);
      Alert.alert("Error", "Failed to print invoice. Please try again.");
    } finally {
      setPrintingInvoice(false);
    }
  };

  // Prepare export data
  const prepareExportData = useCallback(() => {
    return {
      reports: filteredReports,
      summary: summaryStats,
      dateRange: dateRangeText,
      startDate: startDate,
      endDate: endDate,
      generatedAt: new Date(),
      storeInfo: {
        name: user?.store_name || "Your Store Name",
        address: user?.store_address || "Store Address",
        phone: user?.store_phone || "Store Phone",
        email: user?.email || "store@email.com",
      },
      totals: {
        totalReports: filteredReports.length,
        totalSales: parseFloat(summaryStats.totalSalesAmount || stats.revenue),
        totalDue: parseFloat(summaryStats.totalDue || stats.due),
        totalItems: parseInt(summaryStats.totalSalesItems || stats.products),
      },
      user: {
        name: user?.name || "User",
        email: user?.email || "user@email.com",
      },
    };
  }, [
    filteredReports,
    summaryStats,
    stats,
    dateRangeText,
    startDate,
    endDate,
    user,
  ]);

  // Export functions
  const handleExportPDF = async () => {
    if (filteredReports.length === 0) {
      Alert.alert("No Data", "There are no reports to export.");
      return;
    }

    try {
      setIsExporting(true);
      const data = prepareExportData();
      const html = generateReportHTML(data, "a4");

      const { uri } = await Print.printToFileAsync({
        html,
        name: `Reports_${formatDate(new Date(), "YYYYMMDD_HHmmss")}`,
        orientation: "portrait",
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Export Reports as PDF`,
      });

      setShowExportDropdown(false);
    } catch (error) {
      console.error("PDF Export error:", error);
      Alert.alert("Error", "Failed to export as PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (filteredReports.length === 0) {
      Alert.alert("No Data", "There are no reports to export.");
      return;
    }

    try {
      setIsExporting(true);

      const headers = [
        "Invoice #",
        "Date",
        "Customer",
        "Store",
        "Total (₹)",
        "Paid (₹)",
        "Due (₹)",
        "Items",
        "Status",
      ];
      const excelData = filteredReports.map((report) => [
        report.invoice_number || report.id || "",
        report.created_at
          ? new Date(report.created_at).toLocaleDateString()
          : "N/A",
        report.customer_name || "Deleted",
        report.store_name || "Deleted",
        parseFloat(report.total_amount || 0).toFixed(2),
        parseFloat(report.paid_amount || 0).toFixed(2),
        (
          parseFloat(report.total_amount || 0) -
          parseFloat(report.paid_amount || 0)
        ).toFixed(2),
        report.total_items || 0,
        report.status || "N/A",
      ]);

      const wsData = [headers, ...excelData];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reports");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const fileName = `Reports_${formatDate(new Date(), "YYYYMMDD_HHmmss")}.xlsx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(filePath, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: `Export Reports as Excel`,
      });

      setShowExportDropdown(false);
    } catch (error) {
      console.error("Excel Export error:", error);
      Alert.alert("Error", "Failed to export as Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    if (filteredReports.length === 0) {
      Alert.alert("No Data", "There are no reports to export.");
      return;
    }

    try {
      setIsExporting(true);
      const data = prepareExportData();
      const wordData = generateWordReport(data);
      const fileName = `Reports_${formatDate(new Date(), "YYYYMMDD_HHmmss")}.docx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, wordData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(filePath, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        dialogTitle: `Export Reports as Word Document`,
      });

      setShowExportDropdown(false);
    } catch (error) {
      console.error("Word Export error:", error);
      Alert.alert("Error", "Failed to export as Word document");
    } finally {
      setIsExporting(false);
    }
  };

  // Print all reports handler
  const handlePrintAll = () => {
    if (filteredReports.length === 0) {
      Alert.alert("No Data", "There are no reports to print.");
      return;
    }

    const data = prepareExportData();
    setPrintData(data);
    setShowPrintPreview(true);
  };

  const executePrint = async () => {
    try {
      if (!printData) {
        Alert.alert("Error", "No report data available for printing");
        return;
      }

      setIsPrinting(true);
      const html = generateReportHTML(printData, "a4");

      await Print.printAsync({
        html,
        orientation: Print.Orientation.portrait,
      });

      setShowPrintPreview(false);
      Alert.alert("Success", "Report sent to printer successfully");
    } catch (error) {
      console.error("Print error:", error);
      Alert.alert("Error", "Failed to print report.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "table" ? "list" : "table");
  };

  const handleViewDetails = (report) => {
    navigation.navigate("ReportDetail", {
      reportId: report.id,
      reportType: report.type,
    });
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate.toISOString().split("T")[0]);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate.toISOString().split("T")[0]);
    }
  };


  const navigationItems = useMemo(() => {
    const badges = {
      reports: filteredReports.length.toString(),
      sales: summaryStats.totalSalesAmount
        ? `₹${parseFloat(summaryStats.totalSalesAmount).toFixed(2)}`
        : null,
    };
    return getNavigationItemsWithBadges(badges);
  }, [filteredReports.length, summaryStats.totalSalesAmount]);

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return { bg: "#d4edda", text: "#155724" };
      case "pending":
        return { bg: "#fff3cd", text: "#856404" };
      case "cancelled":
        return { bg: "#f8d7da", text: "#721c24" };
      default:
        return { bg: "#e2e3e5", text: "#383d41" };
    }
  };

  // Get status config with icon
  const getStatusConfig = (status) => {
    const configs = {
      paid: { color: "#10b981", icon: "check-circle", label: "Paid" },
      unpaid: { color: "#f59e0b", icon: "clock", label: "Unpaid" },
      overdue: { color: "#ef4444", icon: "alert-circle", label: "Overdue" },
      completed: { color: "#10b981", icon: "check-circle", label: "Completed" },
      cancelled: { color: "#6b7280", icon: "file-document", label: "Cancelled" },
    };
    return configs[status] || configs.unpaid;
  };

  if (initialLoading) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text
          className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Loading reports...
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`flex-1 pb-24 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#111827" : "#ffffff"}
      />

      <Header
        title="Reports"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Reports"
        navigationItems={navigationItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={handleRefresh} 
              disabled={loading}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon 
                name="refresh" 
                size={20} 
                color={loading ? (isDarkMode ? "#4B5563" : "#9CA3AF") : (isDarkMode ? "#9CA3AF" : "#4b5563")} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleViewMode}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon
                name={
                  viewMode === "table" ? "view-grid" : "format-list-bulleted"
                }
                size={22}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            <ExportDropdown
              visible={showExportDropdown}
              onToggle={() => setShowExportDropdown(!showExportDropdown)}
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onExportWord={handleExportWord}
              isExporting={isExporting}
              isDarkMode={isDarkMode}
            />
          </View>
        }
      />

      {/* Statistics Cards */}
      <View className="flex-row flex-wrap px-4 py-3">
        <LinearGradient 
          style={{borderRadius: 12}} 
          colors={["#3b82f6", "#2563eb"]} 
          className="rounded-xl p-4 flex-1 mr-2" 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
        >
          <Text className="text-white/80 text-xs">Total Reports</Text>
          <Text className="text-white text-2xl font-bold">{totalReports || filteredReports.length}</Text>
          <View className="flex-row items-center mt-1">
            <Icon name="file-document" size={16} color="#86efac" />
            <Text className="text-white/80 text-xs ml-1">All reports</Text>
          </View>
        </LinearGradient>

        <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Amount</Text>
          <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹{stats.total.toLocaleString()}</Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Gross total
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row px-4 mb-4">
        <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <View className="flex-row items-center">
            <Icon name="cash" size={20} color="#10b981" />
            <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Paid Amount</Text>
          </View>
          <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹{stats.revenue.toLocaleString()}</Text>
          <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Collected</Text>
        </View>

        <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <View className="flex-row items-center">
            <Icon name="alert-circle" size={20} color="#ef4444" />
            <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Due Amount</Text>
          </View>
          <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹{stats.due.toLocaleString()}</Text>
          <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Pending</Text>
        </View>
      </View>

      {/* Page Indicator */}
      <View className={`px-4 py-2 flex-row justify-between items-center border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {totalReports > 0 ? `Showing ${filteredReports.length} of ${totalReports} reports` : `${filteredReports.length} reports`}
        </Text>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Page {currentPage}/{lastPage}
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
            placeholder="Search reports..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} className="mr-2">
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Active Filter Indicator */}
        {startDate || endDate ? (
          <View className="flex-row items-center mt-2">
            <View className="flex-row items-center bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              <Icon name="filter" size={14} color="#3B82F6" />
              <Text className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                Filter: {dateRangeText}
              </Text>
              <TouchableOpacity onPress={clearFilters} className="ml-2">
                <Icon name="close" size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      {/* Quick Date Filters */}
      <View className="px-4 pb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: "all", label: "All Time" },
            { id: "today", label: "Today" },
            { id: "7days", label: "Last 7 Days" },
            { id: "30days", label: "Last 30 Days" },
            { id: "currentMonth", label: "This Month" },
            { id: "pastMonth", label: "Past Month" },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => handleQuickFilter(filter.id)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedFilter === filter.id
                  ? "bg-blue-500"
                  : isDarkMode
                    ? "bg-gray-800"
                    : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedFilter === filter.id
                    ? "text-white"
                    : isDarkMode
                      ? "text-gray-300"
                      : "text-gray-700"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}

      {/* Main Content */}
      <View className="flex-1">
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={["#3b82f6"]} 
              tintColor={isDarkMode ? "#F9FAFB" : "#3b82f6"} 
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Reports List */}
          <View className="flex-1 px-4 pb-4">
            {loading && filteredReports.length === 0 ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading reports...
                </Text>
              </View>
            ) : filteredReports.length === 0 ? (
              <View className="py-20 items-center">
                <Icon name="file-document" size={80} color={isDarkMode ? '#334155' : '#D1D5DB'} />
                <Text className={`text-lg mt-4 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  No reports found
                </Text>
                <Text className={`text-sm mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchQuery ? 'Try adjusting your search' : 'Try changing date filters'}
                </Text>
              </View>
            ) : (
              filteredReports.map((report) => {
                const statusConfig = getStatusConfig(report.status);
                const total = parseFloat(report.total_amount || 0);
                const paid = parseFloat(report.paid_amount || 0);
                const due = Math.max(0, total - paid);
                
                return (
                  <TouchableOpacity
                    key={report.id}
                    onPress={() => handleViewDetails(report)}
                    className={`mb-3 rounded-xl p-4 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className={`font-semibold text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                          #{report.invoice_number || report.id}
                        </Text>
                        <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {report.customer_name || `Customer #${report.customer_id}`}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Icon name={statusConfig.icon} size={16} color={statusConfig.color} />
                        <Text className={`ml-1 text-xs font-medium`} style={{ color: statusConfig.color }}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center mb-2">
                      <View>
                        <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Total: ₹{total.toFixed(2)}
                        </Text>
                        <Text className={`text-xs text-green-600`}>
                          Paid: ₹{paid.toFixed(2)}
                        </Text>
                      </View>
                      <Text className={`text-sm font-semibold ${due > 0 ? "text-red-600" : "text-green-600"}`}>
                        Due: ₹{due.toFixed(2)}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {new Date(report.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                      <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {report.total_items || 0} items
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Loading More Indicator */}
            {(isLoadingMore || loadingMore) && (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading more reports...
                </Text>
              </View>
            )}

            {/* No More Reports */}
            {!hasMore && filteredReports.length > 0 && (
              <View className="py-4 items-center">
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No more reports to load
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Print Preview Modal for All Reports */}
      <Modal
        visible={showPrintPreview}
        animationType="slide"
        onRequestClose={() => setShowPrintPreview(false)}
      >
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <SafeAreaView className="flex-1">
            <View
              className={`px-4 py-3 flex-row items-center border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
            >
              <TouchableOpacity
                onPress={() => setShowPrintPreview(false)}
                className="mr-4"
              >
                <Icon
                  name="close"
                  size={24}
                  color={isDarkMode ? "#FFFFFF" : "#1F2937"}
                />
              </TouchableOpacity>
              <Text
                className={`text-xl font-semibold flex-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Print Preview
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={executePrint}
                  disabled={isPrinting}
                  className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center"
                >
                  {isPrinting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Icon name="printer" size={16} color="#ffffff" />
                      <Text className="text-white font-semibold ml-1">
                        Print
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView className="flex-1">
              {printData && (
                <ReportPrintPreview
                  data={printData}
                  isDarkMode={isDarkMode}
                  format="a4"
                />
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

export default ReportsScreen;
