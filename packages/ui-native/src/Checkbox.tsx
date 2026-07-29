import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// RN has no native checkbox — this is the filled-green-circle-with-check
// look confirmed on the real "Add Features" reference (not a native Switch).
export function Checkbox({ checked, onChange, disabled }: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      hitSlop={8}
      style={[styles.circle, checked && styles.circleChecked, disabled && styles.circleDisabled]}
    >
      {checked && <Ionicons name="checkmark" size={14} color="#ffffff" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  circleDisabled: { opacity: 0.5 },
});
