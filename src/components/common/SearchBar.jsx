import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

const SearchBar = ({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Search...',
  onClear,
  showClearButton = true,
  debounceTime = 300,
  style,
  inputStyle,
  ...props
}) => {
  const [searchValue, setSearchValue] = useState(value || '');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    setSearchValue(value || '');
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== debouncedValue) {
        setDebouncedValue(searchValue);
        onSearch?.(searchValue);
      }
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [searchValue, debounceTime, onSearch, debouncedValue]);

  const handleClear = () => {
    setSearchValue('');
    setDebouncedValue('');
    onChangeText?.('');
    onSearch?.('');
    onClear?.();
  };

  const showClear = showClearButton && searchValue.length > 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <View style={styles.iconContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
        <TextInput
          style={[styles.input, inputStyle]}
          value={searchValue}
          onChangeText={(text) => {
            setSearchValue(text);
            onChangeText?.(text);
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          returnKeyType="search"
          onSubmitEditing={() => onSearch?.(searchValue)}
          {...props}
        />
        {showClear && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    color: theme.colors.textTertiary,
  },
  input: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
    minHeight: 44,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  clearIcon: {
    fontSize: 16,
    color: theme.colors.textTertiary,
    fontWeight: 'bold',
  },
});

export default SearchBar;
