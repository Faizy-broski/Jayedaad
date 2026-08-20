import { useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, PanResponder, Platform, Pressable, View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@jayedaad/ui-native';
import { AuthNavigator } from '../navigation/AuthNavigator';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

// Full-screen login/signup presentation — the auth screens (LoginScreen etc.)
// are laid out for a full page (brand mark, spaced-out fields, footer link),
// so a partial half-sheet was clipping content instead of giving it room.
// Slides up from the bottom over the app (MainStack, already mounted behind
// this overlay) rather than replacing it, so closing is instant with nothing
// to re-mount.
//
// Deliberately a plain absolutely-positioned overlay, NOT React Native's
// `Modal` — RN's Modal presents in its own separate native window on iOS,
// and React Navigation's native-stack (react-native-screens) rendered inside
// it ends up visually present but not receiving touches (confirmed: this is
// exactly what "half sheet shows, Log In does nothing, footer text missing"
// was). Staying in the same native view hierarchy as the rest of the app
// avoids that entirely.
export function AuthSheet({
  visible,
  onClose,
  initialRouteName,
}: {
  visible: boolean;
  onClose: () => void;
  // Which screen the sheet should open on — the gate can be blocked for
  // reasons other than "not logged in" (e.g. already signed in but email
  // not verified yet), and always defaulting to Login there would ask an
  // already-authenticated user to log in again instead of just finishing
  // verification. See AuthGateProvider's gateReason.
  initialRouteName?: keyof AuthStackParamList;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [visible, translateY, backdropOpacity]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  // Swipe-to-dismiss — the sheet is full-height (see the comment on
  // `sheet` below), so once it's open there's no backdrop left exposed to
  // tap-to-close, and there was no gesture at all otherwise, just the X
  // button. Attached only to the drag handle row below (a sibling of the
  // ScrollView-based auth screens, not wrapping them) so dragging never
  // fights the form's own scroll gesture. Plain core-RN PanResponder, not
  // react-native-gesture-handler — this app doesn't depend on that
  // library elsewhere and the existing entrance/exit animation here
  // already uses the plain Animated API, so this stays consistent with it.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        // Dragged more than a third of the way, or flicked down fast —
        // either way finish the dismiss instead of snapping back.
        if (gesture.dy > 140 || gesture.vy > 0.8) {
          handleClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Covers the whole non-interactive header band (brand logo/title/
            subtitle — see AuthBrandHeader), not just the thin pill, so a
            swipe started anywhere up there closes the sheet, not only a
            pixel-precise grab on the handle bar itself. Stops well above
            the first input field so it never eats a tap meant for the
            form below. zIndex keeps it above the ScrollView content it
            visually overlaps despite coming first in JSX (paint order),
            so it actually receives the touch instead of the header
            painting over it and swallowing the gesture. */}
        <View style={[styles.dragHandleZone, { top: insets.top }]} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <SafeAreaView style={styles.flex} edges={['top']}>
            <View style={styles.navigatorWrap}>
              {/* Independent container: the outer NavigationContainer already
                  registers MainStack's navigator, and React Navigation only
                  allows one navigator directly under a given container.
                  AuthNavigator's screens only ever navigate among themselves,
                  so a fully separate navigation tree here is safe. */}
              <NavigationContainer independent>
                <AuthNavigator initialRouteName={initialRouteName} />
              </NavigationContainer>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
        {/* Positioned off insets.top directly (not left to SafeAreaView's
            padding + position:absolute interaction) so it sits a consistent
            distance below the status bar/notch on every device, instead of
            crowding right up against it. */}
        <Pressable
          style={[styles.closeButton, { top: insets.top + theme.spacing.sm }]}
          onPress={handleClose}
          hitSlop={12}
        >
          <Ionicons name="close" size={20} color={theme.colors.text} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 50, elevation: 50 },
  flex: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    height: '100%',
    backgroundColor: theme.colors.bg,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing.lg,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
    // A flat icon on a busy/photo background (see LoginScreen's bgImage)
    // was nearly invisible — a solid rounded pill with its own shadow
    // reads as an actual button regardless of what's behind it.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  dragHandleZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Tall enough to cover the brand logo/title/subtitle block above the
    // form fields (roughly xxl padding + logo + title + subtitle, see
    // LoginScreen/SignupScreen), short enough to stop before the first
    // input so typing/tapping there is never intercepted.
    height: 140,
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    zIndex: 1,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  navigatorWrap: { flex: 1 },
});
