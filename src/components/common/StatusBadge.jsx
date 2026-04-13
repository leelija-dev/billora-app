import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const StatusBadge = ({
  status,
  variant = 'default',
  size = 'medium',
  style,
}) => {
  const getStatusConfig = () => {
    const configs = {
      success: {
        backgroundColor: theme.colors.success + '20',
        textColor: theme.colors.success,
        borderColor: theme.colors.success,
      },
      warning: {
        backgroundColor: theme.colors.warning + '20',
        textColor: theme.colors.warning,
        borderColor: theme.colors.warning,
      },
      error: {
        backgroundColor: theme.colors.error + '20',
        textColor: theme.colors.error,
        borderColor: theme.colors.error,
      },
      info: {
        backgroundColor: theme.colors.info + '20',
        textColor: theme.colors.info,
        borderColor: theme.colors.info,
      },
      default: {
        backgroundColor: theme.colors.backgroundSecondary,
        textColor: theme.colors.textSecondary,
        borderColor: theme.colors.border,
      },
    };
    
    return configs[variant] || configs.default;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return styles.smallBadge;
      case 'large':
        return styles.largeBadge;
      default:
        return styles.mediumBadge;
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'small':
        return styles.smallText;
      case 'large':
        return styles.largeText;
      default:
        return styles.mediumText;
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={[
        styles.badge,
        getSizeStyles(),
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          getTextSizeStyles(),
          {
            color: config.textColor,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  smallBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    minHeight: 20,
  },
  mediumBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minHeight: 28,
  },
  largeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36,
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  smallText: {
    ...theme.typography.caption,
    fontSize: 10,
  },
  mediumText: {
    ...theme.typography.caption,
  },
  largeText: {
    ...theme.typography.body2,
  },
});

export default StatusBadge;
