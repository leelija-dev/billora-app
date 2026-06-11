export default function LanguageSettingsScreen() {
  const { isDarkMode } = useThemeStore();
  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
      <Text className={isDarkMode ? "text-white" : "text-gray-800"}>Language Settings</Text>
    </SafeAreaView>
  );
}