// components/navigation/stacks/PlansStack.jsx - Plans Stack Navigator
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlansScreen from '../../../screens/plans/PlansScreen';

const Stack = createNativeStackNavigator();

const PlansStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PlansMain" component={PlansScreen} />
    </Stack.Navigator>
  );
};

export default PlansStackNavigator;
