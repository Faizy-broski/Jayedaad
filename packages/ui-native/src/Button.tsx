import { Pressable, Text, PressableProps, StyleSheet } from 'react-native';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary';
}

// RN counterpart to @jayedaad/ui-web's Button — same props shape, native
// primitives — so screens built against either package feel like the same
// design system, proving the cross-platform parity claim in the blueprint.
export function Button({ label, variant = 'primary', style, ...props }: ButtonProps) {
  return (
    <Pressable
      style={(state) => [styles.base, variant === 'secondary' && styles.secondary, typeof style === 'function' ? style(state) : style]}
      {...props}
    >
      <Text style={variant === 'secondary' ? styles.textSecondary : styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: '#f1f5f9',
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
  },
  textSecondary: {
    color: '#0f172a',
    fontWeight: '600',
  },
});
