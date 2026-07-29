import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from './theme';

// RN counterpart to @jayedaad/ui-web's Card/CardContent — elevated surface
// matching the shadow values HomeScreen.tsx already established for its
// sectionCard blocks (the only precedent for elevated surfaces in this app).
export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

export function CardContent({ style, ...props }: ViewProps) {
  return <View style={[styles.content, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  content: {
    padding: theme.spacing.lg,
  },
});
