import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthViewModel } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ProjectsScreen } from '../screens/ProjectsScreen';
import { BuyerSearchScreen } from '../screens/BuyerSearchScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAuthGate } from '../auth/AuthGateContext';
import type { SearchFilterState } from '../lib/searchFilters';

// About Us/Contact moved to RootNavigator's MainStack (still reachable via
// SideDrawer) — Search/Favorites moved IN from there, now tabs instead of
// pushed stack screens. Route names (BuyerSearch, Favorites) are unchanged
// so SideDrawer's existing go('BuyerSearch')/go('Favorites', {...}) calls
// keep resolving via React Navigation's automatic nested-screen lookup.
export type BottomTabParamList = {
  Home: undefined;
  Projects: undefined;
  BuyerSearch: { initialFilters?: Partial<SearchFilterState> } | undefined;
  Favorites: { initialTab?: 'favorites' | 'saved' } | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<keyof BottomTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Projects: 'business',
  BuyerSearch: 'search',
  Favorites: 'heart',
  Profile: 'person',
};

const TAB_LABELS: Record<keyof BottomTabParamList, string> = {
  Home: 'Home',
  Projects: 'Projects',
  BuyerSearch: 'Search',
  Favorites: 'Favorites',
  Profile: 'Profile',
};

// lazy: true (v6 default, kept explicit) — non-active tabs don't mount until
// first visited, so app startup only pays for the Home screen.
export function BottomTabNavigator() {
  const { isAuthenticated, isEmailVerified, isEmailVerifiedLoading } = useAuthViewModel();
  const { requireAuth } = useAuthGate();
  const isSatisfied = isAuthenticated && !isEmailVerifiedLoading && isEmailVerified;

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ lazy: true, headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Projects" component={ProjectsScreen} />
      <Tab.Screen name="BuyerSearch" component={BuyerSearchScreen} />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        listeners={{
          tabPress: (e) => {
            if (!isSatisfied) {
              e.preventDefault();
              requireAuth();
            }
          },
        }}
      />
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

// Floating white pill bar. Every tab is icon-above-label, evenly spaced
// (flex: 1 each); the active tab just switches to the solid icon + green
// color + bold label — no background highlight box, no pill morph. The
// color/weight swap fades in via RN's Animated API (native-driven, same
// hand-rolled approach as AnimatedSplashScreen/SideDrawer/AuthSheet
// elsewhere in this app) instead of snapping instantly.
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const name = route.name as keyof BottomTabParamList;

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <TabButton
              key={route.key}
              focused={focused}
              icon={TAB_ICONS[name]}
              label={(options.title as string | undefined) ?? TAB_LABELS[name]}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

// Active tab "pops" outward: its icon badge lifts up and overscales past
// 1.0 via a bouncy spring (not a linear timing), landing on a solid green
// circle raised above the bar line — like a raised pin rather than a flat
// color swap. Icon itself still cross-fades outline-muted → solid-white
// (two stacked layers, opacity-only) since Animated can't interpolate
// Ionicons' color prop directly without wrapping it in
// Animated.createAnimatedComponent.
function TabButton({
  focused,
  icon,
  label,
  onPress,
}: {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [focused, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Pressable onPress={onPress} style={styles.tabTouchable} hitSlop={6}>
      {/* shadowOpacity isn't in the native-driver-supported style whitelist
          (opacity/transform only) — since `progress` also drives the
          spring's translateY/scale with useNativeDriver:true, a static
          shadow (rather than animating it off `progress`) avoids a native
          animated module runtime error. */}
      <Animated.View style={[styles.iconBadge, { transform: [{ translateY }, { scale }] }]}>
        <Animated.View style={[styles.iconBadgeFill, { opacity: progress }]} />
        <View style={styles.iconLayer}>
          <Ionicons name={`${icon}-outline` as keyof typeof Ionicons.glyphMap} size={20} color={theme.colors.muted} />
        </View>
        <Animated.View style={[styles.iconLayer, StyleSheet.absoluteFill, { opacity: progress }]}>
          <Ionicons name={icon} size={20} color="#ffffff" />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.bg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    borderRadius: 999,
    paddingVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  tabTouchable: { flex: 1, alignItems: 'center', gap: 4 },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.primary,
    borderRadius: 19,
  },
  iconLayer: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '600' },
  tabLabelActive: { color: theme.colors.primary, fontWeight: '700' },
});
