import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

export interface AccordionProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// Expandable/collapsible section — matches the "Add Features" reference
// (category rows collapsed by default, chevron flips, tap to expand). Each
// instance manages its own open state independently, so any subset of
// sections can be open at once.
export function Accordion({ icon, label, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setOpen((v) => !v)}>
        <View style={styles.headerLeft}>
          {icon && <Ionicons name={icon} size={18} color={theme.colors.muted} style={styles.headerIcon} />}
          <Text style={styles.headerLabel}>{label}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.muted} />
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  headerIcon: { width: 20 },
  headerLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  body: { paddingBottom: theme.spacing.lg, gap: theme.spacing.lg },
});
