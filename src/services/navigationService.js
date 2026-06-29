// services/navigationService.js
import { createNavigationContainerRef, useNavigation as useNavigationHook } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  console.log('🧭 navigate called:', name, params);
  try {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    } else {
      console.warn('Navigation not ready, cannot navigate to:', name);
    }
  } catch (error) {
    console.error('Navigation error in navigate function:', error);
  }
}

export function goBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  } else {
    console.warn('Navigation not ready, cannot go back');
  }
}

// Safe hook that won't throw an error
export function useSafeNavigation() {
  try {
    return useNavigationHook();
  } catch (error) {
    return null;
  }
}