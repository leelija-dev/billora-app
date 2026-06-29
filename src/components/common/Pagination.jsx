// components/common/Pagination.js
import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  isPaginating = false,
  isDarkMode = false,
  pageSize = 15,
}) => {
  if (totalPages <= 1) return null;

  // Calculate range for display
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Get page numbers to display (like web's getPageNumbers)
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const handlePageChange = (page) => {
    if (page === '...') return;
    if (isPaginating) return;
    if (page < 1 || page > totalPages) return;
    if (page === currentPage) return;
    
    onPageChange(page);
  };

  const pageNumbers = getPageNumbers();

  return (
    <View className="py-4">
      {/* Results info - like web */}
      <View className="flex-row items-center justify-between mb-4 px-2">
        <View className="flex-row items-center">
          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing{' '}
            <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {startItem}
            </Text>
            {' to '}
            <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {endItem}
            </Text>
            {' of '}
            <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {totalItems}
            </Text>
            {' results'}
          </Text>
        </View>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Page {currentPage} of {totalPages}
        </Text>
      </View>

      {/* Pagination controls - matching web layout */}
      <View className="flex-row items-center justify-center space-x-2">
        {/* First Page Button */}
        <TouchableOpacity
          onPress={() => handlePageChange(1)}
          disabled={currentPage === 1 || isPaginating}
          activeOpacity={0.7}
          className={`w-10 h-10 rounded-xl items-center justify-center border ${
            currentPage === 1 || isPaginating
              ? `border-gray-200 dark:border-gray-700 opacity-40`
              : `border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm`
          }`}
        >
          <Icon
            name="chevron-double-left"
            size={18}
            color={isDarkMode ? "#9CA3AF" : "#4b5563"}
          />
        </TouchableOpacity>

        {/* Previous Button */}
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isPaginating}
          activeOpacity={0.7}
          className={`w-10 h-10 rounded-xl items-center justify-center border ${
            currentPage === 1 || isPaginating
              ? `border-gray-200 dark:border-gray-700 opacity-40`
              : `border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm`
          }`}
        >
          <Icon
            name="chevron-left"
            size={18}
            color={isDarkMode ? "#9CA3AF" : "#4b5563"}
          />
        </TouchableOpacity>

        {/* Page Numbers - horizontal scrollable for many pages */}
        <View className="flex-row items-center space-x-1 max-w-[200px]">
          {pageNumbers.map((page, index) => {
            const isActive = page === currentPage;
            const isDots = page === '...';

            if (isDots) {
              return (
                <View
                  key={`dots-${index}`}
                  className="w-8 h-8 items-center justify-center"
                >
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    …
                  </Text>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={page}
                onPress={() => handlePageChange(page)}
                disabled={isPaginating}
                activeOpacity={0.7}
                className={`min-w-[2rem] h-8 px-3 rounded-lg items-center justify-center ${
                  isActive
                    ? 'bg-blue-500 shadow-md'
                    : `bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600`
                }`}
                style={{
                  shadowColor: isActive ? '#3b82f6' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.3 : 0,
                  shadowRadius: 4,
                  elevation: isActive ? 4 : 0,
                }}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-white'
                      : isDarkMode
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}
                >
                  {page}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isPaginating}
          activeOpacity={0.7}
          className={`w-10 h-10 rounded-xl items-center justify-center border ${
            currentPage === totalPages || isPaginating
              ? `border-gray-200 dark:border-gray-700 opacity-40`
              : `border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm`
          }`}
        >
          <Icon
            name="chevron-right"
            size={18}
            color={isDarkMode ? "#9CA3AF" : "#4b5563"}
          />
        </TouchableOpacity>

        {/* Last Page Button */}
        <TouchableOpacity
          onPress={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || isPaginating}
          activeOpacity={0.7}
          className={`w-10 h-10 rounded-xl items-center justify-center border ${
            currentPage === totalPages || isPaginating
              ? `border-gray-200 dark:border-gray-700 opacity-40`
              : `border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm`
          }`}
        >
          <Icon
            name="chevron-double-right"
            size={18}
            color={isDarkMode ? "#9CA3AF" : "#4b5563"}
          />
        </TouchableOpacity>

        {/* Loading indicator */}
        {isPaginating && (
          <ActivityIndicator size="small" color="#3b82f6" className="ml-2" />
        )}
      </View>
    </View>
  );
};

export default Pagination;