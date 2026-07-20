// components/navigation/stacks/SocialLinkStack.jsx - Social Link Stack Navigator
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SocialLinkScreen from '../../../screens/social-link/SocialLinkScreen';

const Stack = createNativeStackNavigator();

const SocialLinkStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SocialLinkMain" component={SocialLinkScreen} />
    </Stack.Navigator>
  );
};

export default SocialLinkStackNavigator;
