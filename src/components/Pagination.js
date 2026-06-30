// components/Pagination.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Pagination = ({ 
  currentPage, 
  lastPage, 
  total, 
  onPageChange,
  perPage = 15
}) => {
  if (lastPage <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (lastPage <= maxVisible) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(lastPage - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= lastPage - 2) {
        start = lastPage - 3;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < lastPage - 1) {
        pages.push('...');
      }
      
      if (lastPage > 1) {
        pages.push(lastPage);
      }
    }
    
    return pages;
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <Text className="text-sm text-gray-500">
        Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, total)} of {total}
      </Text>
      
      <View className="flex-row items-center space-x-1">
        <TouchableOpacity
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg ${currentPage === 1 ? 'opacity-50' : ''}`}
        >
          <Ionicons name="chevron-back" size={18} color="#4B5563" />
        </TouchableOpacity>

        {getPageNumbers().map((page, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => typeof page === 'number' && onPageChange(page)}
            className={`px-3 py-1.5 rounded-lg ${
              page === currentPage
                ? 'bg-blue-500'
                : typeof page === 'number'
                ? 'bg-gray-100'
                : 'bg-transparent'
            }`}
            disabled={typeof page !== 'number'}
          >
            <Text className={`text-sm font-medium ${
              page === currentPage
                ? 'text-white'
                : typeof page === 'number'
                ? 'text-gray-700'
                : 'text-gray-400'
            }`}>
              {page}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className={`p-2 rounded-lg ${currentPage === lastPage ? 'opacity-50' : ''}`}
        >
          <Ionicons name="chevron-forward" size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Pagination;