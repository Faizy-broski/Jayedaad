import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgentCreditType } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';

// Consolidates the Hot/Super Hot/Refresh/Story credit-spend actions into
// one bottom sheet — with each as its own row button, a listing/project's
// action row routinely wrapped/overflowed with 4 extra buttons. Fully
// generic (no listing/project-specific logic) so both MyPropertiesScreen
// and MyProjectsScreen share this one implementation — they spend from
// the SAME agent_credits pool, so duplicating this component would just
// be two copies of the same Modal/bottom-sheet markup to keep in sync
// forever. A plain RN Modal (unlike a position:absolute dropdown) is
// unaffected by whatever scroll/layout container renders the trigger — it
// always renders above everything, no special positioning needed.
export function BoostMenu({
  creditsAvailable,
  isPending,
  onHot,
  onSuperHot,
  onRefresh,
  onStory,
  onBuyMore,
}: {
  creditsAvailable: (type: AgentCreditType) => number;
  isPending: boolean;
  onHot: () => void;
  onSuperHot: () => void;
  onRefresh: () => void;
  onStory: () => void;
  // Caller-provided navigation to the Plan screen — kept as a callback
  // rather than a hardcoded navigation.navigate('Plan') so this component
  // doesn't need to know which navigator/param-list type its caller uses.
  onBuyMore: () => void;
}) {
  const [open, setOpen] = useState(false);

  const items: { key: AgentCreditType; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[] = [
    { key: 'hot', label: 'Hot', icon: 'sparkles-outline', onPress: onHot },
    { key: 'super_hot', label: 'Super Hot', icon: 'flame-outline', onPress: onSuperHot },
    { key: 'refresh', label: 'Refresh', icon: 'refresh-outline', onPress: onRefresh },
    { key: 'story', label: 'Story', icon: 'film-outline', onPress: onStory },
  ];

  return (
    <>
      <Pressable style={styles.actionButton} onPress={() => setOpen(true)}>
        <Ionicons name="flash-outline" size={14} color={theme.colors.primary} />
        <Text style={styles.actionTextPrimary} numberOfLines={1}>Boost</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.boostBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.boostSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.boostTitle}>Boost</Text>
            {items.map((item) => {
              const available = creditsAvailable(item.key);
              const disabled = isPending || available <= 0;
              return (
                <Pressable
                  key={item.key}
                  disabled={disabled}
                  style={[styles.boostRow, disabled && styles.boostRowDisabled]}
                  onPress={() => {
                    item.onPress();
                    setOpen(false);
                  }}
                >
                  <Ionicons name={item.icon} size={18} color={theme.colors.primary} />
                  <Text style={styles.boostRowLabel}>{item.label}</Text>
                  <Text style={styles.boostRowCount}>{available} left</Text>
                </Pressable>
              );
            })}
            {/* Previously this menu was a dead end at 0 credits — disabled
                rows with no indication of how to get more. */}
            <Pressable
              style={styles.buyMoreRow}
              onPress={() => {
                setOpen(false);
                onBuyMore();
              }}
            >
              <Text style={styles.buyMoreText}>Buy more credits</Text>
            </Pressable>
            <Pressable style={styles.boostCancel} onPress={() => setOpen(false)}>
              <Text style={styles.boostCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Matches MyPropertiesScreen/MyProjectsScreen's own pill-shaped
  // actionButton — this trigger sits inline in the same row, so it needs
  // the same tappable-chip treatment for visual consistency.
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionTextPrimary: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  boostBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  boostSheet: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  boostTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  boostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceAlt,
  },
  boostRowDisabled: {
    opacity: 0.4,
  },
  boostRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  boostRowCount: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  buyMoreRow: {
    alignItems: 'center',
    paddingTop: 14,
  },
  buyMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  boostCancel: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  boostCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
  },
});
