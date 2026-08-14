import { ActivityIndicator, View, ViewStyle } from 'react-native';
import { theme } from './theme';

export interface SpinnerProps {
  // "sm": inline with text/small controls. "lg": a loading screen's sole
  // focal point. Omit for the existing default used by most list/section
  // loading states.
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
}

const SIZE_PX: Record<NonNullable<SpinnerProps['size']>, number> = { sm: 16, md: 24, lg: 32 };

// Every screen previously reached for a bare <ActivityIndicator
// color={theme.colors.primary} /> ad hoc — same brand color, but no shared
// component meant no shared sizing/consistency, and RefreshControl's
// platform-split tintColor/colors props (see refreshControlProps below)
// were never centralized either, so every pull-to-refresh call site would
// otherwise have had to repeat both.
export function Spinner({ size = 'md', color = theme.colors.primary, style }: SpinnerProps) {
  return (
    <View style={style}>
      <ActivityIndicator size={SIZE_PX[size]} color={color} />
    </View>
  );
}

// RN has no single cross-platform "tint color" prop for RefreshControl —
// iOS reads `tintColor`, Android reads `colors` (an array). Centralized here
// so every pull-to-refresh call site shares one brand-consistent look
// instead of repeating both props inline.
export function refreshControlProps(color: string = theme.colors.primary) {
  return { tintColor: color, colors: [color] };
}
