export default function PrivacyPolicyScreen() {
  const { isDarkMode } = useThemeStore();
  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} p-4`}>
      <ScrollView>
        <Text className={`text-lg font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Privacy Policy</Text>
        <Text className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
          Your privacy policy content here...
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}