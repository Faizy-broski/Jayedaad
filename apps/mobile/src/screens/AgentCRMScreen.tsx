import { FlatList, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { useLeadInboxViewModel } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-native';

// Same viewmodel as apps/web's (agent)/crm page.tsx — mobile agents get the
// same optimistic-update CRM behavior as the web J.Dashboard [Dev Instr §1].
export function AgentCRMScreen() {
  const { leads, isLoading, updateStatus } = useLeadInboxViewModel({});

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
              onPress={() => updateStatus.mutate({ leadId: item.id, status: 'contacted' })}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
  },
  name: { fontWeight: '600' },
  status: { color: '#64748b', fontSize: 12, textTransform: 'capitalize' },
  empty: { color: '#64748b' },
});
