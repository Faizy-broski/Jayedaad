import { SafeAreaView, ScrollView, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, theme } from '@jayedaad/ui-native';
import { IdentityVerificationFields } from '../components/IdentityVerificationFields';
import { RootStackParamList } from '../navigation/RootNavigator';

// One-time identity check for individuals (owners and independent agents
// alike — see IdentityVerificationFields), staff-reviewed same as agency
// verification. Reached from PostListingScreen's gate card before a fresh
// owner/independent agent can post their first listing.
export function OwnerIdentityVerificationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>You can post your first listing once you&apos;re verified.</Text>

        <IdentityVerificationFields />

        <Button label="Back" variant="secondary" onPress={() => navigation.goBack()} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 14, color: theme.colors.muted, marginBottom: theme.spacing.md },
});
