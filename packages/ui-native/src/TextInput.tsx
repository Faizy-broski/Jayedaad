import { useState } from 'react';
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps, Text, View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  // Renders an eye/eye-off toggle inside the field and manages
  // secureTextEntry itself — for password fields, matches the pattern used
  // on both login and signup.
  secureToggle?: boolean;
}

// RN counterpart to @jayedaad/ui-web's Input+Label, same pairing so
// auth/form screens feel consistent with the web design system.
export function TextInput({ label, error, style, secureToggle, secureTextEntry, ...props }: TextInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        <RNTextInput
          placeholderTextColor={theme.colors.muted}
          secureTextEntry={secureToggle ? !visible : secureTextEntry}
          style={[styles.input, secureToggle && styles.inputWithIcon, !!error && styles.inputError, style]}
          {...props}
        />
        {secureToggle && (
          <Pressable style={styles.icon} onPress={() => setVisible((v) => !v)} hitSlop={8}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.muted} />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.xs },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: 15,
  },
  inputWithIcon: { paddingRight: theme.spacing.xl },
  inputError: { borderColor: '#dc2626' },
  error: { fontSize: 12, color: '#dc2626' },
  icon: { position: 'absolute', right: theme.spacing.md },
});
