import { memo } from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { theme } from '@jayedaad/ui-native';

// Stub — real layout/copy comes from the Figma design once provided.
export const AboutUsScreen = memo(function AboutUsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>About Us — awaiting design</Text>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  text: { color: theme.colors.text },
});
