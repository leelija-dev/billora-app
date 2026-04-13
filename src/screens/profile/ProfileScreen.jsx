// screens/profile/ProfileScreen.js
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { 
  ScrollView, 
  Text, 
  View, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { useThemeStore } from '../../store/themeStore';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const { showSuccess, showError } = useUIStore();
  const { isDarkMode } = useThemeStore();
  const [editing, setEditing] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      bio: user?.bio || '',
      location: user?.location || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await updateProfile(data);
      setEditing(false);
      showSuccess('Profile updated successfully');
    } catch (error) {
      showError(error.message || 'Failed to update profile');
    }
  };

  const handleEdit = () => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      bio: user?.bio || '',
      location: user?.location || '',
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    reset({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      bio: user?.bio || '',
      location: user?.location || '',
    });
  };

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header title="Profile" showBackButton />
        <Loading text="Loading profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['left', 'right']} style={{paddingBottom:60}}>
      <Header
        title="Profile"
        showBackButton
        rightComponent={
          !editing && (
            <TouchableOpacity
              onPress={handleEdit}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}
            >
              <Icon name="pencil" size={20} color="#667eea" />
            </TouchableOpacity>
          )
        }
      />
      
      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card with Gradient */}
        <View className={`mt-4 p-5 rounded-3xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <View className="flex-row items-center">
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-20 h-20 rounded-2xl items-center justify-center"
              style={{ borderRadius: 40 }}
            >
              <Text className="text-white text-3xl font-bold">
                {getInitials()}
              </Text>
            </LinearGradient>
            
            <View className="flex-1 ml-4">
              <Text className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {user?.name || 'User Name'}
              </Text>
              <Text className={`text-sm mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {user?.email || 'user@example.com'}
              </Text>
              
              <View className="flex-row mt-2">
                {user?.location && (
                  <View className="flex-row items-center mr-4">
                    <Icon name="map-marker" size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                    <Text className={`text-xs ml-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {user.location}
                    </Text>
                  </View>
                )}
                {user?.company && (
                  <View className="flex-row items-center">
                    <Icon name="office-building" size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                    <Text className={`text-xs ml-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {user.company}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View className={`flex-row justify-around mt-5 pt-4 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <View className="items-center">
              <Text className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>128</Text>
              <Text className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Orders</Text>
            </View>
            <View className={`w-px h-8 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`} />
            <View className="items-center">
              <Text className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>$4.5k</Text>
              <Text className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Spent</Text>
            </View>
            <View className={`w-px h-8 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`} />
            <View className="items-center">
              <Text className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>3</Text>
              <Text className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Years</Text>
            </View>
          </View>
        </View>

        {/* Bio Section (if available) */}
        {user?.bio && !editing && (
          <View className={`mt-4 p-5 rounded-3xl border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <View className="flex-row items-center mb-3">
              <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}>
                <Icon name="account-details" size={18} color="#667eea" />
              </View>
              <Text className={`text-base font-semibold ml-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>About</Text>
            </View>
            <Text className={`leading-5 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {user.bio}
            </Text>
          </View>
        )}

        {/* Main Content Card */}
        <View className={`mt-4 p-5 rounded-3xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <View className="flex-row items-center mb-4">
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${
              isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <Icon name="card-account-details" size={18} color="#667eea" />
            </View>
            <Text className={`text-base font-semibold ml-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {editing ? 'Edit Profile' : 'Profile Information'}
            </Text>
          </View>

          {editing ? (
            <View>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'Name is required',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Enter your full name"
                    error={errors.name?.message}
                    leftIcon="account-outline"
                    isDarkMode={isDarkMode}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email Address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email?.message}
                    leftIcon="email-outline"
                    isDarkMode={isDarkMode}
                  />
                )}
              />

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Phone Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    error={errors.phone?.message}
                    leftIcon="phone-outline"
                    isDarkMode={isDarkMode}
                  />
                )}
              />

              <Controller
                control={control}
                name="company"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Company"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Enter your company"
                    error={errors.company?.message}
                    leftIcon="office-building"
                    isDarkMode={isDarkMode}
                  />
                )}
              />

              <Controller
                control={control}
                name="location"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Location"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Enter your location"
                    error={errors.location?.message}
                    leftIcon="map-marker"
                    isDarkMode={isDarkMode}
                  />
                )}
              />

              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Bio"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Tell us about yourself"
                    multiline
                    numberOfLines={4}
                    error={errors.bio?.message}
                    leftIcon="text"
                    isDarkMode={isDarkMode}
                    inputClassName="h-24"
                  />
                )}
              />

              <View className="flex-row gap-3 mt-5">
                <Button
                  title="Cancel"
                  onPress={handleCancel}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save Changes"
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  disabled={!isValid || isLoading}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View>
              <View className={`flex-row justify-between items-center py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <View className="flex-row items-center">
                  <Icon name="account-outline" size={18} color="#667eea" />
                  <Text className={`text-sm ml-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Name</Text>
                </View>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{user?.name || 'N/A'}</Text>
              </View>

              <View className={`flex-row justify-between items-center py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <View className="flex-row items-center">
                  <Icon name="email-outline" size={18} color="#667eea" />
                  <Text className={`text-sm ml-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Email</Text>
                </View>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{user?.email || 'N/A'}</Text>
              </View>

              <View className={`flex-row justify-between items-center py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <View className="flex-row items-center">
                  <Icon name="phone-outline" size={18} color="#667eea" />
                  <Text className={`text-sm ml-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Phone</Text>
                </View>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{user?.phone || 'N/A'}</Text>
              </View>

              <View className={`flex-row justify-between items-center py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <View className="flex-row items-center">
                  <Icon name="office-building" size={18} color="#667eea" />
                  <Text className={`text-sm ml-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Company</Text>
                </View>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{user?.company || 'N/A'}</Text>
              </View>

              <View className={`flex-row justify-between items-center py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <View className="flex-row items-center">
                  <Icon name="map-marker" size={18} color="#667eea" />
                  <Text className={`text-sm ml-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Location</Text>
                </View>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{user?.location || 'N/A'}</Text>
              </View>

              <View className={`flex-row justify-between items-center py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <View className="flex-row items-center">
                  <Icon name="shield-account" size={18} color="#667eea" />
                  <Text className={`text-sm ml-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Role</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${
                  isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Text className={`text-xs font-medium ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>{user?.role || 'User'}</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center py-4">
                <View className="flex-row items-center">
                  <Icon name="calendar-clock" size={18} color="#667eea" />
                  <Text className={`text-sm ml-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Member Since</Text>
                </View>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  }) : 'N/A'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Security Section */}
        {!editing && (
          <View className={`mt-4 p-5 rounded-3xl border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <View className="flex-row items-center mb-4">
              <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}>
                <Icon name="shield-lock" size={18} color="#667eea" />
              </View>
              <Text className={`text-base font-semibold ml-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Security</Text>
            </View>

            <TouchableOpacity className={`flex-row items-center justify-between py-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <View className="flex-row items-center">
                <Icon name="lock-outline" size={20} color="#667eea" />
                <View className="ml-3">
                  <Text className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Change Password</Text>
                  <Text className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Update your password regularly</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center">
                <Icon name="two-factor-authentication" size={20} color="#667eea" />
                <View className="ml-3">
                  <Text className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Two-Factor Authentication</Text>
                  <Text className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Add extra security to your account</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;