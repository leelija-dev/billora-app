import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useBillForm } from "../../hooks/useBillForm";
import BillForm from "../../components/bills/BillForm";

const CreateBillScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { billId } = route.params || {};
  const { isDarkMode } = useThemeStore();

  return (
    <View className={`flex-1 pb-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header */}
        <View className={`px-4 py-3 flex-row items-center border-b ${
          isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Icon 
              name="arrow-left" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#1F2937'} 
            />
          </TouchableOpacity>
          <Text className={`text-xl font-semibold flex-1 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {billId ? "Edit Bill" : "Create New Bill"}
          </Text>
          {!billId && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Customers")}
              className="mr-2"
            >
              <Icon name="account-plus" size={24} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>

        <BillForm billId={billId} />
      </SafeAreaView>
    </View>
  );
};

export default CreateBillScreen;