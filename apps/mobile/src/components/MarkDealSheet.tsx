import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ListingPurpose, useMarkDealViewModel, useMyAgencyViewModel } from '@jayedaad/core';
import { Button, Dialog, TextInput, theme, useToast } from '@jayedaad/ui-native';

interface MarkDealSheetProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  // 'sale' -> Mark Sold (asks for sale price), 'rent' -> Mark Rented (asks
  // for monthly rent) — a listing only ever gets one of the two actions,
  // driven by its own purpose (see property-management/page.tsx's web
  // counterpart for the same rule).
  purpose: Extract<ListingPurpose, 'sale' | 'rent'>;
}

// Shared "Mark Sold"/"Mark Rented" form — used from both MyPropertiesScreen
// (row action) and ListingPerformanceScreen (header button), same
// extract-don't-duplicate call the web version made for its
// MarkDealModal.tsx. Commission rate prefills from the agent's agency
// default when one is set; the field stays editable per deal (negotiated
// commissions vary).
export function MarkDealSheet({ open, onClose, listingId, purpose }: MarkDealSheetProps) {
  const { markSold, markRented } = useMarkDealViewModel();
  const { agency } = useMyAgencyViewModel();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [notes, setNotes] = useState('');

  // Reset per-open so a previous deal's typed values don't linger into the
  // next listing's form, and re-prefill commission once the agency query
  // resolves (it may still be loading on first open).
  useEffect(() => {
    if (!open) return;
    setAmount('');
    setNotes('');
    setCommissionRate(agency?.defaultCommissionRate != null ? String(agency.defaultCommissionRate) : '');
  }, [open, agency?.defaultCommissionRate]);

  const isSale = purpose === 'sale';
  const mutation = isSale ? markSold : markRented;
  const isPending = mutation.isPending;

  function submit() {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      showToast('Enter a valid amount.', 'error');
      return;
    }
    const commissionRateNum = commissionRate.trim() ? Number(commissionRate) : undefined;
    const baseInput = { commissionRate: commissionRateNum, notes: notes.trim() || undefined };

    const onSuccess = () => {
      showToast(isSale ? 'Listing marked sold.' : 'Listing marked rented.');
      onClose();
    };
    const onError = (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error');

    if (isSale) {
      markSold.mutate({ listingId, input: { salePrice: numericAmount, ...baseInput } }, { onSuccess, onError });
    } else {
      markRented.mutate({ listingId, input: { monthlyRent: numericAmount, ...baseInput } }, { onSuccess, onError });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isSale ? 'Mark Sold' : 'Mark Rented'}>
      <View style={styles.form}>
        <TextInput
          label={isSale ? 'Sale Price (PKR)' : 'Monthly Rent (PKR)'}
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          autoFocus
        />
        <TextInput
          label="Commission Rate (%)"
          value={commissionRate}
          onChangeText={setCommissionRate}
          keyboardType="decimal-pad"
          placeholder={agency?.defaultCommissionRate != null ? undefined : 'e.g. 2'}
        />
        <TextInput label="Notes (optional)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        <Text style={styles.hint}>Closing date defaults to today.</Text>
        <Button label={isSale ? 'Mark Sold' : 'Mark Rented'} onPress={submit} disabled={isPending} style={styles.submit} />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing.md, paddingVertical: theme.spacing.xs },
  hint: { fontSize: 12, color: theme.colors.muted },
  submit: { marginTop: theme.spacing.xs },
});
