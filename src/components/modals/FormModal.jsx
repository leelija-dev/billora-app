import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FormModal = ({ 
  visible, 
  onClose, 
  title, 
  children, 
  isDarkMode,
  icon 
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View 
          className={`rounded-xl w-full max-h-[90%] ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl overflow-hidden`}
        >
          {/* Header */}
          <View className={`flex-row justify-between items-center p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <View className="flex-row items-center">
              <Icon name={icon} size={24} color={isDarkMode ? '#60A5FA' : '#3B82F6'} />
              <Text className={`text-lg font-semibold ml-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default FormModal;