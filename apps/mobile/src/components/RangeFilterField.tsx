import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '@jayedaad/core';
import { Button, PickerField, theme } from '@jayedaad/ui-native';

export interface RangeFilterFieldProps {
  label: string;
  min: string;
  max: string;
  onApply: (min: string, max: string) => void;
  // Price ranges are formatted via formatPrice; area ranges are shown as
  // plain numbers + unit instead, since there's no currency to format.
  isPrice?: boolean;
  unit?: string;
  unitOptions?: string[];
  onUnitChange?: (unit: string) => void;
}

// Pill trigger + compact Modal for a numeric min/max range — the quick-pill
// equivalent of the Price/Area rows already built into SearchFilterSheet.tsx,
// but applying instantly instead of requiring the full filter sheet, same
// "quick dropdown" behavior as the reference Zameen filter bar.
export function RangeFilterField({ label, min, max, onApply, isPrice, unit, unitOptions, onUnitChange }: RangeFilterFieldProps) {
  const [visible, setVisible] = useState(false);
  const [draftMin, setDraftMin] = useState(min);
  const [draftMax, setDraftMax] = useState(max);

  useEffect(() => {
    if (visible) {
      setDraftMin(min);
      setDraftMax(max);
    }
  }, [visible, min, max]);

  function triggerLabel(): string {
    if (!min && !max) return label;
    if (isPrice) {
      if (min && max) return `${formatPrice(Number(min))} – ${formatPrice(Number(max))}`;
      if (min) return `${formatPrice(Number(min))}+`;
      return `Up to ${formatPrice(Number(max))}`;
    }
    const suffix = unit ? ` ${unit}` : '';
    if (min && max) return `${min}–${max}${suffix}`;
    if (min) return `${min}+${suffix}`;
    return `Up to ${max}${suffix}`;
  }

  function handleApply() {
    onApply(draftMin, draftMax);
    setVisible(false);
  }

  function handleClear() {
    setDraftMin('');
    setDraftMax('');
    onApply('', '');
    setVisible(false);
  }

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={[styles.triggerText, !min && !max && styles.placeholder]} numberOfLines={1}>
          {triggerLabel()}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
      </Pressable>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>

            <View style={styles.rangeRow}>
              <TextInput
                style={styles.rangeInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.mutedLight}
                value={draftMin}
                onChangeText={(v) => setDraftMin(v.replace(/\D/g, ''))}
              />
              <Text style={styles.rangeTo}>to</Text>
              <TextInput
                style={styles.rangeInput}
                keyboardType="number-pad"
                placeholder="Any"
                placeholderTextColor={theme.colors.mutedLight}
                value={draftMax}
                onChangeText={(v) => setDraftMax(v.replace(/\D/g, ''))}
              />
            </View>

            {unitOptions && onUnitChange && (
              <View style={styles.unitPicker}>
                <PickerField value={unit ?? ''} options={unitOptions} title="Unit" onChange={onUnitChange} />
              </View>
            )}

            <View style={styles.footer}>
              <Pressable onPress={handleClear} hitSlop={8}>
                <Text style={styles.clearLink}>Clear</Text>
              </Pressable>
              <View style={styles.applyButton}>
                <Button label="Apply" size="sm" onPress={handleApply} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  triggerText: { fontSize: 13, fontWeight: '600', color: theme.colors.text, maxWidth: 130 },
  placeholder: { color: theme.colors.muted, fontWeight: '500' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: theme.spacing.lg },
  sheet: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
  },
  rangeTo: { fontSize: 13, color: theme.colors.muted },
  unitPicker: { alignSelf: 'flex-start', width: 120 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  clearLink: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  applyButton: { minWidth: 100 },
});
