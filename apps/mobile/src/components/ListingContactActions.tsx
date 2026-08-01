import { Linking, Pressable, Text, View, StyleSheet } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import { Listing, listingsRepository, useFavoritesViewModel } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import { useAuthGate } from '../auth/AuthGateContext';

// One anonymous id per app session, same purpose as apps/web's
// viewerSession.ts — groups one visitor's engagement events. Hermes (RN's JS
// engine) has no global `crypto`, unlike browsers/Node — expo-crypto provides
// a real native-backed randomUUID instead.
const viewerSessionId = randomUUID();

// Fires the real engagement-tracking event (backs the agent dashboard's
// Calls/WhatsApp/SMS analytics) then performs the real native action.
// Fire-and-forget — a failed track shouldn't block the real tel:/wa.me/sms:
// action. Extracted out of BuyerSearchScreen.tsx so ListingDetailScreen.tsx
// can share the exact same behavior instead of re-implementing it.
export function trackAndOpen(listingId: string, type: 'call' | 'whatsapp' | 'sms', url: string) {
  listingsRepository.trackEngagement(listingId, { type, platform: 'mobile', viewerSessionId }).catch(() => {});
  Linking.openURL(url);
}

export function FavoriteButton({ listing, size = 20, style }: { listing: Listing; size?: number; style?: object }) {
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
    <Pressable style={[styles.favoriteButton, style]} onPress={handlePress} hitSlop={8}>
      <Ionicons
        name={isFavorited ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorited ? theme.colors.danger : theme.colors.muted}
      />
    </Pressable>
  );
}

// Call/WhatsApp/SMS numbers come from the listing's own contactNumbers —
// Listing.agent (ListingAgentSummary) has no phone field at all.
export function ContactActions({ listing }: { listing: Listing }) {
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

const styles = StyleSheet.create({
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  contactButtonPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonPrimaryText: { color: theme.colors.bg, fontWeight: '700', fontSize: 14 },
  contactButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: { color: theme.colors.primary, fontWeight: '700', fontSize: 14 },
});
