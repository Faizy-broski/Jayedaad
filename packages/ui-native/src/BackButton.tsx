import { Pressable, PressableProps, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

export interface BackButtonProps extends Omit<PressableProps, 'style'> {
  size?: number;
}

// The one back-button treatment for this app — circular, theme.colors.
// surfaceAlt (#F3F4F6) fill, chevron icon, soft shadow. Wired as the
// default `headerLeft` for every native-stack screen in RootNavigator (see
// its screenOptions), so every screen using the standard header gets this
// automatically; screens that roll their own custom header (a few detail
// screens with a photo backdrop, previously each hand-rolling a slightly
// different back-button style/size/color) should render this directly
// instead of their own copy.
export function BackButton({ size = 40, ...props }: BackButtonProps) {
  return (
    <Pressable
      hitSlop={8}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
      {...props}
    >
      <Ionicons name="chevron-back" size={Math.round(size * 0.5)} color={theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
