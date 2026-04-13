import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

const Loading = ({
  size = 'medium',
  color = theme.colors.primary,
  text,
  overlay = false,
  style,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'small';
    }
  };

  const getContainerStyles = () => {
    const baseStyles = [styles.container];
    
    if (overlay) {
      baseStyles.push(styles.overlay);
    }
    
    return baseStyles;
  };

  return (
    <View style={[getContainerStyles(), style]}>
      <ActivityIndicator size={getSize()} color={color} />
      {text && (
        <Text style={[styles.text, { color }]}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  text: {
    ...theme.typography.body2,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default Loading;