import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { OwnerIdentityDocumentType, useOwnerVerificationViewModel } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

const DOCUMENT_TYPES: { type: OwnerIdentityDocumentType; label: string; useCamera?: boolean }[] = [
  { type: 'cnic_front', label: 'CNIC (Front)' },
  { type: 'cnic_back', label: 'CNIC (Back)' },
  { type: 'selfie', label: 'Selfie', useCamera: true },
];

const STATUS_LABEL: Record<string, string> = {
  pending: 'pending review',
  verified: 'verified',
  rejected: 'rejected — please re-upload and try again',
};

// One-time identity check for individual owners (CNIC front/back + selfie),
// staff-reviewed same as agent verification. Reached from PostListingScreen's
// gate card before a fresh owner can post their first listing.
export function OwnerIdentityVerificationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { verification, isLoading, uploadDocument } = useOwnerVerificationViewModel();

  const status = verification?.status ?? null;
  const uploadedTypes = new Set((verification?.documents ?? []).map((d) => d.documentType));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>
          This is a one-time check — upload your CNIC (front and back) and a selfie. Our team reviews new submissions
          within 24 hours; you can post your first listing once you're verified.
        </Text>

        {status && (
          <Text style={styles.status}>
            Status: <Text style={styles.statusValue}>{STATUS_LABEL[status] ?? status}</Text>
          </Text>
        )}

        {!isLoading && (
          <View style={styles.list}>
            {DOCUMENT_TYPES.map((doc) => (
              <DocumentRow
                key={doc.type}
                documentType={doc.type}
                label={doc.label}
                useCamera={doc.useCamera}
                uploaded={uploadedTypes.has(doc.type)}
                onUpload={(file) => uploadDocument.mutateAsync({ documentType: doc.type, file })}
              />
            ))}
          </View>
        )}

        <Button label="Back" variant="secondary" onPress={() => navigation.goBack()} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentRow({
  documentType,
  label,
  useCamera,
  uploaded,
  onUpload,
}: {
  documentType: OwnerIdentityDocumentType;
  label: string;
  useCamera?: boolean;
  uploaded: boolean;
  onUpload: (file: { uri: string; name: string; type: string }) => Promise<unknown>;
}) {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload() {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast(useCamera ? 'Camera permission is required.' : 'Photo library permission is required.', 'error');
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ cameraType: ImagePicker.CameraType.front, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
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
  subtitle: { fontSize: 14, color: theme.colors.muted, marginBottom: theme.spacing.md },
  status: { fontSize: 13, color: theme.colors.muted, marginBottom: theme.spacing.lg },
  statusValue: { fontWeight: '700', color: theme.colors.text },
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
