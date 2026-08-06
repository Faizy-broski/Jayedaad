import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { theme } from '@jayedaad/ui-native';

// Real terms content (replaces the earlier placeholder) — same wording as
// apps/web/app/terms/page.tsx, kept in sync deliberately. The key business
// requirement driving this is the "Legal Responsibility" clause: Jayedaad's
// responsibility is limited to verifying property ownership (see the
// Document Verification work — ownership_proof/utility_bill/CNIC checks),
// not the authenticity or accuracy of listing content beyond that. This is
// a working draft, not a substitute for review by qualified legal counsel
// before going live.
const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: '1. Acceptance of Terms',
    body: [
      'By creating an account, browsing listings, or otherwise using Jayedaad ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Platform.',
    ],
  },
  {
    heading: '2. Our Role',
    body: [
      "Jayedaad is a listings and discovery platform that connects property owners, real estate agencies, and buyers or tenants. Jayedaad is not a party to any sale, purchase, rental, or other transaction arranged between users, and does not act as a real estate broker, agent, or legal representative for any user.",
    ],
  },
  {
    heading: '3. Ownership Verification',
    body: [
      "Before a listing is published, Jayedaad requires the submitting party to provide documentation intended to confirm their claimed ownership of, or authority to list, the property (such as ownership documents, utility bills, or CNIC verification for individual owners). This ownership-verification check is the extent of Jayedaad's review of any listing.",
    ],
  },
  {
    heading: '4. No Warranty on Listing Accuracy',
    body: [
      'Jayedaad does not independently verify, and makes no representation or warranty regarding, the accuracy, completeness, or currency of any listing content — including but not limited to price, area, condition, amenities, photographs, or availability. Listing content is provided by the listing owner or agent and is their sole responsibility.',
      'Users are responsible for independently verifying any information about a property — including through a physical inspection and their own legal and financial due diligence — before entering into any transaction.',
    ],
  },
  {
    heading: '5. Limitation of Liability',
    body: [
      "To the fullest extent permitted by law, Jayedaad's liability in connection with any listing is limited to the ownership-verification check described above. Jayedaad is not liable for any loss, damage, or dispute arising from the accuracy of listing content, the conduct of any user, or any transaction entered into between users, whether such loss arises in contract, tort, or otherwise.",
    ],
  },
  {
    heading: '6. User Responsibilities',
    body: [
      'Users agree to provide accurate information when creating an account or listing, to comply with applicable laws, and to conduct their own due diligence before relying on any listing or entering into any transaction facilitated through the Platform.',
    ],
  },
  {
    heading: '7. Changes to These Terms',
    body: ['Jayedaad may update these Terms from time to time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.'],
  },
  {
    heading: '8. Contact',
    body: ['Questions about these Terms can be sent through the Contact Us screen.'],
  },
];

export function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.subtitle}>Last updated: this screen reflects Jayedaad&apos;s current terms of use.</Text>

        {SECTIONS.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.body.map((paragraph, i) => (
              <Text key={i} style={styles.body}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 12, color: theme.colors.muted, marginBottom: theme.spacing.lg },
  section: { marginBottom: theme.spacing.lg },
  heading: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  body: { fontSize: 13, color: theme.colors.muted, lineHeight: 19, marginTop: 4 },
});
