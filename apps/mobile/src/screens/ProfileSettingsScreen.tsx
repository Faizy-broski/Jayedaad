import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput as RNTextInput, View, Pressable, StyleSheet } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
  AreaUnit,
  COUNTRIES,
  getMaxPhoneDigits,
  PAKISTAN_CITIES,
  accountRepository,
  useAgentProfileViewModel,
  useAuthViewModel,
  usePreferencesViewModel,
} from '@jayedaad/core';
import { Button, Card, CardContent, CountryCodeField, PickerField, theme, useToast } from '@jayedaad/ui-native';

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];

function parsePhone(stored: string | null | undefined): { dialCode: string; number: string } {
  if (!stored) return { dialCode: '92', number: '' };
  if (stored.startsWith('+')) {
    const digits = stored.slice(1);
    const candidates = COUNTRIES.map((c) => c.dialCode.split(',')[0].replace(/\D/g, '')).filter((code) =>
      digits.startsWith(code),
    );
    const match = candidates.sort((a, b) => b.length - a.length)[0];
    if (match) return { dialCode: match, number: digits.slice(match.length) };
  }
  return { dialCode: '92', number: stored.replace(/\D/g, '') };
}

const DESTRUCTIVE_COLOR = theme.colors.danger;

export function ProfileSettingsScreen() {
  const { role } = useAuthViewModel();
  const isAgent = role === 'agent';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {isAgent ? <AgentProfileForm /> : <SelfProfileForm />}
        </CardContent>
      </Card>

      <Card style={[styles.card, styles.sectionSpacing]}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          <PreferencesFields />
        </CardContent>
      </Card>

      <DeleteAccountRow />
    </ScrollView>
  );
}

function AgentProfileForm() {
  const { user } = useAuthViewModel();
  const { profile, isLoading, updateProfile, uploadPhoto } = useAgentProfileViewModel();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneDialCode, setPhoneDialCode] = useState('92');
  const [landline, setLandline] = useState('');
  const [landlineDialCode, setLandlineDialCode] = useState('92');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappDialCode, setWhatsappDialCode] = useState('92');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!profile) return;
    const parsedPhone = parsePhone(profile.phone);
    const parsedLandline = parsePhone(profile.landline);
    const parsedWhatsapp = parsePhone(profile.whatsapp);
    setDisplayName(profile.displayName ?? '');
    setPhone(parsedPhone.number);
    setPhoneDialCode(parsedPhone.dialCode);
    setLandline(parsedLandline.number);
    setLandlineDialCode(parsedLandline.dialCode);
    setWhatsapp(parsedWhatsapp.number);
    setWhatsappDialCode(parsedWhatsapp.dialCode);
    setCity(profile.city ?? '');
    setAddress(profile.address ?? '');
  }, [profile]);

  if (isLoading) return <Text style={styles.muted}>Loading…</Text>;

  async function handlePickPhoto() {
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
    const filename = asset.uri.split('/').pop() ?? 'photo.jpg';
    const mimeType = asset.mimeType ?? 'image/jpeg';
    uploadPhoto.mutate(
      { uri: asset.uri, name: filename, type: mimeType },
      {
        onSuccess: () => showToast('Photo uploaded.'),
        onError: () => showToast('Upload failed — please try again.', 'error'),
      },
    );
  }

  function handleSave() {
    updateProfile.mutate(
      {
        displayName,
        phone: phone ? `+${phoneDialCode.replace(/\D/g, '')}${phone}` : undefined,
        landline: landline ? `+${landlineDialCode.replace(/\D/g, '')}${landline}` : undefined,
        whatsapp: whatsapp ? `+${whatsappDialCode.replace(/\D/g, '')}${whatsapp}` : undefined,
        city,
        address,
      },
      {
        onSuccess: () => showToast('Profile saved.'),
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  return (
    <>
      <View style={styles.photoRow}>
        {profile?.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>{(displayName || '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Pressable 
          style={({ pressed }) => [styles.photoButton, pressed && styles.photoButtonPressed]} 
          onPress={handlePickPhoto} 
          disabled={uploadPhoto.isPending}
        >
          <Text style={styles.photoButtonText}>{uploadPhoto.isPending ? 'Uploading…' : 'Browse and Upload'}</Text>
        </Pressable>
      </View>
      {uploadPhoto.isError && <Text style={styles.error}>Upload failed — please try again.</Text>}

      <Field label="Name" value={displayName} onChangeText={setDisplayName} />
      <Field label="Email Address" value={user?.email ?? ''} disabled />
      <PhoneField label="Mobile" value={phone} onChangeText={setPhone} dialCode={phoneDialCode} onDialCodeChange={setPhoneDialCode} />
      <PhoneField
        label="Landline"
        value={landline}
        onChangeText={setLandline}
        dialCode={landlineDialCode}
        onDialCodeChange={setLandlineDialCode}
      />
      <PhoneField
        label="Whatsapp"
        value={whatsapp}
        onChangeText={setWhatsapp}
        dialCode={whatsappDialCode}
        onDialCodeChange={setWhatsappDialCode}
      />
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>City</Text>
        <PickerField value={city} options={PAKISTAN_CITIES} placeholder="Select City" title="Select City" onChange={setCity} />
      </View>
      <Field label="Address" value={address} onChangeText={setAddress} />
      <View style={styles.buttonContainer}>
        <Button label={updateProfile.isPending ? 'Updating…' : 'Update Profile'} onPress={handleSave} disabled={updateProfile.isPending} />
      </View>
    </>
  );
}

function SelfProfileForm() {
  const { user } = useAuthViewModel();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState((user?.user_metadata?.display_name as string | undefined) ?? '');
  const [phone, setPhone] = useState('');
  const [phoneDialCode, setPhoneDialCode] = useState('92');

  const updateProfile = useMutation({
    mutationFn: () =>
      accountRepository.updateProfile({
        displayName,
        phone: phone ? `+${phoneDialCode.replace(/\D/g, '')}${phone}` : undefined,
      }),
  });

  return (
    <>
      <Field label="Name" value={displayName} onChangeText={setDisplayName} />
      <Field label="Email Address" value={user?.email ?? ''} disabled />
      <PhoneField label="Mobile" value={phone} onChangeText={setPhone} dialCode={phoneDialCode} onDialCodeChange={setPhoneDialCode} />
      <View style={styles.buttonContainer}>
        <Button
          label={updateProfile.isPending ? 'Updating…' : 'Update Profile'}
          onPress={() =>
            updateProfile.mutate(undefined, {
              onSuccess: () => showToast('Profile saved.'),
              onError: () => showToast('Something went wrong — please try again.', 'error'),
            })
          }
          disabled={updateProfile.isPending}
        />
      </View>
    </>
  );
}

function PreferencesFields() {
  const { preferences, isLoading, updatePreferences } = usePreferencesViewModel();
  const { showToast } = useToast();

  if (isLoading || !preferences) return <Text style={styles.muted}>Loading…</Text>;

  function pickAreaUnit() {
    Alert.alert(
      'Area Unit',
      undefined,
      AREA_UNITS.map((unit) => ({
        text: unit,
        onPress: () =>
          updatePreferences.mutate(
            { preferredAreaUnit: unit },
            {
              onSuccess: () => showToast('Preferences updated.'),
              onError: () => showToast('Something went wrong — please try again.', 'error'),
            },
          ),
      })),
    );
  }

  return (
    <>
      <Field label="Currency" value="Pakistan (PKR)" disabled />
      <Pressable onPress={pickAreaUnit}>
        <Field label="Area Unit" value={preferences.preferredAreaUnit} editable={false} />
      </Pressable>
      <Field label="Language" value="English" disabled />
    </>
  );
}

function DeleteAccountRow() {
  const { deleteAccount } = useAuthViewModel();

  function handleDelete() {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () =>
            deleteAccount.mutate(undefined, {
              onError: (error: any) => {
                Alert.alert('Could not delete account', error?.response?.data?.message ?? 'Please try again.');
              },
            }),
        },
      ],
    );
  }

  return (
    <Card style={[styles.card, styles.sectionSpacing, styles.deleteCard]}>
      <CardContent style={styles.deleteContent}>
        <Pressable 
          style={({ pressed }) => [styles.deleteRow, pressed && styles.deleteRowPressed]} 
          onPress={handleDelete} 
          disabled={deleteAccount.isPending}
        >
          <Text style={styles.deleteText}>{deleteAccount.isPending ? 'Deleting…' : 'Delete Account'}</Text>
        </Pressable>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChangeText,
  disabled,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  disabled?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <RNTextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editable && !disabled && !!onChangeText}
        pointerEvents={editable ? 'auto' : 'none'}
      />
    </View>
  );
}

function PhoneField({
  label,
  value,
  onChangeText,
  dialCode,
  onDialCodeChange,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  dialCode: string;
  onDialCodeChange: (dialCode: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.phoneRow}>
        <View style={styles.countryCodeWrapper}>
          <CountryCodeField countries={COUNTRIES} value={dialCode} onChange={onDialCodeChange} />
        </View>
        <RNTextInput
          style={[styles.input, styles.phoneInput]}
          value={value}
          maxLength={getMaxPhoneDigits(dialCode)}
          onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
          keyboardType="number-pad"
          placeholder="3XXXXXXXXX"
          placeholderTextColor={theme.colors.mutedLight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: theme.colors.bg 
  },
  content: { 
    padding: 16, 
    paddingBottom: 40 
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
    backgroundColor: theme.colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardContent: { 
    padding: 20,
    gap: 16,
  },
  sectionSpacing: { 
    marginTop: 20 
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: theme.colors.muted, 
    letterSpacing: 0.8, 
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  muted: { 
    fontSize: 14, 
    color: theme.colors.muted 
  },
  
  // Photo Upload Row
  photoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16,
    marginBottom: 8,
  },
  photoPreview: { 
    width: 64, 
    height: 64, 
    borderRadius: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoPlaceholderText: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: theme.colors.mutedLight 
  },
  photoButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  photoButtonPressed: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  photoButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: theme.colors.muted 
  },
  error: { 
    fontSize: 13, 
    color: DESTRUCTIVE_COLOR, 
    marginTop: -8 
  },

  // Form Fields
  field: { 
    gap: 8 
  },
  fieldLabel: { 
    fontSize: 13, 
    fontWeight: '500',
    color: theme.colors.muted 
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.bg,
  },
  inputDisabled: { 
    backgroundColor: theme.colors.surfaceAlt, 
    color: theme.colors.muted,
    borderColor: theme.colors.surfaceAlt,
  },
  
  // Phone Fields
  phoneRow: { 
    flexDirection: 'row', 
    gap: 12,
  },
  countryCodeWrapper: {
    width: 125, // Fixed width prevents the text from wrapping inside the picker
  },
  phoneInput: { 
    flex: 1 
  },
  
  // Buttons
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  
  // Delete Row
  deleteCard: {
    marginBottom: 20,
  },
  deleteContent: {
    padding: 0,
  },
  deleteRow: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 16,
  },
  deleteRowPressed: {
    backgroundColor: theme.colors.dangerBg, // Soft red background on press
    borderRadius: 12,
  },
  deleteText: { 
    color: DESTRUCTIVE_COLOR, 
    fontWeight: '700', 
    fontSize: 15 
  },
});