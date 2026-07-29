import { FlatList, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { useLeadInboxViewModel } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';

// Same viewmodel as apps/web's (agent)/crm page.tsx — mobile agents get the
// same optimistic-update CRM behavior as the web J.Dashboard [Dev Instr §1].
export function AgentCRMScreen() {
  const { leads, isLoading, updateStatus } = useLeadInboxViewModel({});
  const { showToast } = useToast();

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && <Text>Loading…</Text>}
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No leads yet.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Button
              label="Mark Contacted"
              variant="secondary"
              onPress={() =>
                updateStatus.mutate(
                  { leadId: item.id, status: 'contacted' },
                  {
                    onSuccess: () => showToast('Lead marked as contacted.'),
                    onError: () => showToast('Something went wrong — please try again.', 'error'),
                  },
                )
              }
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
  },
  name: { fontWeight: '600' },
  status: { color: theme.colors.muted, fontSize: 12, textTransform: 'capitalize' },
  empty: { color: theme.colors.muted },
});
