import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../../theme';
import Button from './Button';

const EmptyState = ({
  title,
  description,
  image,
  imageSource,
  actionLabel,
  onAction,
  style,
}) => {
  const renderImage = () => {
    if (image) {
      return <View style={styles.imageContainer}>{image}</View>;
    }
    
    if (imageSource) {
      return (
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="contain"
        />
      );
    }
    
    return (
      <View style={styles.defaultImage}>
        <Text style={styles.defaultImageText}>📦</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderImage()}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          size="medium"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  imageContainer: {
    marginBottom: theme.spacing.lg,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.lg,
  },
  defaultImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  defaultImageText: {
    fontSize: 40,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  actionButton: {
    marginTop: theme.spacing.sm,
  },
});

export default EmptyState;
