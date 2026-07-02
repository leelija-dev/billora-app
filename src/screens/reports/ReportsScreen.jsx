// screens/reports/ReportsScreen.js
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { reportsAPI } from "../../api";
import ExportDropdown from "../../components/common/ExportDropdown";
import Header from "../../components/common/Header";
import ReportFilters from "../../components/reports/ReportFilters";
import ReportPrintPreview from "../../components/reports/ReportPrintPreview";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { formatDate } from "../../utils/dateFormatter";
import { generateReportHTML } from "../../utils/reportPrintHelper";
import { generateWordReport } from "../../utils/wordExportHelper";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ReportsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [refreshing, setRefreshing] = useState(false);
  const [dateRangeText, setDateRangeText] = useState("Last 30 Days");
  const [selectedFilter, setSelectedFilter] = useState("30days");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0,
  });

  // Summary statistics from API
  const [summaryStats, setSummaryStats] = useState({
    totalSalesItems: "0",
    totalSalesAmount: "0",
    totalDue: "0",
    totalProfit: "0",
    customerDues: [],
    productWiseSales: [],
  });

  // Print related states
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Get today's date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

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

  // Fetch reports with pagination and date filtering
  const fetchReports = useCallback(
    async (page = 1, start = startDate, end = endDate, append = false) => {
      setLoading(true);
      setError(null);

      try {
        const response = await reportsAPI.getReports(start, end, page);
        console.log("✅ Reports API Response:", response);

        const responseData = response?.data || response;

        if (responseData?.salesItem_details) {
          const paginatedData = responseData.salesItem_details;
          const reportsData = paginatedData.data || [];

          setSummaryStats({
            totalSalesItems: responseData.total_sales_items?.toString() || "0",
            totalSalesAmount:
              responseData.total_sales_amount?.toString() || "0",
            totalDue: responseData.total_due?.toString() || "0",
            totalProfit: responseData.total_profit?.toString() || "0",
            customerDues: responseData.customer_dues || [],
            productWiseSales: responseData.product_wise_sales || [],
          });

          setPagination({
            currentPage: paginatedData.current_page || 1,
            perPage: paginatedData.per_page || 10,
            total: paginatedData.total || 0,
            lastPage: paginatedData.last_page || 1,
            from: paginatedData.from || 0,
            to: paginatedData.to || 0,
          });

          const formattedReports = reportsData.map((report) => ({
            ...report,
            customer_name: report.customer?.name || "Deleted",
            store_name: report.store?.name || "Deleted",
          }));

          // If append is true and page > 1, append to existing reports
          const finalReports = append && page > 1 
            ? [...reports, ...formattedReports]
            : formattedReports;

          setReports(finalReports);
          setFilteredReports(finalReports);
        } else if (Array.isArray(responseData)) {
          const formattedReports = responseData.map((report) => ({
            ...report,
            customer_name: report.customer?.name || "Deleted",
            store_name: report.store?.name || "Deleted",
          }));
          setReports(formattedReports);
          setFilteredReports(formattedReports);
        } else {
          setReports([]);
          setFilteredReports([]);
        }
        setInitialLoadComplete(true);
      } catch (err) {
        console.error("❌ Failed to fetch reports:", err);
        setError(err.message || "Failed to fetch reports");
        setReports([]);
        setFilteredReports([]);
        setInitialLoadComplete(true);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, reports],
  );

  // Apply search filter locally
  useEffect(() => {
    if (!reports.length) {
      setFilteredReports([]);
      return;
    }

    let filtered = [...reports];

    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((report) => {
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
    }

    setFilteredReports(filtered);
  }, [searchQuery, reports]);

  // Initialize with last 30 days reports
  useEffect(() => {
    handleQuickFilter("30days");
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.lastPage) return;
    fetchReports(newPage, startDate, endDate);
  };

  // Handle date filter
  const handleDateFilter = () => {
    fetchReports(1, startDate, endDate);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setShowFilters(false);
    handleQuickFilter("30days");
  };

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
    fetchReports(1, start, end);
  };

  // Calculate statistics
  const calculateStats = useCallback(() => {
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

    const stats = filteredReports.reduce(
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
      ...stats,
      averageOrder: stats.orders > 0 ? stats.revenue / stats.orders : 0,
    };
  }, [filteredReports]);

  const stats = calculateStats();

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports(1, startDate, endDate);
    setRefreshing(false);
  };

  // Load more reports for infinite scroll
  const loadMoreReports = useCallback(async () => {
    if (pagination.currentPage < pagination.lastPage && !loading) {
      const nextPage = pagination.currentPage + 1;
      await fetchReports(nextPage, startDate, endDate, true);
    }
  }, [pagination.currentPage, pagination.lastPage, loading, startDate, endDate, fetchReports]);

  // Infinite scroll hook
  const { handleScroll, isFetchingMore } = useInfiniteScroll(loadMoreReports, {
    threshold: 500,
    hasMore: pagination.currentPage < pagination.lastPage,
    loading: loading,
  });

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleFiltersClose = () => {
    setShowFilters(false);
  };

  const handleFiltersApply = async (filters) => {
    setShowFilters(false);
    if (filters.startDate) setStartDate(filters.startDate);
    if (filters.endDate) setEndDate(filters.endDate);
    await fetchReports(
      1,
      filters.startDate || startDate,
      filters.endDate || endDate,
    );
  };

  const handleDateSearch = async () => {
    await fetchReports(1, startDate, endDate);
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

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "table" ? "cards" : "table");
  };

  const handleViewDetails = (report) => {
    navigation.navigate("ReportDetail", {
      reportId: report.id,
      reportType: report.type,
    });
  };

  useFocusEffect(
    useCallback(() => {
      if (initialLoadComplete) {
        fetchReports(pagination.currentPage, startDate, endDate);
      }
    }, [fetchReports, initialLoadComplete]),
  );

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

  // Card View Component
  const CardView = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="px-4"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={["#3b82f6"]}
        />
      }
      onScroll={handleScroll}
      scrollEventThrottle={400}
    >
      {filteredReports.length === 0 ? (
        <View
          className={`py-12 items-center justify-center rounded-xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <Icon name="file-document-outline" size={60} color="#9ca3af" />
          <Text
            className={`text-lg font-semibold mt-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
          >
            No Reports Found
          </Text>
          <Text
            className={`text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            {searchQuery
              ? "No reports match your search criteria."
              : "Try adjusting your date filters."}
          </Text>
          {(searchQuery || startDate || endDate) && (
            <TouchableOpacity onPress={clearFilters} className="mt-4">
              <Text className="text-blue-500 font-semibold">Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        filteredReports.map((report, index) => {
          const statusColor = getStatusColor(report.status);
          return (
            <View
              key={report.id || index}
              className={`mb-4 p-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text
                    className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Invoice #{report.invoice_number || report.id}
                  </Text>
                  <Text
                    className={`text-sm font-medium mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    {report.customer_name || "Deleted Customer"}
                  </Text>
                </View>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => handlePrintInvoice(report)}
                    className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                    disabled={printingInvoice}
                  >
                    <Icon
                      name="printer"
                      size={18}
                      color={isDarkMode ? "#9CA3AF" : "#4b5563"}
                    />
                  </TouchableOpacity>
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: statusColor.bg }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: statusColor.text }}
                    >
                      {(report.status || "Completed").toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Date:
                </Text>
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  {report.created_at
                    ? new Date(report.created_at).toLocaleDateString()
                    : "N/A"}
                </Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Store:
                </Text>
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  {report.store_name || "Deleted Store"}
                </Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Total Amount:
                </Text>
                <Text className="text-sm font-bold text-green-600">
                  {formatCurrency(report.total_amount)}
                </Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Paid Amount:
                </Text>
                <Text className="text-sm font-medium text-blue-600">
                  {formatCurrency(report.paid_amount)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Items:
                </Text>
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  {report.total_items || 0}
                </Text>
              </View>

              <View className="flex-row mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <TouchableOpacity
                  onPress={() => handleViewDetails(report)}
                  className="flex-row items-center"
                >
                  <Icon name="eye" size={16} color="#3b82f6" />
                  <Text className="text-blue-500 text-sm ml-1">
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Loading indicator for infinite scroll */}
      {isFetchingMore && pagination.currentPage < pagination.lastPage && (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Loading more reports...
          </Text>
        </View>
      )}

      {/* End of list indicator */}
      {pagination.currentPage >= pagination.lastPage && filteredReports.length > 0 && (
        <View className="py-4 items-center">
          <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Showing all {filteredReports.length} reports
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Table View Component with View Icon
  const TableView = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
    >
      <View style={{ minWidth: SCREEN_WIDTH - 32 }}>
        <View
          className={`flex-row py-3 px-2 rounded-t-xl ${isDarkMode ? "bg-gray-800" : "bg-blue-500"}`}
        >
          <Text
            style={{ width: 90 }}
            className="px-2 text-white font-semibold text-sm"
          >
            Invoice #
          </Text>
          <Text
            style={{ width: 100 }}
            className="px-2 text-white font-semibold text-sm"
          >
            Date
          </Text>
          <Text
            style={{ width: 130 }}
            className="px-2 text-white font-semibold text-sm"
          >
            Customer
          </Text>
          <Text
            style={{ width: 120 }}
            className="px-2 text-white font-semibold text-sm"
          >
            Store
          </Text>
          <Text
            style={{ width: 100 }}
            className="px-2 text-white font-semibold text-sm"
          >
            Total
          </Text>
          <Text
            style={{ width: 100 }}
            className="px-2 text-white font-semibold text-sm"
          >
            Paid
          </Text>
          <Text
            style={{ width: 100 }}
            className="px-2 text-white font-semibold text-sm"
          >
            Due
          </Text>
          <Text
            style={{ width: 60 }}
            className="px-2 text-white font-semibold text-sm text-center"
          >
            Items
          </Text>
          <Text
            style={{ width: 90 }}
            className="px-2 text-white font-semibold text-sm"
          >
            Status
          </Text>
          <Text
            style={{ width: 70 }}
            className="px-2 text-white font-semibold text-sm text-center"
          >
            Print
          </Text>
          <Text
            style={{ width: 70 }}
            className="px-2 text-white font-semibold text-sm text-center"
          >
            View
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={true}
          style={{ maxHeight: 500 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3b82f6"]}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={400}
        >
          {filteredReports.length === 0 ? (
            <View
              className={`py-12 items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-b-xl`}
            >
              <Icon name="file-document-outline" size={50} color="#9ca3af" />
              <Text
                className={`mt-3 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                No reports found
              </Text>
              {(searchQuery || startDate || endDate) && (
                <TouchableOpacity onPress={clearFilters} className="mt-3">
                  <Text className="text-blue-500">Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View
              className={`rounded-b-xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              {filteredReports.map((report, index) => {
                const statusColor = getStatusColor(report.status);
                return (
                  <View
                    key={report.id || index}
                    className={`flex-row border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"} py-3`}
                  >
                    <View style={{ width: 90 }} className="px-2">
                      <Text className="font-mono font-medium text-blue-600 dark:text-blue-400 text-sm">
                        #{report.invoice_number || report.id}
                      </Text>
                    </View>
                    <View style={{ width: 100 }} className="px-2">
                      <Text
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {report.created_at
                          ? new Date(report.created_at).toLocaleDateString()
                          : "N/A"}
                      </Text>
                    </View>
                    <View style={{ width: 130 }} className="px-2">
                      <Text
                        className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                        numberOfLines={1}
                      >
                        {report.customer_name || "Deleted"}
                      </Text>
                    </View>
                    <View style={{ width: 120 }} className="px-2">
                      <Text
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                        numberOfLines={1}
                      >
                        {report.store_name || "Deleted"}
                      </Text>
                    </View>
                    <View style={{ width: 100 }} className="px-2">
                      <Text className="text-sm font-semibold text-green-600">
                        {formatCurrency(report.total_amount)}
                      </Text>
                    </View>
                    <View style={{ width: 100 }} className="px-2">
                      <Text className="text-sm text-blue-600">
                        {formatCurrency(report.paid_amount)}
                      </Text>
                    </View>
                    <View style={{ width: 100 }} className="px-2">
                      <Text
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {formatCurrency(
                          parseFloat(report.total_amount || 0) -
                            parseFloat(report.paid_amount || 0),
                        )}
                      </Text>
                    </View>
                    <View style={{ width: 60 }} className="px-2">
                      <Text
                        className={`text-sm text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {report.total_items || 0}
                      </Text>
                    </View>
                    <View style={{ width: 90 }} className="px-2">
                      <View
                        className="px-2 py-1 rounded-full self-start"
                        style={{ backgroundColor: statusColor.bg }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: statusColor.text }}
                        >
                          {(report.status || "Completed").toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={{ width: 70 }} className="px-2">
                      <TouchableOpacity
                        onPress={() => handlePrintInvoice(report)}
                        className={`p-1.5 rounded-full items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                        disabled={printingInvoice}
                      >
                        <Icon
                          name="printer"
                          size={16}
                          color={isDarkMode ? "#9CA3AF" : "#4b5563"}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={{ width: 70 }} className="px-2">
                      <TouchableOpacity
                        onPress={() => handleViewDetails(report)}
                        className={`p-1.5 rounded-full items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                      >
                        <Icon name="eye" size={16} color="#3b82f6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Loading indicator for infinite scroll */}
          {isFetchingMore && pagination.currentPage < pagination.lastPage && (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading more reports...
              </Text>
            </View>
          )}

          {/* End of list indicator */}
          {pagination.currentPage >= pagination.lastPage && filteredReports.length > 0 && (
            <View className="py-4 items-center">
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Showing all {filteredReports.length} reports
              </Text>
            </View>
          )}
        </ScrollView>

      </View>
    </ScrollView>
  );

  if (loading && !initialLoadComplete && !refreshing) {
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

  if (error && !refreshing) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center p-6`}
      >
        <Icon name="alert-circle" size={60} color="#ef4444" />
        <Text className="text-red-500 text-lg font-semibold mt-4">
          Error Loading Reports
        </Text>
        <Text
          className={`text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => fetchReports(1, startDate, endDate)}
          className="mt-6 bg-blue-500 px-8 py-4 rounded-xl flex-row items-center"
        >
          <Icon name="refresh" size={20} color="#ffffff" />
          <Text className="text-white font-semibold ml-2">Retry</Text>
        </TouchableOpacity>
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
        title="Reports Dashboard"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Reports"
        navigationItems={navigationItems}
        rightComponent={
          <View className="flex-row items-center">
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
            <TouchableOpacity
              onPress={handlePrintAll}
              className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon
                name="printer"
                size={22}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Statistics Cards */}
      {!loading && filteredReports.length > 0 && (
        <View className="px-4 py-4">
          <View className="flex-row flex-wrap justify-between">
            <View
              className={`p-4 rounded-2xl mb-3 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
              style={{ width: "48%" }}
            >
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Total Revenue
              </Text>
              <Text className="text-xl font-bold text-green-600 mt-1">
                {formatCurrency(
                  parseFloat(summaryStats.totalSalesAmount || stats.revenue),
                )}
              </Text>
            </View>
            <View
              className={`p-4 rounded-2xl mb-3 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
              style={{ width: "48%" }}
            >
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Total Orders
              </Text>
              <Text
                className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                {pagination.total || stats.orders}
              </Text>
            </View>
            <View
              className={`p-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
              style={{ width: "48%" }}
            >
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Products Sold
              </Text>
              <Text
                className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                {summaryStats.totalSalesItems || stats.products}
              </Text>
            </View>
            <View
              className={`p-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
              style={{ width: "48%" }}
            >
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Total Due
              </Text>
              <Text className="text-xl font-bold text-orange-600 mt-1">
                {formatCurrency(parseFloat(summaryStats.totalDue || stats.due))}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Filters Section */}
      <View
        className={`mx-4 p-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm mb-4`}
      >
        <View className="flex-row items-center mb-3">
          <View
            className={`flex-1 flex-row items-center rounded-xl px-3 h-10 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
          >
            <Icon name="magnify" size={18} color="#9ca3af" />
            <TextInput
              className={`flex-1 ml-2 text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}
              placeholder="Search by invoice ID, customer, or store..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="close-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleFilterPress} className="ml-2 p-2">
            <Icon
              name="filter"
              size={20}
              color={isDarkMode ? "#9CA3AF" : "#4b5563"}
            />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: "all", label: "All Time" },
            { id: "today", label: "Today" },
            { id: "currentMonth", label: "This Month" },
            { id: "7days", label: "Last 7 Days" },
            { id: "30days", label: "Last 30 Days" },
            { id: "pastMonth", label: "Past Month" },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => handleQuickFilter(filter.id)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedFilter === filter.id
                  ? "bg-blue-500"
                  : isDarkMode
                    ? "bg-gray-700"
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

      {/* Card or Table View */}
      {viewMode === "cards" ? <CardView /> : <TableView />}

      {/* Filters Modal */}
      <ReportFilters
        visible={showFilters}
        onClose={handleFiltersClose}
        onApply={handleFiltersApply}
        isDarkMode={isDarkMode}
        initialFilters={{ startDate: startDate, endDate: endDate }}
        summary={summaryStats}
      />

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
