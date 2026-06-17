// services/navigationService.js
import { createNavigationContainerRef, useNavigation as useNavigationHook } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn('Navigation not ready, cannot navigate to:', name);
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