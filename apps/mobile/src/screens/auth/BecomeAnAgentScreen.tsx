import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { agenciesRepository, OnboardingDocumentType, useAgentProfileViewModel } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';
import { useAuthGate } from '../../auth/AuthGateContext';

// Owner ID + Company Registration are mandatory (Document Verification
// spec) — tax_certificate remains a valid upload type but is optional,
// no longer part of REQUIRED_ONBOARDING_DOCUMENT_TYPES server-side.
const DOCUMENT_TYPES: { type: OnboardingDocumentType; label: string }[] = [
  { type: 'owner_id_card', label: 'Owner ID Card (front and back)' },
  { type: 'company_registration', label: 'Company Registration ID' },
  { type: 'tax_certificate', label: 'Tax Certificate (optional)' },
];

// Mirrors web's become-an-agent/page.tsx DocumentUploadStep, scoped to the
// one case mobile signup can produce: a freshly self-registered agency
// owner (profile.agency is always present here) — web's separate "apply as
// individual agent later" form is a distinct pre-existing feature reached
// elsewhere on web, not part of the signup flow this screen serves.
// AuthNavigator routes here from VerifyEmailScreen once verified, and
// AuthGateProvider holds the sheet open (via needsAgencyDocuments) until
// dismissAgentGate() is called below, same as web staying on this route
// until "Continue to Dashboard" is pressed.
export function BecomeAnAgentScreen() {
  const { profile } = useAgentProfileViewModel();
  const { dismissAgentGate } = useAuthGate();

  const agencyId = profile?.agency?.id;
  const status = profile?.agency?.verificationStatus ?? 'pending';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Application Submitted</Text>
        <Text style={styles.subtitle}>
          Your agency is <Text style={styles.status}>{status}</Text>. Upload the documents below so our team can
          review and approve your account.
        </Text>

        <View style={styles.list}>
          {DOCUMENT_TYPES.map((doc) => (
            <DocumentRow key={doc.type} agencyId={agencyId} documentType={doc.type} label={doc.label} />
          ))}
        </View>

        <Button label="Continue to Dashboard" onPress={dismissAgentGate} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentRow({
  agencyId,
  documentType,
  label,
}: {
  agencyId?: string;
  documentType: OnboardingDocumentType;
  label: string;
}) {
  const { showToast } = useToast();
  const [uploaded, setUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload() {
    if (!agencyId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo library permission is required.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const filename = asset.uri.split('/').pop() ?? `${documentType}.jpg`;
    const mimeType = asset.mimeType ?? 'image/jpeg';
    setIsUploading(true);
    try {
      await agenciesRepository.uploadDocument(agencyId, documentType, { uri: asset.uri, name: filename, type: mimeType });
      setUploaded(true);
      showToast(`${label} uploaded.`);
    } catch {
      showToast('Upload failed — please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        {uploaded && <Text style={styles.rowUploaded}>Uploaded</Text>}
      </View>
      <Pressable style={styles.uploadButton} onPress={handleUpload} disabled={isUploading}>
        <Text style={styles.uploadButtonText}>{isUploading ? 'Uploading…' : uploaded ? 'Replace' : 'Upload'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 14, color: theme.colors.muted, marginBottom: theme.spacing.xl },
  status: { fontWeight: '600', color: theme.colors.text },
  list: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  rowUploaded: { fontSize: 12, color: theme.colors.primary, marginTop: 2 },
  uploadButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.inputBorder,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  uploadButtonText: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
});
