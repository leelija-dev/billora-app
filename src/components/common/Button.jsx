import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';


const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'md', // sm, md, lg
  fullWidth = false,
  leftIcon,
  rightIcon,
  style = {},
  textStyle = {},
  gradientColors,
  ...props
}) => {
  const theme = useTheme();

  const getButtonStyles = () => {
    const baseStyles = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.lg,
      opacity: disabled || loading ? 0.6 : 1,
    };

    // Size styles
    const sizeStyles = {
      sm: {
        paddingVertical: 8,
        paddingHorizontal: 16,
      },
      md: {
        paddingVertical: 12,
        paddingHorizontal: 24,
      },
      lg: {
        paddingVertical: 16,
        paddingHorizontal: 32,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
    };
  };

  const getTextStyles = () => {
    const baseStyles = {
      fontSize: size === 'sm' ? 14 : size === 'md' ? 16 : 18,
      fontWeight: '600',
    };

    const variantTextStyles = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: '#FFFFFF',
      },
      outline: {
        color: theme.colors.primary,
      },
      ghost: {
        color: theme.colors.primary,
      },
    };

    return {
      ...baseStyles,
      ...variantTextStyles[variant],
    };
  };

  const renderContent = () => (
    <>
      {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' 
            ? theme.colors.primary 
            : '#FFFFFF'
          } 
        />
      ) : (
        <Text style={[getTextStyles(), textStyle]}>{title}</Text>
      )}
      {rightIcon && !loading && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
    </>
  );

  if (gradientColors && variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[getButtonStyles(), style]}
        {...props}
      >
        <LinearGradient
          colors={gradientColors || [theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            ...getButtonStyles(),
            ...style,
            backgroundColor: 'transparent',
          }}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[getButtonStyles(), style]}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default Button;