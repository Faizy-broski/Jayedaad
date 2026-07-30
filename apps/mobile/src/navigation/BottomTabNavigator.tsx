import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthViewModel } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import { HomeScreen } from '../screens/HomeScreen';
import { AboutUsScreen } from '../screens/AboutUsScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAuthGate } from '../auth/AuthGateProvider';

export type BottomTabParamList = {
  Home: undefined;
  AboutUs: undefined;
  Contact: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<keyof BottomTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  AboutUs: 'information-circle',
  Contact: 'call',
  Profile: 'person',
};

// lazy: true (v6 default, kept explicit) — non-active tabs don't mount until
// first visited, so app startup only pays for the Home screen.
export function BottomTabNavigator() {
  const { isAuthenticated, isEmailVerified, isEmailVerifiedLoading } = useAuthViewModel();
  const { requireAuth } = useAuthGate();
  const isSatisfied = isAuthenticated && !isEmailVerifiedLoading && isEmailVerified;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        lazy: true,
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { height: 78, paddingBottom: 16, paddingTop: 10 },
        tabBarIcon: ({ color, size, focused }) => (
          <View style={styles.iconWrap}>
            <Ionicons name={focused ? TAB_ICONS[route.name] : (`${TAB_ICONS[route.name]}-outline` as keyof typeof Ionicons.glyphMap)} color={color} size={size} />
            {focused && <View style={styles.activeDot} />}
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AboutUs" component={AboutUsScreen} options={{ title: 'About Us' }} />
      <Tab.Screen name="Contact" component={ContactScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        listeners={{
          tabPress: (e) => {
            if (!isSatisfied) {
              e.preventDefault();
              requireAuth();
            }
          },
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', gap: 4 },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.primary },
});
