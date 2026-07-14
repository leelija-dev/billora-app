// components/navigation/stacks/GstStack.jsx - GST Stack Navigator
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GstScreen from '../../../screens/gst/GstScreen';

const Stack = createNativeStackNavigator();

const GstStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="GstMain" component={GstScreen} />
    </Stack.Navigator>
  );
};

export default GstStackNavigator;
