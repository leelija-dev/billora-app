// screens/reports/ReportsScreen.js
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useReports } from "../../hooks/useReports";
import Header from "../../components/common/Header";
import ReportFilters from "../../components/reports/ReportFilters";
import ReportList from "../../components/reports/ReportList";
import ReportSummary from "../../components/reports/ReportSummary";
import QuickDateFilters from "../../components/reports/QuickDateFilters";
import ReportPrintPreview from "../../components/reports/ReportPrintPreview";
import ExportDropdown from "../../components/common/ExportDropdown";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems";
import { formatDate } from "../../utils/dateFormatter";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { generateReportHTML } from "../../utils/reportPrintHelper";
import { generateExcelReport } from "../../utils/excelExportHelper";
import { generateWordReport } from "../../utils/wordExportHelper";
import { SafeAreaView } from "react-native-safe-area-context";

const ReportsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { 
    reports = [], 
    summary = {},
    loading, 
    error, 
    fetchReports,
    refreshReports,
  } = useReports() || {};
  
  const [showFilters, setShowFilters] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportType, setReportType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [refreshing, setRefreshing] = useState(false);
  const [dateRangeText, setDateRangeText] = useState("Today");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Print related states
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printFormat, setPrintFormat] = useState('a4');
  const [printData, setPrintData] = useState(null);
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Function to update dateRangeText based on date selection
  const updateDateRangeText = useCallback((start, end) => {
    const today = new Date();
    const startStr = formatDate(start, 'YYYY-MM-DD');
    const endStr = formatDate(end, 'YYYY-MM-DD');
    const todayStr = formatDate(today, 'YYYY-MM-DD');
    
    if (startStr === todayStr && endStr === todayStr) {
      setDateRangeText("Today");
    } else {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      if (startStr === formatDate(sevenDaysAgo, 'YYYY-MM-DD') && endStr === todayStr) {
        setDateRangeText("Last 7 Days");
      } else {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        if (startStr === formatDate(thirtyDaysAgo, 'YYYY-MM-DD') && endStr === todayStr) {
          setDateRangeText("Last 30 Days");
        } else {
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          if (startStr === formatDate(monthAgo, 'YYYY-MM-DD') && endStr === todayStr) {
            setDateRangeText("This Month");
          } else {
            setDateRangeText(`${formatDate(start, 'MMM DD')} - ${formatDate(end, 'MMM DD')}`);
          }
        }
      }
    }
  }, []);

  // Calculate filtered counts for report types
  const getTypeCount = useCallback((type) => {
    if (type === "all") return reports.length;
    return reports.filter(r => r.type?.toLowerCase() === type.toLowerCase()).length;
  }, [reports]);

  // Filter reports based on type and search query
  const filteredReports = useMemo(() => {
    let filtered = reports;
    
    if (reportType !== "all") {
      filtered = filtered.filter(r => r.type?.toLowerCase() === reportType.toLowerCase());
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name?.toLowerCase().includes(query) ||
        r.id?.toString().includes(query) ||
        r.type?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [reports, reportType, searchQuery]);

  // Prepare print/export data
  const prepareExportData = useCallback(() => {
    return {
      reports: filteredReports,
      summary: summary,
      dateRange: dateRangeText,
      startDate: startDate,
      endDate: endDate,
      reportType: reportType,
      searchQuery: searchQuery,
      generatedAt: new Date(),
      storeInfo: {
        name: "Your Store Name",
        address: "Store Address",
        phone: "Store Phone",
        email: "store@email.com",
        gst: "GSTIN123456",
        website: "www.yourstore.com"
      },
      totals: {
        totalReports: filteredReports.length,
        totalSales: summary.totalSales || 0,
        totalPurchases: summary.totalPurchases || 0,
        totalProfit: summary.totalProfit || 0,
        totalItems: summary.totalItems || 0,
        averageOrderValue: summary.totalSales ? (summary.totalSales / filteredReports.length).toFixed(2) : 0
      },
      user: {
        name: user?.name || "User",
        email: user?.email || "user@email.com"
      }
    };
  }, [filteredReports, summary, dateRangeText, startDate, endDate, reportType, searchQuery, user]);

  // Report types for filtering with dynamic counts
  const reportTypes = useMemo(() => [
    {
      id: "all",
      name: "All Reports",
      icon: "file-document-multiple",
      count: getTypeCount("all"),
      color: "#3b82f6",
    },
    {
      id: "sales",
      name: "Sales",
      icon: "cash",
      count: getTypeCount("sales"),
      color: "#10b981",
    },
    {
      id: "purchases",
      name: "Purchases",
      icon: "cart",
      count: getTypeCount("purchases"),
      color: "#f59e0b",
    },
    {
      id: "inventory",
      name: "Inventory",
      icon: "package",
      count: getTypeCount("inventory"),
      color: "#8b5cf6",
    },
    {
      id: "profits",
      name: "Profits",
      icon: "chart-line",
      count: getTypeCount("profits"),
      color: "#ec4899",
    },
  ], [getTypeCount]);

  const handleFetchReports = useCallback(async () => {
    try {
      await fetchReports({
        start_date: formatDate(startDate, 'YYYY-MM-DD'),
        end_date: formatDate(endDate, 'YYYY-MM-DD'),
      });
      
      updateDateRangeText(startDate, endDate);
      setInitialLoadComplete(true);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setInitialLoadComplete(true);
    }
  }, [fetchReports, startDate, endDate, updateDateRangeText]);

  useEffect(() => {
    handleFetchReports();
  }, []);

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleFiltersClose = () => {
    setShowFilters(false);
  };

  const handleFiltersApply = async (filters) => {
    setShowFilters(false);
    if (filters.startDate) setStartDate(new Date(filters.startDate));
    if (filters.endDate) setEndDate(new Date(filters.endDate));
    if (filters.reportType) setReportType(filters.reportType);
    
    await handleFetchReports();
  };

  const handleDateSearch = async () => {
    await handleFetchReports();
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleReportTypeSelect = (typeId) => {
    setReportType(typeId);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Export functions
  const handleExportPDF = async () => {
    if (filteredReports.length === 0) {
      Alert.alert('No Data', 'There are no reports to export for the selected criteria.');
      return;
    }

    try {
      setIsExporting(true);
      const data = prepareExportData();
      const html = generateReportHTML(data, 'a4');
      
      const { uri } = await Print.printToFileAsync({
        html,
        name: `Reports_${formatDate(new Date(), 'YYYYMMDD_HHmmss')}`,
        orientation: 'portrait',
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
        base64: false,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Export Reports as PDF`,
        UTI: 'com.adobe.pdf',
      });

      setShowExportDropdown(false);
    } catch (error) {
      console.error('PDF Export error:', error);
      Alert.alert('Error', 'Failed to export as PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (filteredReports.length === 0) {
      Alert.alert('No Data', 'There are no reports to export for the selected criteria.');
      return;
    }

    try {
      setIsExporting(true);
      const data = prepareExportData();
      
      // Generate Excel file
      const excelData = generateExcelReport(data);
      const fileName = `Reports_${formatDate(new Date(), 'YYYYMMDD_HHmmss')}.xlsx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Write file
      await FileSystem.writeAsStringAsync(filePath, excelData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share file
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Export Reports as Excel`,
        UTI: 'com.microsoft.excel.xlsx',
      });

      setShowExportDropdown(false);
    } catch (error) {
      console.error('Excel Export error:', error);
      Alert.alert('Error', 'Failed to export as Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    if (filteredReports.length === 0) {
      Alert.alert('No Data', 'There are no reports to export for the selected criteria.');
      return;
    }

    try {
      setIsExporting(true);
      const data = prepareExportData();
      
      // Generate Word document
      const wordData = generateWordReport(data);
      const fileName = `Reports_${formatDate(new Date(), 'YYYYMMDD_HHmmss')}.docx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Write file
      await FileSystem.writeAsStringAsync(filePath, wordData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share file
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        dialogTitle: `Export Reports as Word Document`,
        UTI: 'com.microsoft.word.docx',
      });

      setShowExportDropdown(false);
    } catch (error) {
      console.error('Word Export error:', error);
      Alert.alert('Error', 'Failed to export as Word document');
    } finally {
      setIsExporting(false);
    }
  };

  // Print handler
  const handlePrint = () => {
    if (filteredReports.length === 0) {
      Alert.alert('No Data', 'There are no reports to print for the selected criteria.');
      return;
    }
    
    const data = prepareExportData();
    setPrintData(data);
    setShowPrintPreview(true);
  };

  const executePrint = async () => {
    try {
      if (!printData) {
        Alert.alert('Error', 'No report data available for printing');
        return;
      }

      setIsPrinting(true);
      const html = generateReportHTML(printData, 'a4');
      
      await Print.printAsync({
        html,
        name: `Reports_${formatDate(new Date(), 'YYYYMMDD_HHmmss')}`,
        orientation: 'portrait',
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
      });

      setShowPrintPreview(false);
      Alert.alert('Success', 'Report sent to printer successfully');
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print report. Please check your printer connection.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshReports({
        start_date: formatDate(startDate, 'YYYY-MM-DD'),
        end_date: formatDate(endDate, 'YYYY-MM-DD'),
      });
    } catch (err) {
      console.error("Error refreshing reports:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Quick date filter handlers
  const handleTodayPress = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    setDateRangeText("Today");
    handleDateSearch();
  };

  const handleLast7DaysPress = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartDate(start);
    setEndDate(end);
    setDateRangeText("Last 7 Days");
    handleDateSearch();
  };

  const handleLast30DaysPress = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start);
    setEndDate(end);
    setDateRangeText("Last 30 Days");
    handleDateSearch();
  };

  const handleThisMonthPress = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    setStartDate(start);
    setEndDate(end);
    setDateRangeText("This Month");
    handleDateSearch();
  };

  useFocusEffect(
    useCallback(() => {
      handleFetchReports();
    }, [handleFetchReports])
  );

  const navigationItems = useMemo(() => {
    const badges = {
      reports: filteredReports.length.toString(),
      sales: summary.totalSales ? `$${summary.totalSales}` : null,
    };
    return getNavigationItemsWithBadges(badges);
  }, [filteredReports.length, summary]);

  if (loading && !initialLoadComplete && !refreshing) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Loading reports...
        </Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center p-6`}>
        <Icon name="alert-circle" size={60} color="#ef4444" />
        <Text className="text-red-500 text-lg font-semibold mt-4">Error Loading Reports</Text>
        <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={handleFetchReports}
          className="mt-6 bg-blue-500 px-8 py-4 rounded-xl flex-row items-center"
        >
          <Icon name="refresh" size={20} color="#ffffff" />
          <Text className="text-white font-semibold ml-2">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Reports"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Reports"
        navigationItems={navigationItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={toggleViewMode}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon
                name={viewMode === "grid" ? "view-grid" : "view-list"}
                size={22}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            
            {/* Export Dropdown */}
            <ExportDropdown
              visible={showExportDropdown}
              onToggle={() => setShowExportDropdown(!showExportDropdown)}
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onExportWord={handleExportWord}
              isExporting={isExporting}
              isDarkMode={isDarkMode}
            />
            
            {/* Print Button */}
            <TouchableOpacity
              onPress={handlePrint}
              className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon name="printer" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Date Range Selector */}
      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="calendar-range" size={22} color="#9ca3af" />
          <TouchableOpacity
            onPress={() => setShowStartDatePicker(true)}
            className="flex-1 ml-3"
          >
            <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Start Date
            </Text>
            <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {formatDate(startDate, 'MMM DD, YYYY')}
            </Text>
          </TouchableOpacity>
          
          <Icon name="arrow-right" size={20} color="#9ca3af" />
          
          <TouchableOpacity
            onPress={() => setShowEndDatePicker(true)}
            className="flex-1 ml-3"
          >
            <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              End Date
            </Text>
            <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {formatDate(endDate, 'MMM DD, YYYY')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDateSearch}
            className="ml-2 bg-blue-500 px-4 py-2 rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold">Apply</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Date Filters */}
      <QuickDateFilters
        dateRangeText={dateRangeText}
        isDarkMode={isDarkMode}
        loading={loading}
        onSelectToday={handleTodayPress}
        onSelectLast7Days={handleLast7DaysPress}
        onSelectLast30Days={handleLast30DaysPress}
        onSelectThisMonth={handleThisMonthPress}
      />

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
          maximumDate={endDate}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
        className="flex-1"
      >
        <ReportSummary 
          summary={summary} 
          isDarkMode={isDarkMode}
          dateRange={dateRangeText}
        />

        <View className="py-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4"
          >
            {reportTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => handleReportTypeSelect(type.id)}
                className={`flex-row items-center mr-3 px-4 py-2.5 rounded-full border ${
                  reportType === type.id
                    ? "bg-blue-500 border-blue-500"
                    : isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-white'
                } shadow-sm`}
              >
                <Icon
                  name={type.icon}
                  size={18}
                  color={
                    reportType === type.id 
                      ? "#ffffff" 
                      : isDarkMode ? '#9CA3AF' : type.color
                  }
                />
                <Text
                  className={`ml-2 font-medium ${
                    reportType === type.id
                      ? "text-white"
                      : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {type.name}
                </Text>
                <View
                  className={`ml-2 px-2 py-0.5 rounded-full ${
                    reportType === type.id
                      ? "bg-white/20"
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      reportType === type.id
                        ? "text-white"
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {type.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="px-4 pt-2 pb-4">
          <View className={`flex-row items-center rounded-2xl px-4 h-12 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Icon name="magnify" size={20} color="#9ca3af" />
            <TextInput
              className={`flex-1 ml-3 text-base ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}
              placeholder="Search reports..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleFilterPress}
              className={`ml-2 p-2 border-l ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <Icon name="tune" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 px-4 pb-20">
          <ReportList
            viewMode={viewMode}
            searchQuery={searchQuery}
            reportType={reportType}
            startDate={startDate}
            endDate={endDate}
            onRefresh={handleRefresh}
            loading={loading}
            reports={reports}
            error={error}
          />
        </View>
      </ScrollView>

      <ReportFilters 
        visible={showFilters} 
        onClose={handleFiltersClose}
        onApply={handleFiltersApply}
        isDarkMode={isDarkMode}
        initialFilters={{
          startDate: startDate,
          endDate: endDate,
          reportType: reportType,
        }}
        summary={summary}
      />

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
                Print Preview - A4
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
                      <Text className="text-white font-semibold ml-1">Print</Text>
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