import { memo, useState } from 'react';
import { ScrollView, Text, TextInput as RNTextInput, TextInputProps, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COUNTRIES, getMaxPhoneDigits, useContactViewModel } from '@jayedaad/core';
import { CountryCodeField, theme, useToast } from '@jayedaad/ui-native';

export const ContactScreen = memo(function ContactScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('92');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const { submit } = useContactViewModel();
  const { showToast } = useToast();

  function handleSend() {
    if (!name.trim() || !phone.trim() || !email.trim() || !message.trim()) {
      showToast('Please fill in your name, phone, email, and message.', 'error');
      return;
    }
    submit.mutate(
      { name, phone: `+${dialCode}${phone}`, email, subject, message },
      {
        onSuccess: () => {
          showToast('Message sent — we’ll get back to you soon.');
          setName('');
          setPhone('');
          setEmail('');
          setSubject('General Inquiry');
          setMessage('');
        },
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Premium Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrapper}>
            <Ionicons name="paper-plane" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Let's Talk About Everything!</Text>
          <Text style={styles.heroSubtitle}>
            Have a question or need assistance? Get in touch with us here. We'd love to address any and all concerns you may have.
          </Text>
        </View>

        {/* Seamless Form Section */}
        <View style={styles.formSection}>
          <Field 
            label="Your Name" 
            required 
            placeholder="How should we address you?" 
            value={name} 
            onChangeText={setName} 
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCodeWrapper}>
                <CountryCodeField countries={COUNTRIES} value={dialCode} onChange={setDialCode} />
              </View>
              <RNTextInput
                style={[styles.input, styles.phoneInput]}
                value={phone}
                maxLength={getMaxPhoneDigits(dialCode)}
                onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
                keyboardType="number-pad"
                placeholder="3XXXXXXXXX"
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          </View>

          <Field
            label="Email Address"
            required
            placeholder="Your best email address?"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Field 
            label="Subject" 
            required 
            value={subject} 
            onChangeText={setSubject} 
          />
          
          <Field
            label="Your Message"
            required
            placeholder="What would you like to say?"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          {/* Premium Gold Action Button */}
          <Pressable disabled={submit.isPending} onPress={handleSend} style={styles.submitButtonWrapper}>
            <LinearGradient
              colors={theme.gradients.gold.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goldButton}
            >
              <Text style={styles.goldButtonText}>{submit.isPending ? 'Sending…' : 'Send Your Question'}</Text>
            </LinearGradient>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
});

function Field({
  label,
  required,
  ...inputProps
}: {
  label: string;
  required?: boolean;
} & Omit<TextInputProps, 'style' | 'placeholderTextColor'>) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <RNTextInput
        style={[styles.input, inputProps.multiline && styles.inputMultiline]}
        placeholderTextColor={theme.colors.muted}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: theme.colors.bg 
  },
  content: { 
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 32,
  },
  
  // Hero Section
  hero: { 
    alignItems: 'center',
    paddingTop: 16,
  },
  heroIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.secondaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: theme.colors.text, 
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: { 
    fontSize: 14, 
    color: theme.colors.muted, 
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  
  // Form Section
  formSection: { 
    gap: 20 
  },
  fieldGroup: { 
    gap: 8 
  },
  fieldLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: { 
    color: theme.colors.accent 
  },
  input: {
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  inputMultiline: { 
    minHeight: 120, 
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  
  // Phone Row Fix
  phoneRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  countryCodeWrapper: {
    width: 110, 
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  phoneInput: { 
    flex: 1 
  },

  // Premium Button
  submitButtonWrapper: {
    marginTop: 12,
  },
  goldButton: {
    borderRadius: theme.radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldButtonText: {
    color: theme.colors.bg,
    fontWeight: '700',
    fontSize: 15,
  },
});