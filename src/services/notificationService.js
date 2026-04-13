import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Add listeners
      this.notificationListener = Notifications.addNotificationReceivedListener(
        this.handleNotificationReceived
      );

      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        this.handleNotificationResponse
      );

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  handleNotificationReceived = (notification) => {
    console.log('Notification received:', notification);
  };

  handleNotificationResponse = (response) => {
    console.log('Notification response:', response);
    // Handle notification tap here
  };

  async scheduleNotification(title, body, data = {}, trigger = null) {
    try {
      await this.initialize();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: trigger || { seconds: 1 },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async sendLocalNotification(title, body, data = {}) {
    try {
      await this.initialize();

      await Notifications.presentNotificationAsync({
        title,
        body,
        data,
        sound: 'default',
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getNotificationChannels() {
    try {
      return await Notifications.getNotificationChannelsAsync();
    } catch (error) {
      console.error('Error getting notification channels:', error);
      return [];
    }
  }

  async setNotificationChannel(channelId, name, importance = Notifications.AndroidImportance.DEFAULT) {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(channelId, {
          name,
          importance,
          sound: 'default',
          enableVibrate: true,
        });
      } catch (error) {
        console.error('Error setting notification channel:', error);
      }
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    this.isInitialized = false;
  }
}

export const notificationService = new NotificationService();

// Predefined notification types
export const NOTIFICATION_TYPES = {
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_CANCELLED: 'order_cancelled',
  LOW_STOCK: 'low_stock',
  PRODUCT_CREATED: 'product_created',
  CUSTOMER_CREATED: 'customer_created',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM_UPDATE: 'system_update',
};

// Helper functions for common notifications
export const notifyOrderCreated = async (orderNumber) => {
  await notificationService.sendLocalNotification(
    'New Order',
    `Order #${orderNumber} has been created`,
    { type: NOTIFICATION_TYPES.ORDER_CREATED, orderNumber }
  );
};

export const notifyLowStock = async (productName, currentStock) => {
  await notificationService.sendLocalNotification(
    'Low Stock Alert',
    `${productName} is running low on stock (${currentStock} units)`,
    { type: NOTIFICATION_TYPES.LOW_STOCK, productName, currentStock }
  );
};

export const notifyPaymentReceived = async (amount, orderNumber) => {
  await notificationService.sendLocalNotification(
    'Payment Received',
    `Payment of $${amount} received for order #${orderNumber}`,
    { type: NOTIFICATION_TYPES.PAYMENT_RECEIVED, amount, orderNumber }
  );
};

export default notificationService;
