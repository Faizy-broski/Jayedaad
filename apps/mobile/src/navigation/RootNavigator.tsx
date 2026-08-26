import { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthViewModel } from '@jayedaad/core';
import { BackButton } from '@jayedaad/ui-native';
import { BottomTabNavigator } from './BottomTabNavigator';
import { AboutUsScreen } from '../screens/AboutUsScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { AgentCRMScreen } from '../screens/AgentCRMScreen';
import { LeadDetailScreen } from '../screens/LeadDetailScreen';
import { PipelineScreen } from '../screens/PipelineScreen';
import { OpportunityDetailScreen } from '../screens/OpportunityDetailScreen';
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
import { AgencySettingsScreen } from '../screens/AgencySettingsScreen';
import { AgencyAnalyticsScreen } from '../screens/AgencyAnalyticsScreen';
import { HelpDeskScreen } from '../screens/HelpDeskScreen';
import { AgenciesScreen } from '../screens/AgenciesScreen';
import { AgencyDetailScreen } from '../screens/AgencyDetailScreen';
import { ApplyAsAgentScreen } from '../screens/auth/ApplyAsAgentScreen';
import { BecomeAnAgentScreen } from '../screens/auth/BecomeAnAgentScreen';
import { OwnerIdentityVerificationScreen } from '../screens/OwnerIdentityVerificationScreen';
import { ListingDocumentsScreen } from '../screens/ListingDocumentsScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { AllPropertiesScreen } from '../screens/AllPropertiesScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import type { AllPropertiesFilterState } from '../lib/allPropertiesFilters';
import { ProjectDetailScreen } from '../screens/ProjectDetailScreen';
import { BlogListScreen } from '../screens/BlogListScreen';
import { BlogDetailScreen } from '../screens/BlogDetailScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { AnimatedSplashScreen } from '../components/AnimatedSplashScreen';
import { ListingPerformanceScreen } from '../screens/ListingPerformanceScreen';
import { RevenueScreen } from '../screens/RevenueScreen';

export type RootStackParamList = {
  Main: undefined;
  // BuyerSearch/Favorites moved to BottomTabNavigator's BottomTabParamList —
  // they're tabs now, not pushed stack screens. AboutUs/Contact moved the
  // other way (out of the tab bar) but stay reachable via SideDrawer.
  AboutUs: undefined;
  Contact: undefined;
  // listingId pre-filters the inbox to one listing's inquiries — arrives via
  // ListingPerformanceScreen's "View all leads" action (mirrors apps/web's
  // /crm?listingId= query param).
  AgentCRM: { listingId?: string; listingTitle?: string } | undefined;
  LeadDetail: { leadId: string };
  // Kanban-equivalent pipeline (Phase 3 of the CRM maturity build-out) — a
  // stage-tab list instead of drag-and-drop, the realistic mobile
  // equivalent of a single-column phone viewport (see PipelineScreen.tsx).
  Pipeline: undefined;
  OpportunityDetail: { opportunityId: string };
  AgentDashboard: undefined;
  ListingPerformance: { listingId: string };
  Revenue: undefined;
  Terms: undefined;
  ProfileSettings: undefined;
  MyProperties: { initialTab?: 'drafts' | 'uploaded' } | undefined;
  PostListing: { editListingId?: string } | undefined;
  OwnerIdentityVerification: undefined;
  ListingDocuments: { listingId: string; submitOnComplete?: boolean };
  Calendar: undefined;
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
  AgencySettings: undefined;
  AgencyAnalytics: undefined;
  HelpDesk: undefined;
  Agencies: undefined;
  AgencyDetail: { agencySlug: string };
  // Buyer self-service application (packages/core's useAgentApplicationViewModel)
  // — a normal pushed screen, not part of AuthNavigator's login/signup sheet,
  // even though it shares BecomeAnAgent (same component, registered as a
  // second route here) for the document-upload step once applied.
  ApplyAsAgent: undefined;
  BecomeAnAgent: undefined;
  ListingDetail: { listingId: string };
  AllProperties: { initialFilters?: Partial<AllPropertiesFilterState> } | undefined;
  ProjectDetail: { projectSlug: string };
  PostProject: { editProjectId?: string; viewOnly?: boolean } | undefined;
  ProjectAmenities: {
    initialSelection: string[];
    onDone: (selection: string[]) => void;
  };
  BlogList: undefined;
  BlogDetail: { slug: string };
  Notifications: undefined;
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
    <Stack.Navigator
      initialRouteName="Main"
      // headerLeft here applies to every screen below that uses the
      // default native header (i.e. every one of them except "Main",
      // which hides its header entirely) — one shared BackButton
      // (theme.colors.surfaceAlt circle) instead of the OS-default plain
      // chevron, without having to set this per-screen ~30 times over.
      // canGoBack is false only for a stack's very first/root screen,
      // where React Navigation wouldn't have shown a back button either.
      screenOptions={({ navigation }) => ({
        headerLeft: ({ canGoBack }) => (canGoBack ? <BackButton onPress={() => navigation.goBack()} /> : null),
      })}
    >
      <Stack.Screen name="Main" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} options={{ title: 'About Us' }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact' }} />
      <Stack.Screen name="AgentCRM" component={AgentCRMScreen} options={{ title: 'Inquiry Inbox' }} />
      <Stack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: 'Lead' }} />
      <Stack.Screen name="Pipeline" component={PipelineScreen} options={{ title: 'Opportunities' }} />
      <Stack.Screen name="OpportunityDetail" component={OpportunityDetailScreen} options={{ title: 'Opportunity' }} />
      <Stack.Screen name="AgentDashboard" component={AgentDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="ListingPerformance" component={ListingPerformanceScreen} options={{ title: 'Performance' }} />
      <Stack.Screen name="Revenue" component={RevenueScreen} options={{ title: 'Revenue' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms and Conditions' }} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: 'Profile Settings' }} />
      <Stack.Screen name="MyProperties" component={MyPropertiesScreen} options={{ title: 'My Properties' }} />
      {/* headerShown: false — the screen already renders its own header
          (BackButton + centered title + step progress bar); the native
          header stacked a second title/back-button pair above it. */}
      <Stack.Screen name="PostListing" component={PostListingScreen} options={{ title: 'Post Listing', headerShown: false }} />
      <Stack.Screen name="Plan" component={PlanScreen} options={{ title: 'Plan' }} />
      <Stack.Screen name="AddFeatures" component={AddFeaturesScreen} options={{ title: 'Add Features' }} />
      <Stack.Screen name="MyProjects" component={MyProjectsScreen} options={{ title: 'My Projects' }} />
      <Stack.Screen name="AgencyStaff" component={AgencyStaffScreen} options={{ title: 'Agency Staff' }} />
      <Stack.Screen name="AgencySettings" component={AgencySettingsScreen} options={{ title: 'Agency Settings' }} />
      <Stack.Screen name="AgencyAnalytics" component={AgencyAnalyticsScreen} options={{ title: 'Agency Analytics' }} />
      <Stack.Screen name="HelpDesk" component={HelpDeskScreen} options={{ title: 'Help Desk' }} />
      <Stack.Screen name="Agencies" component={AgenciesScreen} options={{ title: 'Agencies' }} />
      <Stack.Screen name="AgencyDetail" component={AgencyDetailScreen} options={{ title: 'Agency' }} />
      <Stack.Screen name="ApplyAsAgent" component={ApplyAsAgentScreen} options={{ title: 'Become an Agent' }} />
      <Stack.Screen name="BecomeAnAgent" component={BecomeAnAgentScreen} options={{ title: 'Verification', headerBackVisible: false }} />
      <Stack.Screen
        name="OwnerIdentityVerification"
        component={OwnerIdentityVerificationScreen}
        options={{ title: 'Verify Identity' }}
      />
      <Stack.Screen name="ListingDocuments" component={ListingDocumentsScreen} options={{ title: 'Ownership Documents' }} />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
      {/* headerShown: false — the screen already renders its own back button
          overlaid on the gallery image; the native header's back chevron was
          just a duplicate stacked above it. */}
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Property Details', headerShown: false }} />
      <Stack.Screen name="AllProperties" component={AllPropertiesScreen} options={{ title: 'All Properties' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project Details', headerShown: false }} />
      <Stack.Screen name="PostProject" component={PostProjectScreen} options={{ title: 'Post Project' }} />
      <Stack.Screen name="ProjectAmenities" component={ProjectAmenitiesScreen} options={{ title: 'Add Amenities' }} />
      <Stack.Screen name="BlogList" component={BlogListScreen} options={{ title: 'Property Tips' }} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} options={{ title: 'Article' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

// Auth is no longer a root-level gate — the app is browsable while logged
// out. MainStack always renders once the initial session check settles;
// login/signup is only surfaced per-action via the AuthGateProvider sheet
// (see ../auth/AuthGateProvider.tsx), triggered from spots like the Profile
// tab and favoriting a listing.
//
// splashDismissed replaces the old fixed 900ms timer — that floor was
// meant to guarantee the splash's entrance animation was visible, but on a
// fast/warm auth check it also cut the 3-slide carousel off almost
// immediately, well before a user could read even the first slide. Now the
// splash decides its own exit: AnimatedSplashScreen calls onContinue
// either when the user taps Continue, or automatically once every slide
// has had its turn (see its AUTO_CONTINUE_MS). isInitializing is still
// ANDed in as a floor — the app can't render before the session check
// resolves, same as before, it just no longer double-gates on an arbitrary
// timer too.
export function RootNavigator() {
  const { isInitializing } = useAuthViewModel();
  const [splashDismissed, setSplashDismissed] = useState(false);

  if (isInitializing || !splashDismissed) {
    return <AnimatedSplashScreen onContinue={() => setSplashDismissed(true)} />;
  }

  return <MainStack />;
}
