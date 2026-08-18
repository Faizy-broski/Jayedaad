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

// Floating white pill bar, Zameen-reference look: the active tab becomes
// its own solid rounded-rect badge (icon + label stacked together, both
// white, on theme.colors.primary) sitting inline in the bar; every inactive
// tab is just a plain outline icon + muted label column, no background.
// Previously the active tab "popped" above the bar line as a small raised
// circle badge with its label left outside/below in the bar's own plain
// gray — replaced with this single unified badge per the reference design.
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

// Active tab lands as a solid rounded-rect badge (icon + label together,
// both white) via a quick bouncy scale-in spring — inactive tabs are static
// (no animation needed, there's nothing to morph: they're a bare
// icon-outline + label column, not a badge that grows/shrinks).
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
  const scale = useRef(new Animated.Value(focused ? 1 : 0.85)).current;

  useEffect(() => {
    if (!focused) return;
    scale.setValue(0.85);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 120 }).start();
  }, [focused, scale]);

  return (
    <Pressable onPress={onPress} style={styles.tabTouchable} hitSlop={6}>
      {focused ? (
        // w67/h53 per the reference design — a wide rounded-rect (not a
        // circle), roomy enough to stack the icon above its label inside
        // one solid badge instead of the label sitting outside/below it.
        <Animated.View style={[styles.activeBadge, { transform: [{ scale }] }]}>
          <Ionicons name={icon} size={20} color="#ffffff" />
          <Text style={styles.activeLabel} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      ) : (
        <View style={styles.inactiveItem}>
          <Ionicons name={`${icon}-outline` as keyof typeof Ionicons.glyphMap} size={22} color={theme.colors.muted} />
          <Text style={styles.inactiveLabel} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
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
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  tabTouchable: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Figma frame: W 67 / H 53 / corner radius 111.64 — a true stadium/pill
  // (radius well past half the height), not the rounded-rect this
  // previously used. RN clamps borderRadius to min(width,height)/2 anyway,
  // so 999 renders pixel-identical to the literal 111.64 value while
  // matching this app's existing "always full pill" convention (Button,
  // filter chips, etc. all use 999 rather than a computed half-height).
  activeBadge: {
    width: 67,
    height: 53,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeLabel: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  inactiveItem: { alignItems: 'center', justifyContent: 'center', gap: 4, height: 53 },
  inactiveLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '600' },
});
