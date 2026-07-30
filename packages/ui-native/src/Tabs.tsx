import { Pressable, Text, View, StyleSheet } from 'react-native';
import { theme } from './theme';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

// RN counterpart to @jayedaad/ui-web's Tabs — reuses the underline-tab
// visual language HomeScreen.tsx already established for its Homes/Plots/
// Commercial switcher (kindTabRow/kindTabUnderline), rather than a new style.
export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <View style={styles.row}>
      {tabs.map((tab) => (
        <Pressable key={tab.id} onPress={() => onChange(tab.id)} style={styles.tab}>
          <Text style={[styles.label, tab.id === activeId && styles.labelActive]}>{tab.label}</Text>
          {tab.id === activeId && <View style={styles.underline} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    paddingBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  labelActive: {
    color: theme.colors.primary,
  },
  underline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary,
  },
});
