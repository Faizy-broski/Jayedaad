import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PAKISTAN_CITIES } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';

// Same searchable-list-modal pattern as ui-native's PickerField, kept
// separate so callers can pair it with their own custom-styled trigger
// (HomeScreen's pin+text header row, SearchFilterSheet's settings-style
// City row) instead of PickerField's fixed bordered-rectangle trigger.
export function CityPickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = query ? PAKISTAN_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())) : PAKISTAN_CITIES;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Select City</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </Pressable>
        </View>
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search city"
          placeholderTextColor={theme.colors.muted}
          style={styles.search}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => onSelect(item)}>
              <Text style={styles.rowText}>{item}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: theme.colors.bg, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  title: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  search: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  row: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowText: { fontSize: 15, color: theme.colors.text },
});
