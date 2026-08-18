import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput as RNTextInput, View, Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  AREA_UNIT_OPTIONS,
  COUNTRIES,
  CURRENCY_OPTIONS,
  getMaxPhoneDigits,
  PAKISTAN_CITIES,
  useAccountProfileViewModel,
  useAgentProfileViewModel,
  useAuthViewModel,
  useMyAgencyViewModel,
  usePreferencesViewModel,
} from '@jayedaad/core';
import { Button, Card, CardContent, CountryCodeField, PickerField, theme, useToast } from '@jayedaad/ui-native';
import { PlacesAutocompleteInput } from '../components/PlacesAutocompleteInput';
import { Ionicons } from '@expo/vector-icons';

// FIGMA COLORS
const FIGMA_BG = '#F8FAFC';
const FIGMA_CARD = '#FFFFFF';
const FIGMA_PRIMARY = '#0F5A3E';
const FIGMA_BORDER = '#E2E8F0';
const FIGMA_LABEL = '#475569';
const FIGMA_SECTION_TITLE = '#64748B';
const FIGMA_MUTED = '#94A3B8';
const FIGMA_DANGER_BG = '#FEE2E2';
const FIGMA_DANGER_TEXT = '#EF4444';

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

export function ProfileSettingsScreen() {
  const { role } = useAuthViewModel();
  const isAgent = role === 'agent';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {isAgent ? <AgentProfileForm /> : <SelfProfileForm />}

      {isAgent && <AgencyDetailsCard />}

      <Card style={[styles.card, styles.sectionSpacing]}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.sectionTitle}>GENERAL SETTINGS</Text>
          <PreferencesFields />
        </CardContent>
      </Card>

      <DeleteAccountRow />
    </ScrollView>
  );
}

function ProfileHeader({ 
  profile, 
  displayName, 
  email, 
  onPickPhoto, 
  isUploading 
}: { 
  profile: any; 
  displayName: string; 
  email: string; 
  onPickPhoto: () => void; 
  isUploading: boolean;
}) {
  return (
    <View style={styles.profileHeaderRow}>
      <Pressable onPress={onPickPhoto} disabled={isUploading}>
        <View style={styles.avatarContainer}>
          {profile?.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>{(displayName || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={12} color={FIGMA_CARD} />
          </View>
        </View>
      </Pressable>
      <View style={styles.headerInfo}>
        <Text style={styles.headerName}>{displayName || 'User'}</Text>
        <Text style={styles.headerEmail}>{email}</Text>
        <Pressable onPress={onPickPhoto} disabled={isUploading}>
          <Text style={styles.headerChangePhoto}>{isUploading ? 'Uploading...' : 'Change photo'}</Text>
        </Pressable>
      </View>
    </View>
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
      <ProfileHeader 
        profile={profile} 
        displayName={displayName} 
        email={user?.email ?? ''} 
        onPickPhoto={handlePickPhoto} 
        isUploading={uploadPhoto.isPending} 
      />

      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
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
            label="WhatsApp"
            value={whatsapp}
            onChangeText={setWhatsapp}
            dialCode={whatsappDialCode}
            onDialCodeChange={setWhatsappDialCode}
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>City</Text>
            <PickerField value={city} options={PAKISTAN_CITIES} placeholder="Select City" title="Select City" onChange={setCity} style={styles.pillOverride} />
          </View>
          <PlacesAutocompleteInput label="Address" value={address} onChange={setAddress} style={styles.pillOverride} inputStyle={styles.pillOverride} />
          <View style={styles.buttonContainer}>
            <Button 
              label={updateProfile.isPending ? 'Updating…' : 'Update Profile'} 
              onPress={handleSave} 
              disabled={updateProfile.isPending} 
              style={styles.primaryButton}
            />
          </View>
        </CardContent>
      </Card>
    </>
  );
}

function AgencyDetailsCard() {
  const { agency, isLoading, isAgencyAdmin, update } = useMyAgencyViewModel();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!agency) return;
    setName(agency.name ?? '');
    setPhone(agency.phone ?? '');
    setCity(agency.city ?? '');
    setAddress(agency.address ?? '');
    setDescription(agency.description ?? '');
  }, [agency]);

  if (!agency && !isLoading) return null;

  function handleSave() {
    update.mutate(
      { name, phone, city, address, description },
      {
        onSuccess: () => showToast('Agency details saved.'),
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  return (
    <Card style={[styles.card, styles.sectionSpacing]}>
      <CardContent style={styles.cardContent}>
        <Text style={styles.sectionTitle}>AGENCY DETAILS</Text>
        {isLoading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : (
          <>
            {!isAgencyAdmin && <Text style={styles.muted}>Only your agency&apos;s admin can edit these details.</Text>}
            <Field label="Agency Name" value={name} onChangeText={setName} disabled={!isAgencyAdmin} />
            <Field label="Phone" value={phone} onChangeText={setPhone} disabled={!isAgencyAdmin} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>City</Text>
              <PickerField
                value={city}
                options={PAKISTAN_CITIES}
                placeholder="Select City"
                title="Select City"
                disabled={!isAgencyAdmin}
                onChange={setCity}
                style={styles.pillOverride}
              />
            </View>
            <PlacesAutocompleteInput label="Address" value={address} onChange={setAddress} editable={isAgencyAdmin} style={styles.pillOverride} inputStyle={styles.pillOverride} />
            <Field label="Description" value={description} onChangeText={setDescription} disabled={!isAgencyAdmin} />
            {isAgencyAdmin && (
              <View style={styles.buttonContainer}>
                <Button 
                  label={update.isPending ? 'Updating…' : 'Update Agency'} 
                  onPress={handleSave} 
                  disabled={update.isPending} 
                  style={styles.primaryButton}
                />
              </View>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SelfProfileForm() {
  const { user } = useAuthViewModel();
  const { profile, isLoading, updateProfile, uploadPhoto } = useAccountProfileViewModel();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneDialCode, setPhoneDialCode] = useState('92');

  useEffect(() => {
    if (!profile) return;
    const parsedPhone = parsePhone(profile.phone);
    setDisplayName(profile.displayName ?? '');
    setPhone(parsedPhone.number);
    setPhoneDialCode(parsedPhone.dialCode);
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
      },
      {
        onSuccess: () => showToast('Profile saved.'),
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  return (
    <>
      <ProfileHeader 
        profile={profile} 
        displayName={displayName} 
        email={user?.email ?? ''} 
        onPickPhoto={handlePickPhoto} 
        isUploading={uploadPhoto.isPending} 
      />

      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
          <Field label="Name" value={displayName} onChangeText={setDisplayName} />
          <Field label="Email Address" value={user?.email ?? ''} disabled />
          <PhoneField label="Mobile" value={phone} onChangeText={setPhone} dialCode={phoneDialCode} onDialCodeChange={setPhoneDialCode} />
          <View style={styles.buttonContainer}>
            <Button
              label={updateProfile.isPending ? 'Updating…' : 'Update Profile'}
              onPress={handleSave}
              disabled={updateProfile.isPending}
              style={styles.primaryButton}
            />
          </View>
        </CardContent>
      </Card>
    </>
  );
}

function PreferencesFields() {
  const { preferences, isLoading, updatePreferences } = usePreferencesViewModel();
  const { showToast } = useToast();

  if (isLoading || !preferences) return <Text style={styles.muted}>Loading…</Text>;

  function saveAreaUnit(label: string) {
    const unit = AREA_UNIT_OPTIONS.find((u) => u.label === label);
    if (!unit) return;
    updatePreferences.mutate(
      { preferredAreaUnit: unit.value },
      {
        onSuccess: () => showToast('Preferences updated.'),
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  function saveCurrency(label: string) {
    const currency = CURRENCY_OPTIONS.find((c) => c.label === label);
    if (!currency) return;
    updatePreferences.mutate(
      { preferredCurrency: currency.code },
      {
        onSuccess: () => showToast('Preferences updated.'),
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  const currencyLabel =
    CURRENCY_OPTIONS.find((c) => c.code === preferences.preferredCurrency)?.label ?? preferences.preferredCurrency;
  const areaUnitLabel =
    AREA_UNIT_OPTIONS.find((u) => u.value === preferences.preferredAreaUnit)?.label ?? preferences.preferredAreaUnit;

  return (
    <>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Currency</Text>
        <PickerField
          value={currencyLabel}
          options={CURRENCY_OPTIONS.map((c) => c.label)}
          title="Currency"
          onChange={saveCurrency}
          style={styles.pillOverride}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Area Unit</Text>
        <PickerField
          value={areaUnitLabel}
          options={AREA_UNIT_OPTIONS.map((u) => u.label)}
          title="Area Unit"
          onChange={saveAreaUnit}
          style={styles.pillOverride}
        />
      </View>
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
    <View style={styles.deleteSection}>
      <Pressable 
        style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]} 
        onPress={handleDelete} 
        disabled={deleteAccount.isPending}
      >
        <Text style={styles.deleteButtonText}>{deleteAccount.isPending ? 'Deleting…' : 'Delete Account'}</Text>
      </Pressable>
      <Text style={styles.deleteDisclaimer}>This will permanently remove your account and data.</Text>
    </View>
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
          <CountryCodeField 
            countries={COUNTRIES} 
            value={dialCode} 
            onChange={onDialCodeChange}
            style={styles.countryCodeHiddenBorders}
          />
        </View>
        <RNTextInput
          style={[styles.input, styles.phoneInput]}
          value={value}
          maxLength={getMaxPhoneDigits(dialCode)}
          onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
          keyboardType="number-pad"
          placeholder="3XXXXXXXXX"
          placeholderTextColor={FIGMA_MUTED}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: FIGMA_BG 
  },
  content: { 
    padding: 20, 
    paddingBottom: 40 
  },
  
  // Header / Avatar Styles
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  avatarContainer: {
    position: 'relative',
    width: 68,
    height: 68,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.surfaceAlt,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: FIGMA_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 26,
    fontWeight: '800',
    color: FIGMA_CARD,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: FIGMA_PRIMARY,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: FIGMA_CARD,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerEmail: {
    fontSize: 13,
    color: FIGMA_LABEL,
    marginBottom: 2,
  },
  headerChangePhoto: {
    fontSize: 12,
    fontWeight: '700',
    color: FIGMA_PRIMARY,
  },

  // Card Styles
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9', // Ultra light border to match modern aesthetics
    backgroundColor: FIGMA_CARD,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
    fontSize: 11, 
    fontWeight: '700', 
    color: FIGMA_SECTION_TITLE, 
    letterSpacing: 0.8, 
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  muted: { 
    fontSize: 14, 
    color: FIGMA_MUTED 
  },

  // Form Fields
  field: { 
    gap: 6 
  },
  fieldLabel: { 
    fontSize: 12, 
    fontWeight: '500',
    color: FIGMA_LABEL 
  },
  input: {
    borderWidth: 1,
    borderColor: FIGMA_BORDER,
    borderRadius: 92, // Fully rounded pill shape
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: FIGMA_CARD,
    height: 48,
  },
  inputDisabled: { 
    backgroundColor: '#F8FAFC', 
    color: FIGMA_MUTED,
    borderColor: '#F1F5F9',
  },
  
  // Custom Overrides for Third-party picker components to follow pill shape
  pillOverride: {
    borderRadius: 92,
  },

  // Phone Fields
  phoneRow: { 
    flexDirection: 'row', 
    gap: 12,
  },
  countryCodeWrapper: {
    width: 100,
    height: 48,
    borderWidth: 1,
    borderColor: FIGMA_BORDER,
    borderRadius: 92, // Fully rounded pill shape
    backgroundColor: FIGMA_CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Strips the field's own border/background so only the wrapper's single
  // rounded outline shows, instead of two nested boxes.
  countryCodeHiddenBorders: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
    borderRadius: 92,
  },
  phoneInput: { 
    flex: 1 
  },
  
  // Buttons
  buttonContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: FIGMA_PRIMARY,
    borderRadius: 999,
    width: 249,
    height: 35,
    justifyContent: 'center',
  },
  
  // Delete Section
  deleteSection: {
    marginTop: 32,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    backgroundColor: FIGMA_DANGER_BG,
    borderRadius: 999,
    width: 249,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    opacity: 0.8,
  },
  deleteButtonText: {
    color: FIGMA_DANGER_TEXT,
    fontWeight: '700',
    fontSize: 14,
  },
  deleteDisclaimer: {
    fontSize: 11,
    color: FIGMA_MUTED,
    textAlign: 'center',
  },
});