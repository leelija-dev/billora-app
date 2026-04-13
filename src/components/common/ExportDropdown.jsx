// components/common/ExportDropdown.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ExportDropdown = ({
  visible,
  onToggle,
  onExportPDF,
  onExportExcel,
  onExportWord,
  isExporting,
  isDarkMode,
}) => {
  return (
    <View className="relative">
      {/* Export Button */}
      <TouchableOpacity
        onPress={onToggle}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}
        disabled={isExporting}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : (
          <Icon name="export" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
        )}
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onToggle}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onToggle}
        >
          <View className="flex-1">
            <View
              className={`absolute top-14 right-4 w-48 rounded-xl shadow-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
              style={{
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}
            >
              {/* PDF Option */}
              <TouchableOpacity
                onPress={() => {
                  onToggle();
                  onExportPDF();
                }}
                className={`flex-row items-center px-4 py-3 border-b ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
                disabled={isExporting}
              >
                <Icon name="file-pdf-box" size={20} color="#ef4444" />
                <Text className={`flex-1 ml-3 font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Export as PDF
                </Text>
              </TouchableOpacity>

              {/* Excel Option */}
              <TouchableOpacity
                onPress={() => {
                  onToggle();
                  onExportExcel();
                }}
                className={`flex-row items-center px-4 py-3 border-b ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
                disabled={isExporting}
              >
                <Icon name="microsoft-excel" size={20} color="#10b981" />
                <Text className={`flex-1 ml-3 font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Export as Excel
                </Text>
              </TouchableOpacity>

              {/* Word Option */}
              <TouchableOpacity
                onPress={() => {
                  onToggle();
                  onExportWord();
                }}
                className={`flex-row items-center px-4 py-3 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
                disabled={isExporting}
              >
                <Icon name="microsoft-word" size={20} color="#3b82f6" />
                <Text className={`flex-1 ml-3 font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Export as Word
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ExportDropdown;