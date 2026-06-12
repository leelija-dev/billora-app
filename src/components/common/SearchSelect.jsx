import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SearchSelect = ({
  label,
  options = [],
  value,
  onSelect,
  error,
  placeholder = 'Search...',
  required = false,
  disabled = false,
  isDarkMode = false,
  onCreateNew,
  loading = false,
  displayKey = 'label',
  valueKey = 'value',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Find selected option
  const selectedOption = options.find(opt => opt[valueKey] === value);
  const displayValue = selectedOption ? selectedOption[displayKey] : '';

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return options;
    const searchLower = searchTerm.toLowerCase();
    return options.filter(option => {
      const labelMatch = option[displayKey]?.toLowerCase().includes(searchLower);
      const descriptionMatch = option.description?.toLowerCase().includes(searchLower);
      return labelMatch || descriptionMatch;
    });
  }, [options, searchTerm, displayKey]);

  const handleSelect = (selectedValue, selectedOption) => {
    onSelect(selectedValue, selectedOption);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    onSelect('', null);
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew(searchTerm);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const renderOption = ({ item, index }) => {
    const isHighlighted = index === highlightedIndex;
    const isSelected = item[valueKey] === value;

    return (
      <TouchableOpacity
        key={item[valueKey]}
        onPress={() => handleSelect(item[valueKey], item)}
        onMouseEnter={() => setHighlightedIndex(index)}
        className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        } ${isHighlighted ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {item[displayKey]}
            </Text>
            {item.description && (
              <Text className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.description}
              </Text>
            )}
            {item.subtext && (
              <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {item.subtext}
              </Text>
            )}
          </View>
          {isSelected && (
            <Icon name="check" size={20} color="#3b82f6" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="mb-4">
      {/* Label */}
      {label && (
        <View className="flex-row mb-2">
          <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}
          </Text>
          {required && <Text className="text-red-500 ml-1">*</Text>}
        </View>
      )}

      {/* Select Button */}
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`border rounded-xl px-4 py-3 flex-row justify-between items-center ${
          error
            ? 'border-red-500'
            : isDarkMode
            ? 'border-gray-600 bg-gray-700'
            : 'border-gray-300 bg-white'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <Text
          className={`flex-1 ${!displayValue ? (isDarkMode ? 'text-gray-500' : 'text-gray-400') : isDarkMode ? 'text-white' : 'text-gray-800'}`}
        >
          {displayValue || placeholder}
        </Text>
        <View className="flex-row items-center">
          {value && (
            <TouchableOpacity onPress={handleClear} className="mr-2 p-1">
              <Icon name="close-circle" size={18} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
            </TouchableOpacity>
          )}
          <Icon name="chevron-down" size={20} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
        </View>
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <Text className="mt-1 text-sm text-red-500">{error}</Text>
      )}

      {/* Modal Dropdown */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
          className="flex-1 bg-black/50 justify-center items-center px-4"
        >
          <View
            className={`rounded-xl w-full max-h-96 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl overflow-hidden`}
          >
            {/* Header */}
            <View className={`flex-row justify-between items-center p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Select {label}
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Icon name="close" size={24} color={isDarkMode ? '#9CA3AF' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <View className={`flex-row items-center rounded-xl px-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}>
                <Icon name="magnify" size={20} color={isDarkMode ? '#9CA3AF' : '#9ca3af'} />
                <TextInput
                  className={`flex-1 ml-2 py-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                  placeholder={`Search ${label?.toLowerCase()}...`}
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9ca3af'}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  autoFocus
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchTerm('')}>
                    <Icon name="close-circle" size={18} color={isDarkMode ? '#9CA3AF' : '#9ca3af'} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Options List */}
            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : filteredOptions.length > 0 ? (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item[valueKey].toString()}
                renderItem={renderOption}
                showsVerticalScrollIndicator={true}
                className="max-h-80"
              />
            ) : (
              <View className="py-12 items-center px-4">
                <Icon name="magnify-off" size={48} color={isDarkMode ? '#4b5563' : '#9ca3af'} />
                <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchTerm ? `No results found for "${searchTerm}"` : `No ${label?.toLowerCase()} available`}
                </Text>
                {onCreateNew && searchTerm && (
                  <TouchableOpacity
                    onPress={handleCreateNew}
                    className="mt-4 bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
                  >
                    <Icon name="plus" size={18} color="#fff" />
                    <Text className="text-white ml-2">Create "{searchTerm}"</Text>
                  </TouchableOpacity>
                )}
                {onCreateNew && !searchTerm && (
                  <TouchableOpacity
                    onPress={() => onCreateNew('')}
                    className="mt-4 bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
                  >
                    <Icon name="plus" size={18} color="#fff" />
                    <Text className="text-white ml-2">Add New {label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default SearchSelect;