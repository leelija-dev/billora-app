import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';

const Card = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
  shadow = 'md',
  gradient = false,
  gradientColors,
  ...props
}) => {
  const getCardStyles = () => {
    const baseStyles = [styles.card];
    
    switch (padding) {
      case 'none':
        baseStyles.push(styles.noPadding);
        break;
      case 'sm':
        baseStyles.push(styles.smallPadding);
        break;
      case 'md':
        baseStyles.push(styles.mediumPadding);
        break;
      case 'lg':
        baseStyles.push(styles.largePadding);
        break;
      default:
        baseStyles.push(styles.mediumPadding);
    }
    
    switch (variant) {
      case 'outlined':
        baseStyles.push(styles.outlinedCard);
        break;
      case 'elevated':
        baseStyles.push(styles.elevatedCard);
        break;
      default:
        baseStyles.push(styles.defaultCard);
    }
    
    if (shadow) {
      baseStyles.push(theme.shadows[shadow]);
    }
    
    return baseStyles;
  };

  const CardComponent = View;
  const cardProps = {
    style: getCardStyles(),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        {...props}
      >
        <CardComponent {...cardProps}>
          {children}
        </CardComponent>
      </TouchableOpacity>
    );
  }

  return (
    <CardComponent {...cardProps} {...props}>
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background,
  },
  defaultCard: {
    backgroundColor: theme.colors.background,
  },
  outlinedCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevatedCard: {
    backgroundColor: theme.colors.background,
  },
  noPadding: {
    padding: 0,
  },
  smallPadding: {
    padding: theme.spacing.sm,
  },
  mediumPadding: {
    padding: theme.spacing.md,
  },
  largePadding: {
    padding: theme.spacing.lg,
  },
});

export default Card;
