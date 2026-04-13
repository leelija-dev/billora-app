import React, { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../hooks/useTheme";

const Input = ({
  label,
  value,
  onChangeText,
  onBlur,
  onFocus,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  success,
  warning,
  helper,
  loading = false,
  required = false,
  maxLength,
  disabled = false,
  returnKeyType = "done",
  onSubmitEditing,
  ...props
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const inputRef = useRef(null);

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (warning) return theme.colors.warning;
    if (success) return theme.colors.success;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  const getIconColor = () => {
    if (error) return theme.colors.error;
    if (warning) return theme.colors.warning;
    if (success) return theme.colors.success;
    if (isFocused) return theme.colors.primary;
    return theme.colors.textTertiary;
  };

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 5,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error]);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  const focus = () => {
    inputRef.current?.focus();
  };

  return (
    <Animated.View
      style={{
        marginBottom: theme.spacing.md,
        transform: [{ translateX: shakeAnimation }],
      }}
    >
      {label && (
        <TouchableOpacity onPress={focus} activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text,
            }}>
              {label}
            </Text>
            {required && (
              <Text style={{ color: theme.colors.error, marginLeft: 4 }}>*</Text>
            )}
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        activeOpacity={1}
        onPress={focus}
        disabled={disabled || !editable}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: getBorderColor(),
            borderRadius: theme.borderRadius.lg,
            backgroundColor: disabled 
              ? theme.colors.surface 
              : theme.isDark ? theme.colors.surface : '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: multiline ? 12 : 10,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {leftIcon && (
            <View style={{ marginRight: 12 }}>
              {typeof leftIcon === "string" ? (
                <Icon name={leftIcon} size={20} color={getIconColor()} />
              ) : (
                leftIcon
              )}
            </View>
          )}

          <TextInput
            ref={inputRef}
            style={{
              flex: 1,
              fontSize: 16,
              color: disabled ? theme.colors.textTertiary : theme.colors.text,
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight: multiline ? 80 : 'auto',
              padding: 0,
            }}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            secureTextEntry={isSecure}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            editable={!disabled && editable}
            maxLength={maxLength}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            {...props}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {loading && (
              <ActivityIndicator size="small" color={getIconColor()} />
            )}

            {secureTextEntry && !loading && (
              <TouchableOpacity onPress={toggleSecureEntry}>
                <Icon
                  name={isSecure ? "eye-off" : "eye"}
                  size={20}
                  color={getIconColor()}
                />
              </TouchableOpacity>
            )}

            {rightIcon && !secureTextEntry && !loading && (
              <TouchableOpacity
                onPress={onRightIconPress}
                disabled={!onRightIconPress}
              >
                {typeof rightIcon === "string" ? (
                  <Icon name={rightIcon} size={20} color={getIconColor()} />
                ) : (
                  rightIcon
                )}
              </TouchableOpacity>
            )}

            {success && !rightIcon && !secureTextEntry && !loading && (
              <Icon name="check-circle" size={20} color={theme.colors.success} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {(error || warning || helper) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          {error && (
            <>
              <Icon name="alert-circle" size={14} color={theme.colors.error} />
              <Text style={{
                fontSize: 12,
                color: theme.colors.error,
                marginLeft: 4,
              }}>{error}</Text>
            </>
          )}
          {warning && !error && (
            <>
              <Icon name="alert" size={14} color={theme.colors.warning} />
              <Text style={{
                fontSize: 12,
                color: theme.colors.warning,
                marginLeft: 4,
              }}>{warning}</Text>
            </>
          )}
          {helper && !error && !warning && (
            <>
              <Icon name="information" size={14} color={theme.colors.textTertiary} />
              <Text style={{
                fontSize: 12,
                color: theme.colors.textTertiary,
                marginLeft: 4,
              }}>{helper}</Text>
            </>
          )}
        </View>
      )}

      {maxLength > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
          <Text style={{
            fontSize: 12,
            color: theme.colors.textTertiary,
          }}>
            {value?.length || 0}/{maxLength}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default Input;