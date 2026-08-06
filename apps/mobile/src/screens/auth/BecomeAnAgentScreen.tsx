import { useEffect, useState } from 'react';
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
const REQUIRED_ONBOARDING_DOCUMENT_TYPES: OnboardingDocumentType[] = ['owner_id_card', 'company_registration'];

// Mirrors web's become-an-agent/page.tsx DocumentUploadStep, scoped to the
// one case mobile signup can produce: a freshly self-registered agency
// owner (profile.agency is always present here) — web's separate "apply as
// individual agent later" form is a distinct pre-existing feature reached
// elsewhere on web, not part of the signup flow this screen serves.
// AuthNavigator routes here from VerifyEmailScreen once verified, and
// AuthGateProvider holds the sheet open (via needsAgencyDocuments) until
// dismissAgentGate() is called below, same as web staying on this route
// until "Continue to Dashboard" is pressed — now disabled until both
// required documents are actually uploaded, not just skippable.
export function BecomeAnAgentScreen() {
  const { profile } = useAgentProfileViewModel();
  const { dismissAgentGate } = useAuthGate();

  const agencyId = profile?.agency?.id;
  const status = profile?.agency?.verificationStatus ?? 'pending';

  // Fetched from the server (not tracked locally per-row) — a returning
  // visitor to this screen previously saw every row reset to "not
  // uploaded" even if the documents were already there, since state lived
  // only in each DocumentRow's own useState.
  const [uploadedTypes, setUploadedTypes] = useState<Set<OnboardingDocumentType>>(new Set());

  useEffect(() => {
    if (!agencyId) return;
    agenciesRepository
      .listDocuments(agencyId)
      .then((docs) => setUploadedTypes(new Set(docs.map((d) => d.documentType))))
      .catch(() => undefined);
  }, [agencyId]);

  const isComplete = REQUIRED_ONBOARDING_DOCUMENT_TYPES.every((type) => uploadedTypes.has(type));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Application Submitted</Text>
        <Text style={styles.subtitle}>
          Your agency is <Text style={styles.status}>{status}</Text>. Owner ID and Company Registration are
          required before you can continue — our team reviews everything once uploaded.
        </Text>

        <View style={styles.list}>
          {DOCUMENT_TYPES.map((doc) => (
            <DocumentRow
              key={doc.type}
              agencyId={agencyId}
              documentType={doc.type}
              label={doc.label}
              uploaded={uploadedTypes.has(doc.type)}
              onUploaded={() => setUploadedTypes((prev) => new Set(prev).add(doc.type))}
            />
          ))}
        </View>

        <Button
          label={isComplete ? 'Continue to Dashboard' : 'Upload Owner ID and Company Registration to continue'}
          onPress={dismissAgentGate}
          disabled={!isComplete}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentRow({
  agencyId,
  documentType,
  label,
  uploaded,
  onUploaded,
}: {
  agencyId?: string;
  documentType: OnboardingDocumentType;
  label: string;
  uploaded: boolean;
  onUploaded: () => void;
}) {
  const { showToast } = useToast();
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
      onUploaded();
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
