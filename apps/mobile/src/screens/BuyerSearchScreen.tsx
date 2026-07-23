import { useState } from 'react';
import { FlatList, SafeAreaView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useListingSearchViewModel } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-native';

// Same viewmodel as apps/web's (buyer)/search page.tsx — only the View differs.
export function BuyerSearchScreen() {
  const [city, setCity] = useState('');
  const [submittedCity, setSubmittedCity] = useState<string | undefined>(undefined);
  const { listings, isLoading } = useListingSearchViewModel({ city: submittedCity });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City (e.g. Lahore)"
          style={styles.input}
        />
        <Button label="Search" onPress={() => setSubmittedCity(city || undefined)} />
      </View>

      {isLoading && <Text>Loading…</Text>}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No verified listings yet.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>
              {item.area}, {item.city} — PKR {item.price}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 12 },
  card: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 8 },
  title: { fontWeight: '600' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 4 },
  empty: { color: '#64748b' },
});
