import { useState } from 'react';
import { FlatList, Linking, Pressable, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import {
  Listing,
  PAKISTAN_CITIES,
  formatPrice,
  listingsRepository,
  useFavoritesViewModel,
  useListingSearchViewModel,
  usePreferencesViewModel,
} from '@jayedaad/core';
import { Button, PickerField, TextInput, theme } from '@jayedaad/ui-native';
import { useAuthGate } from '../auth/AuthGateProvider';

// One anonymous id per app session, same purpose as apps/web's
// viewerSession.ts — groups one visitor's engagement events. Hermes (RN's JS
// engine) has no global `crypto`, unlike browsers/Node — expo-crypto provides
// a real native-backed randomUUID instead.
const viewerSessionId = randomUUID();

// Fires the real engagement-tracking event (backs the agent dashboard's
// Calls/WhatsApp/SMS analytics, previously always 0 — nothing anywhere
// called this endpoint) then performs the real native action. Fire-and-forget.
function trackAndOpen(listingId: string, type: 'call' | 'whatsapp' | 'sms', url: string) {
  listingsRepository.trackEngagement(listingId, { type, platform: 'mobile', viewerSessionId }).catch(() => {});
  Linking.openURL(url);
}

function FavoriteButton({ listing }: { listing: Listing }) {
  const { favorites, add, remove } = useFavoritesViewModel();
  const { requireAuth } = useAuthGate();
  const isFavorited = favorites.some((f) => f.listingId === listing.id);

  function handlePress() {
    requireAuth(() => {
      if (isFavorited) {
        remove.mutate(listing.id);
      } else {
        add.mutate(listing.id);
      }
    });
  }

  return (
    <Pressable style={styles.favoriteButton} onPress={handlePress} hitSlop={8}>
      <Ionicons
        name={isFavorited ? 'heart' : 'heart-outline'}
        size={20}
        color={isFavorited ? theme.colors.danger : theme.colors.muted}
      />
    </Pressable>
  );
}

function ContactActions({ listing }: { listing: Listing }) {
  const mobile = listing.contactNumbers.find((c) => c.type === 'mobile');
  const landline = listing.contactNumbers.find((c) => c.type === 'landline');
  const callContact = mobile ?? landline;
  if (!callContact) return null;

  const callNumber = `${callContact.countryCode}${callContact.number}`;
  const whatsappDigits = mobile ? `${mobile.countryCode}${mobile.number}`.replace(/\D/g, '') : undefined;
  const smsNumber = mobile ? `${mobile.countryCode}${mobile.number}` : undefined;

  return (
    <View style={styles.contactRow}>
      <Pressable style={styles.contactButtonPrimary} onPress={() => trackAndOpen(listing.id, 'call', `tel:${callNumber}`)}>
        <Text style={styles.contactButtonPrimaryText}>Call</Text>
      </Pressable>
      {whatsappDigits && (
        <Pressable
          style={styles.contactButton}
          onPress={() => trackAndOpen(listing.id, 'whatsapp', `https://wa.me/${whatsappDigits}`)}
        >
          <Text style={styles.contactButtonText}>WhatsApp</Text>
        </Pressable>
      )}
      {smsNumber && (
        <Pressable style={styles.contactButton} onPress={() => trackAndOpen(listing.id, 'sms', `sms:${smsNumber}`)}>
          <Text style={styles.contactButtonText}>SMS</Text>
        </Pressable>
      )}
    </View>
  );
}

// Same viewmodel as apps/web's (buyer)/search page.tsx — only the View differs.
export function BuyerSearchScreen() {
  const [listingNumber, setListingNumber] = useState('');
  const [submittedListingNumber, setSubmittedListingNumber] = useState<number | undefined>(undefined);
  const [city, setCity] = useState('');
  const [submittedCity, setSubmittedCity] = useState<string | undefined>(undefined);
  const { listings, isLoading } = useListingSearchViewModel({ listingNumber: submittedListingNumber, city: submittedCity });
  const { preferences } = usePreferencesViewModel();

  function handleSearch() {
    const digits = listingNumber.replace(/\D/g, '');
    setSubmittedListingNumber(digits ? Number(digits) : undefined);
    setSubmittedCity(city || undefined);
  }

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        value={listingNumber}
        onChangeText={setListingNumber}
        placeholder="Search by Listing ID (e.g. JYD-00001)"
        autoCapitalize="none"
        style={styles.listingIdInput}
      />
      <View style={styles.searchRow}>
        <View style={styles.cityPicker}>
          <PickerField value={city} options={PAKISTAN_CITIES} placeholder="Select City" title="Select City" onChange={setCity} />
        </View>
        <Button label="Search" onPress={handleSearch} />
      </View>

      {isLoading && <Text>Loading…</Text>}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No verified listings yet.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <FavoriteButton listing={item} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>
              {item.area}, {item.city} — {formatPrice(Number(item.price), preferences?.preferredCurrency)}
            </Text>
            <ContactActions listing={item} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  listingIdInput: { marginBottom: theme.spacing.sm },
  searchRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg, alignItems: 'center' },
  cityPicker: { flex: 1 },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  favoriteButton: { position: 'absolute', top: theme.spacing.sm, right: theme.spacing.sm, zIndex: 1 },
  title: { fontWeight: '600' },
  subtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 4 },
  empty: { color: theme.colors.muted },
  contactRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  contactButtonPrimary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  contactButtonPrimaryText: { color: theme.colors.bg, fontSize: 12, fontWeight: '600' },
  contactButton: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  contactButtonText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
});
