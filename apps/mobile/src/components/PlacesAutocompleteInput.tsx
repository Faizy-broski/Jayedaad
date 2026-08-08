import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { TextInput, theme } from '@jayedaad/ui-native';

interface PlacePrediction {
  place_id: string;
  description: string;
}

// Mobile counterpart to apps/web's PlacesAutocompleteInput.tsx — no RN
// autocomplete library exists in this codebase and none is needed: a plain
// fetch() against Google's Places Autocomplete Web Service works fine from
// React Native (no CORS restriction outside a browser), keeping with this
// app's discipline of avoiding extra native dependencies (see
// CalendarScreen's "no calendar-grid library... no-Reanimated/
// no-gesture-handler discipline" comment). Falls back to a plain TextInput
// with no suggestions if EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is unset, same
// "inert without a key" convention as the web version.
export function PlacesAutocompleteInput({
  label,
  value,
  onChange,
  placeholder,
  editable = true,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
}) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Selecting a prediction fires one more onChangeText internally on some
  // RN versions before blur — suppress the next fetch so the dropdown
  // doesn't immediately reopen with the just-selected text.
  const suppressNextFetch = useRef(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function handleChangeText(text: string) {
    onChange(text);
    if (!apiKey) return;

    if (suppressNextFetch.current) {
      suppressNextFetch.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setPredictions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(text)}&components=country:pk&types=geocode&key=${encodeURIComponent(apiKey)}`;

      fetch(url, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setPredictions(data.status === 'OK' ? data.predictions : []))
        .catch(() => {
          // AbortError from a superseded keystroke is expected — anything
          // else just means suggestions stay empty, field is still usable.
        })
        .finally(() => setLoading(false));
    }, 300);
  }

  function handleSelect(prediction: PlacePrediction) {
    suppressNextFetch.current = true;
    onChange(prediction.description);
    setPredictions([]);
  }

  const showDropdown = focused && (loading || predictions.length > 0);

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleChangeText}
        editable={editable}
        placeholder={apiKey ? placeholder : `${placeholder ?? ''} (type freely — suggestions unavailable)`.trim()}
        onFocus={() => setFocused(true)}
        // Delayed so a suggestion's onPress still registers before the
        // dropdown unmounts — same pattern PickerField-style dropdowns in
        // this app use.
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {showDropdown && (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            predictions.map((p) => (
              <Pressable key={p.place_id} style={styles.row} onPress={() => handleSelect(p)}>
                <Text style={styles.rowText} numberOfLines={2}>
                  {p.description}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 10 },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    maxHeight: 220,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 20,
  },
  loadingRow: { paddingVertical: theme.spacing.md, alignItems: 'center' },
  row: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  rowText: { fontSize: 13, color: theme.colors.text },
});
