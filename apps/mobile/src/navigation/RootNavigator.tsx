import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthViewModel } from '@jayedaad/core';
import { BottomTabNavigator } from './BottomTabNavigator';
import { BuyerSearchScreen } from '../screens/BuyerSearchScreen';
import { AgentCRMScreen } from '../screens/AgentCRMScreen';
import { AgentDashboardScreen } from '../screens/AgentDashboardScreen';
import { TermsScreen } from '../screens/auth/TermsScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { MyPropertiesScreen } from '../screens/MyPropertiesScreen';
import { PostListingScreen } from '../screens/PostListingScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { AddFeaturesScreen, AmenitySelectionMap } from '../screens/AddFeaturesScreen';
import { AnimatedSplashScreen } from '../components/AnimatedSplashScreen';

// Enforced floor so the splash's entrance animation is actually seen even on
// a warm/instant auth check, rather than flashing for a few ms.
const MINIMUM_SPLASH_MS = 900;

export type RootStackParamList = {
  Main: undefined;
  BuyerSearch: undefined;
  AgentCRM: undefined;
  AgentDashboard: undefined;
  Terms: undefined;
  ProfileSettings: undefined;
  Favorites: { initialTab?: 'favorites' | 'saved' } | undefined;
  MyProperties: { initialTab?: 'drafts' | 'uploaded' } | undefined;
  PostListing: { editListingId?: string } | undefined;
  Plan: undefined;
  // initialSelection/onDone passed as plain JS values via navigation params —
  // standard RN pattern (in-memory navigation, not URL-based deep linking),
  // same approach used by PickerField-style flows elsewhere in this app.
  AddFeatures: {
    categorySlug: string;
    initialSelection: AmenitySelectionMap;
    onDone: (selection: AmenitySelectionMap) => void;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Main = bottom-tab shell (Home/About/Contact). BuyerSearch and AgentCRM stay
// as pushed stack screens — they mirror apps/web's (buyer)/search and
// (agent)/crm route groups, both consuming the same packages/core
// viewmodels, which is what proves the Clean Architecture code-sharing claim.
function MainStack() {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen name="Main" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="BuyerSearch" component={BuyerSearchScreen} options={{ title: 'Search Properties' }} />
      <Stack.Screen name="AgentCRM" component={AgentCRMScreen} options={{ title: 'Inquiry Inbox' }} />
      <Stack.Screen name="AgentDashboard" component={AgentDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms and Conditions' }} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: 'Profile Settings' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites & Saved' }} />
      <Stack.Screen name="MyProperties" component={MyPropertiesScreen} options={{ title: 'My Properties' }} />
      <Stack.Screen name="PostListing" component={PostListingScreen} options={{ title: 'Post Listing' }} />
      <Stack.Screen name="Plan" component={PlanScreen} options={{ title: 'Plan' }} />
      <Stack.Screen name="AddFeatures" component={AddFeaturesScreen} options={{ title: 'Add Features' }} />
    </Stack.Navigator>
  );
}

// Auth is no longer a root-level gate — the app is browsable while logged
// out. MainStack always renders once the initial session check settles;
// login/signup is only surfaced per-action via the AuthGateProvider sheet
// (see ../auth/AuthGateProvider.tsx), triggered from spots like the Profile
// tab and favoriting a listing.
export function RootNavigator() {
  const { isInitializing } = useAuthViewModel();
  const [minimumElapsed, setMinimumElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinimumElapsed(true), MINIMUM_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  if (isInitializing || !minimumElapsed) {
    return <AnimatedSplashScreen />;
  }

  return <MainStack />;
}
