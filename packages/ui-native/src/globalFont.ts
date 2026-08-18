import { Text, TextInput } from 'react-native';

// Applies a font family as this app's default typeface everywhere, without
// touching every screen's individual Text/TextInput usage (this app has no
// shared themed <Text> wrapper — every screen renders react-native's own
// Text directly). Uses the standard React defaultProps-merge technique
// (same one the react-native-global-props package is built on) rather than
// patching Text's internal render method — that approach varies across RN
// versions (some expose a reassignable static `.render`, some don't) and
// risks silently doing nothing or crashing; defaultProps merging is a
// stable, documented mechanism.
//
// Must be called synchronously during render (not inside a useEffect) once
// the font is loaded, and before returning any JSX — defaultProps has to
// be set before the first Text/TextInput mounts, not after, or already-
// mounted instances won't pick up the change. See apps/mobile/App.tsx.
//
// Every screen's own fontWeight (700/800/etc, set via each screen's
// existing StyleSheet) still applies on top of this via RN's synthetic/
// faux-bold rendering — this only supplies the family, not a separate true
// bold/semibold font file per weight, keeping this one low-risk call
// instead of wiring a fontWeight->family lookup through every one of this
// app's ~40 screens.
export function applyGlobalFontFamily(fontFamily: string) {
  const AnyText = Text as unknown as { defaultProps?: Record<string, unknown> };
  AnyText.defaultProps = { ...AnyText.defaultProps, style: [{ fontFamily }, AnyText.defaultProps?.style] };

  const AnyTextInput = TextInput as unknown as { defaultProps?: Record<string, unknown> };
  AnyTextInput.defaultProps = { ...AnyTextInput.defaultProps, style: [{ fontFamily }, AnyTextInput.defaultProps?.style] };
}
