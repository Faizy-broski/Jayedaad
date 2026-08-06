import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { ListingDocumentType, listingsRepository } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

const DOCUMENT_TYPES: { type: ListingDocumentType; label: string }[] = [
  { type: 'ownership_proof', label: 'Ownership Document' },
  { type: 'utility_bill', label: 'Utility Bill' },
];

// Reached from two places: MyPropertiesScreen's "Documents" re-entry
// button (any status), and its "Submit" action on a draft whose documents
// are still incomplete (see submitOnComplete below) — PostListingScreen
// now collects these documents inline as its own section, so this screen
// only matters for a listing that already exists outside that flow.
// Mirrors BecomeAnAgentScreen.tsx's DocumentRow pattern, using the
// listing-scoped listingsRepository.uploadDocument instead of the agency one.
export function ListingDocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDocuments'>>();
  const { listingId, submitOnComplete } = route.params;
  const { showToast } = useToast();
  const [uploadedTypes, setUploadedTypes] = useState<Set<ListingDocumentType>>(new Set());
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    listingsRepository
      .listDocuments(listingId)
      .then((docs) => setUploadedTypes(new Set(docs.map((d) => d.documentType))))
      .catch(() => undefined);
  }, [listingId]);

  const isComplete = DOCUMENT_TYPES.every((doc) => uploadedTypes.has(doc.type));

  // Once both documents are uploaded, "Done" also has to actually move the
  // listing into pending_verification (submitDraft) when reached via the
  // one-click "Submit" path — that transition never happened yet there.
  async function handleDone() {
    if (!submitOnComplete) {
      navigation.reset({ index: 0, routes: [{ name: 'MyProperties' }] });
      return;
    }
    setIsFinishing(true);
    try {
      await listingsRepository.submitDraft(listingId);
      showToast('Submitted for verification.');
      navigation.reset({ index: 0, routes: [{ name: 'MyProperties' }] });
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error');
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ownership Documents</Text>
        <Text style={styles.subtitle}>
          Upload proof of ownership so our team can verify this listing. Both documents are required before this
          listing can be submitted for review.
        </Text>

        <View style={styles.list}>
          {DOCUMENT_TYPES.map((doc) => (
            <DocumentRow
              key={doc.type}
              documentType={doc.type}
              label={doc.label}
              uploaded={uploadedTypes.has(doc.type)}
              onUpload={async (file) => {
                await listingsRepository.uploadDocument(listingId, doc.type, file);
                setUploadedTypes((prev) => new Set(prev).add(doc.type));
              }}
            />
          ))}
        </View>

        <Button
          label={isFinishing ? 'Submitting…' : isComplete ? 'Done' : 'Upload both documents to continue'}
          onPress={handleDone}
          disabled={!isComplete || isFinishing}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentRow({
  documentType,
  label,
  uploaded,
  onUpload,
}: {
  documentType: ListingDocumentType;
  label: string;
  uploaded: boolean;
  onUpload: (file: { uri: string; name: string; type: string }) => Promise<unknown>;
}) {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload() {
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
      await onUpload({ uri: asset.uri, name: filename, type: mimeType });
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
