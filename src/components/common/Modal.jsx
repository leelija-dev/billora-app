import React from 'react';
import { Modal as RNModal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import Button from './Button';

const Modal = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdropPress = true,
  showFooter = false,
  footerButtons = [],
  style,
  contentStyle,
}) => {
  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose?.();
    }
  };

  const renderHeader = () => {
    if (!title && !showCloseButton) return null;

    return (
      <View style={styles.header}>
        {title && (
          <Text style={styles.title}>{title}</Text>
        )}
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!showFooter || footerButtons.length === 0) return null;

    return (
      <View style={styles.footer}>
        {footerButtons.map((button, index) => (
          <Button
            key={index}
            title={button.title}
            onPress={button.onPress}
            variant={button.variant || 'primary'}
            size={button.size || 'medium'}
            loading={button.loading}
            disabled={button.disabled}
            style={[
              styles.footerButton,
              footerButtons.length > 1 && index === 0 && styles.footerButtonSecondary,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.container, style]}
            onPress={(e) => e.stopPropagation()}
          >
            {renderHeader()}
            <View style={[styles.content, contentStyle]}>
              {children}
            </View>
            {renderFooter()}
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableOpacity>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    maxHeight: '80%',
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    flex: 1,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  content: {
    padding: theme.spacing.lg,
    maxHeight: 400,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonSecondary: {
    flex: 1,
  },
});

export default Modal;
