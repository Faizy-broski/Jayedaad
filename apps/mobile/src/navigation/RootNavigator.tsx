import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthViewModel } from '@jayedaad/core';
import { BottomTabNavigator } from './BottomTabNavigator';
import { AboutUsScreen } from '../screens/AboutUsScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { AgentCRMScreen } from '../screens/AgentCRMScreen';
import { AgentDashboardScreen } from '../screens/AgentDashboardScreen';
import { TermsScreen } from '../screens/auth/TermsScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { MyPropertiesScreen } from '../screens/MyPropertiesScreen';
import { PostListingScreen } from '../screens/PostListingScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { AddFeaturesScreen, AmenitySelectionMap } from '../screens/AddFeaturesScreen';
import { MyProjectsScreen } from '../screens/MyProjectsScreen';
import { PostProjectScreen } from '../screens/PostProjectScreen';
import { ProjectAmenitiesScreen } from '../screens/ProjectAmenitiesScreen';
import { AgencyStaffScreen } from '../screens/AgencyStaffScreen';
import { AllPropertiesScreen } from '../screens/AllPropertiesScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { ProjectDetailScreen } from '../screens/ProjectDetailScreen';
import { AnimatedSplashScreen } from '../components/AnimatedSplashScreen';

// Enforced floor so the splash's entrance animation is actually seen even on
// a warm/instant auth check, rather than flashing for a few ms.
const MINIMUM_SPLASH_MS = 900;

export type RootStackParamList = {
  Main: undefined;
  // BuyerSearch/Favorites moved to BottomTabNavigator's BottomTabParamList —
  // they're tabs now, not pushed stack screens. AboutUs/Contact moved the
  // other way (out of the tab bar) but stay reachable via SideDrawer.
  AboutUs: undefined;
  Contact: undefined;
  AgentCRM: undefined;
  AgentDashboard: undefined;
  Terms: undefined;
  ProfileSettings: undefined;
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
  MyProjects: undefined;
  AgencyStaff: undefined;
  ListingDetail: { listingId: string };
  AllProperties: undefined;
  ProjectDetail: { projectSlug: string };
  PostProject: { editProjectId?: string; viewOnly?: boolean } | undefined;
  ProjectAmenities: {
    initialSelection: string[];
    onDone: (selection: string[]) => void;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Main = bottom-tab shell (Home/Projects/Search/Favorites/Profile). AgentCRM
// stays a pushed stack screen — it mirrors apps/web's (agent)/crm route
// group, consuming the same packages/core viewmodels, which is what proves
// the Clean Architecture code-sharing claim. AboutUs/Contact are pushed
// stack screens too now (dropped from the tab bar), reachable via
// SideDrawer's "About Us"/"Contact Us" rows.
function MainStack() {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen name="Main" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} options={{ title: 'About Us' }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact' }} />
      <Stack.Screen name="AgentCRM" component={AgentCRMScreen} options={{ title: 'Inquiry Inbox' }} />
      <Stack.Screen name="AgentDashboard" component={AgentDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms and Conditions' }} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: 'Profile Settings' }} />
      <Stack.Screen name="MyProperties" component={MyPropertiesScreen} options={{ title: 'My Properties' }} />
      <Stack.Screen name="PostListing" component={PostListingScreen} options={{ title: 'Post Listing' }} />
      <Stack.Screen name="Plan" component={PlanScreen} options={{ title: 'Plan' }} />
      <Stack.Screen name="AddFeatures" component={AddFeaturesScreen} options={{ title: 'Add Features' }} />
      <Stack.Screen name="MyProjects" component={MyProjectsScreen} options={{ title: 'My Projects' }} />
      <Stack.Screen name="AgencyStaff" component={AgencyStaffScreen} options={{ title: 'Agency Staff' }} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Property Details' }} />
      <Stack.Screen name="AllProperties" component={AllPropertiesScreen} options={{ title: 'All Properties' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project Details' }} />
      <Stack.Screen name="PostProject" component={PostProjectScreen} options={{ title: 'Post Project' }} />
      <Stack.Screen name="ProjectAmenities" component={ProjectAmenitiesScreen} options={{ title: 'Add Amenities' }} />
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
