import { SafeAreaView, ScrollView, Text, StyleSheet } from 'react-native';
import { theme } from '@jayedaad/ui-native';

// Placeholder copy — swap for real legal text whenever it's available. Same
// content as apps/web/app/terms/page.tsx, only exists so the signup
// screen's Terms & Conditions link isn't dead.
export function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.placeholder}>Placeholder — real terms and conditions coming soon.</Text>
        <Text style={styles.body}>
          By using Jayedaad, you agree to use the platform responsibly and in accordance with applicable laws. Full
          legal terms will be published here before this product goes live.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  placeholder: { fontSize: 12, color: theme.colors.muted, marginBottom: theme.spacing.lg },
  body: { fontSize: 14, color: theme.colors.text, lineHeight: 20 },
});
