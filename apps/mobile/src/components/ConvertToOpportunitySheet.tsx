import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DealType, Lead, useOpportunityPipelineViewModel } from '@jayedaad/core';
import { Button, Dialog, PickerField, TextInput, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

function defaultExpectedCloseDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

interface ConvertToOpportunitySheetProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
}

// RN mirror of apps/web/components/crm/ConvertToOpportunityModal.tsx —
// same eligibility discipline: no client-side "does this lead already have
// an opportunity" pre-check, the server 400s with a clear message if so.
export function ConvertToOpportunitySheet({ open, onClose, lead }: ConvertToOpportunitySheetProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { convertLead } = useOpportunityPipelineViewModel();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState(defaultExpectedCloseDate());
  const [dealTypeLabel, setDealTypeLabel] = useState('Sale');

  useEffect(() => {
    if (!open) return;
    setName(`${lead.name} — opportunity`);
    setValue('');
    setExpectedCloseDate(defaultExpectedCloseDate());
    setDealTypeLabel('Sale');
  }, [open, lead.name]);

  function submit() {
    const parsedValue = Number(value);
    if (!name.trim()) {
      showToast('Enter a name for this opportunity.', 'error');
      return;
    }
    if (!value || Number.isNaN(parsedValue) || parsedValue <= 0) {
      showToast('Enter a valid value.', 'error');
      return;
    }
    const dealType: DealType = dealTypeLabel === 'Rent' ? 'rent' : 'sale';
    convertLead.mutate(
      { leadId: lead.id, input: { name: name.trim(), value: parsedValue, expectedCloseDate, dealType } },
      {
        onSuccess: (opportunity) => {
          showToast('Converted to opportunity.');
          onClose();
          navigation.navigate('OpportunityDetail', { opportunityId: opportunity.id });
        },
        onError: (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error'),
      },
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title="Convert to Opportunity">
      <View style={styles.form}>
        <TextInput label="Name" value={name} onChangeText={setName} autoFocus />
        <TextInput label="Value (PKR)" value={value} onChangeText={(v) => setValue(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="e.g. 15000000" />
        <PickerField value={dealTypeLabel} options={['Sale', 'Rent']} onChange={setDealTypeLabel} title="Deal type" />
        <TextInput label="Expected Close Date" value={expectedCloseDate} onChangeText={setExpectedCloseDate} placeholder="YYYY-MM-DD" />
        <Button label="Convert" onPress={submit} disabled={convertLead.isPending} style={styles.submit} />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing.md, paddingVertical: theme.spacing.xs },
  submit: { marginTop: theme.spacing.xs },
});
