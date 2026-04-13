// screens/settings/SettingsScreen.js
import { useNavigation } from '@react-navigation/native';
import { Alert, ScrollView, Text, View, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/themeStore';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState('weekly');
  const [autoLock, setAutoLock] = useState('5 minutes');

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const handleThemeToggle = () => {
    toggleDarkMode();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear cache logic here
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleCheckForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new version is available. Would you like to update now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Update',
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              },
            },
          ]
        );
      } else {
        Alert.alert('Up to Date', 'You are running the latest version');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check for updates');
    }
  };

  const SettingItem = ({ icon, label, value, onPress, type = 'default', rightElement, gradient }) => (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-5 py-4 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-100'
      }`}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View className="flex-row items-center flex-1">
        <LinearGradient
          colors={gradient || (type === 'danger' ? ['#FF416C', '#FF4B2B'] : ['#4158D0', '#C850C0'])}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-10 h-10 rounded-xl items-center justify-center mr-4"
          style={{
            borderRadius:5,
          }}
        >
          <Ionicons name={icon} size={20} color="#FFFFFF" />
        </LinearGradient>
        <View className="flex-1">
          <Text className={`text-base font-medium ${
            type === 'danger' 
              ? 'text-red-500' 
              : isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {label}
          </Text>
          {value && (
            <Text className={`text-sm mt-0.5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {value}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isDarkMode ? '#4B5563' : '#D1D5DB'} 
        />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, gradient }) => (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="px-5 py-3"
    >
      <Text className="text-white font-semibold text-base tracking-wider">
        {title}
      </Text>
    </LinearGradient>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['left', 'right', 'top']}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-5 py-4 border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <Text className={`text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Settings</Text>
        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Ionicons 
            name="notifications-outline" 
            size={24} 
            color={isDarkMode ? '#FFFFFF' : '#1F2937'} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <LinearGradient
          colors={['#4158D0', '#C850C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-5 mt-5 rounded-2xl p-5"
          style={{
            shadowColor: '#4158D0',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            borderRadius:10,
          }}
        >
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-row items-center flex-1">
              <LinearGradient
                colors={['#FFE5B4', '#FFB6C1']}
                className="w-16 h-16 rounded-xl items-center justify-center mr-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                  borderRadius:100,
                }}
              >
                <Text className="text-2xl font-bold text-[#4158D0]">
                  {user?.name?.charAt(0) || 'U'}
                </Text>
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-lg font-bold text-white mb-1">
                  {user?.name || 'User Name'}
                </Text>
                <Text className="text-sm text-white/80">
                  {user?.email || 'user@example.com'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={handleProfile}
              className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center"
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row justify-around items-center bg-white/10 rounded-xl p-4">
            <View className="items-center">
              <Text className="text-xl font-bold text-white mb-1">128</Text>
              <Text className="text-xs text-white/80">Orders</Text>
            </View>
            <View className="w-px h-8 bg-white/20" />
            <View className="items-center">
              <Text className="text-xl font-bold text-white mb-1">$4.5k</Text>
              <Text className="text-xs text-white/80">Spent</Text>
            </View>
            <View className="w-px h-8 bg-white/20" />
            <View className="items-center">
              <Text className="text-xl font-bold text-white mb-1">3</Text>
              <Text className="text-xs text-white/80">Years</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Appearance Section */}
        <View className={`mx-5 mt-5 rounded-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <SectionHeader title="APPEARANCE" gradient={['#FF512F', '#F09819']} />
          
          <SettingItem
            icon="moon-outline"
            label="Dark Mode"
            value={isDarkMode ? 'Enabled' : 'Disabled'}
            gradient={['#FF512F', '#F09819']}
            
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ false: '#E5E7EB', true: '#FBBF24' }}
                thumbColor={isDarkMode ? '#F59E0B' : '#FFFFFF'}
              />
            }
          />
          
          <SettingItem
            icon="color-palette-outline"
            label="Accent Color"
            value="Purple"
            gradient={['#FF512F', '#F09819']}
            onPress={() => {}}
          />
          
          <SettingItem
            icon="text-outline"
            label="Font Size"
            value="Medium"
            gradient={['#FF512F', '#F09819']}
            onPress={() => {}}
          />
        </View>

        {/* Notifications Section */}
        <View className={`mx-5 mt-5 rounded-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <SectionHeader title="NOTIFICATIONS" gradient={['#11998e', '#38ef7d']} />
          
          <SettingItem
            icon="notifications-outline"
            label="Push Notifications"
            gradient={['#11998e', '#38ef7d']}
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor={notifications ? '#059669' : '#FFFFFF'}
              />
            }
          />
          
          <SettingItem
            icon="mail-outline"
            label="Email Updates"
            value="Weekly"
            gradient={['#11998e', '#38ef7d']}
            onPress={() => {}}
          />
          
          <SettingItem
            icon="megaphone-outline"
            label="Promotions"
            value="Enabled"
            gradient={['#11998e', '#38ef7d']}
            onPress={() => {}}
          />
        </View>

        {/* Security Section */}
        <View className={`mx-5 mt-5 rounded-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <SectionHeader title="SECURITY" gradient={['#8E2DE2', '#4A00E0']} />
          
          <SettingItem
            icon="lock-closed-outline"
            label="Change Password"
            gradient={['#8E2DE2', '#4A00E0']}
            onPress={() => {}}
          />
          
          <SettingItem
            icon="finger-print-outline"
            label="Biometric Login"
            gradient={['#8E2DE2', '#4A00E0']}
            rightElement={
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                thumbColor={biometric ? '#6D28D9' : '#FFFFFF'}
              />
            }
          />
          
          <SettingItem
            icon="time-outline"
            label="Auto-lock"
            value="5 minutes"
            gradient={['#8E2DE2', '#4A00E0']}
            onPress={() => {}}
          />
        </View>

        {/* Data & Storage Section */}
        <View className={`mx-5 mt-5 rounded-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <SectionHeader title="DATA & STORAGE" gradient={['#FF416C', '#FF4B2B']} />
          
          <SettingItem
            icon="cloud-upload-outline"
            label="Backup Data"
            gradient={['#FF416C', '#FF4B2B']}
            onPress={() => {}}
          />
          
          <SettingItem
            icon="sync-outline"
            label="Auto-sync"
            value="Daily"
            gradient={['#FF416C', '#FF4B2B']}
            onPress={() => {}}
          />
          
          <SettingItem
            icon="trash-outline"
            label="Clear Cache"
            value="124 MB"
            gradient={['#FF416C', '#FF4B2B']}
            onPress={handleClearCache}
          />
        </View>

        {/* About Section */}
        <View className={`mx-5 mt-5 rounded-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <SectionHeader title="ABOUT" gradient={['#FFB75E', '#ED8F03']} />
          
          <SettingItem
            icon="information-circle-outline"
            label="Version"
            value="1.0.0 (Build 54)"
            gradient={['#FFB75E', '#ED8F03']}
          />
          
          <SettingItem
            icon="download-outline"
            label="Check for Updates"
            gradient={['#FFB75E', '#ED8F03']}
            onPress={handleCheckForUpdates}
          />
          
          <SettingItem
            icon="document-text-outline"
            label="Terms of Service"
            gradient={['#FFB75E', '#ED8F03']}
            onPress={() => {}}
          />
          
          <SettingItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            gradient={['#FFB75E', '#ED8F03']}
            onPress={() => {}}
          />
        </View>

        {/* Support Section */}
        <View className={`mx-5 mt-5 rounded-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <SectionHeader title="SUPPORT" gradient={['#00B4DB', '#0083B0']} />
          
          <SettingItem
            icon="help-circle-outline"
            label="Help Center"
            gradient={['#00B4DB', '#0083B0']}
            onPress={() => {}}
          />
          
          <SettingItem
            icon="chatbubble-outline"
            label="Contact Support"
            gradient={['#00B4DB', '#0083B0']}
            onPress={() => {}}
          />
          
          <SettingItem
            icon="star-outline"
            label="Rate App"
            gradient={['#00B4DB', '#0083B0']}
            onPress={() => {}}
          />
          
          <SettingItem
            icon="share-outline"
            label="Share App"
            gradient={['#00B4DB', '#0083B0']}
            onPress={() => {}}
          />
        </View>

        {/* Danger Zone */}
        <View className={`mx-5 mt-5 mb-5 rounded-2xl overflow-hidden border ${
          isDarkMode 
            ? 'bg-gray-800 border-red-900' 
            : 'bg-white border-red-200'
        }`}>
          <SectionHeader title="DANGER ZONE" gradient={['#FF416C', '#FF4B2B']} />
          
          <SettingItem
            icon="log-out-outline"
            label="Logout"
            type="danger"
            gradient={['#FF416C', '#FF4B2B']}
            onPress={handleLogout}
          />
          
          <SettingItem
            icon="trash-outline"
            label="Delete Account"
            type="danger"
            gradient={['#FF416C', '#FF4B2B']}
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;