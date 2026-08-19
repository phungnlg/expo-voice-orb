import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMockAmplitude } from '../src/amplitude';
import { VoiceOrb } from '../src/components/VoiceOrb';
import { DEFAULT_TRANSITIONS } from '../src/orbStates';
import { color, font, radius, spacing } from '../src/theme';

export default function Onboarding() {
  const amplitude = useMockAmplitude({
    source: 'sine',
    frequency: 0.4,
    gain: 0.6,
    smoothing: 0.4,
  });

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.wordmark}>LUMEN</Text>
      <View style={styles.hero}>
        <VoiceOrb
          state="listening"
          amplitude={amplitude}
          transitions={DEFAULT_TRANSITIONS}
          size={320}
          particleCount={1200}
        />
      </View>
      <View style={styles.bottom}>
        <Text style={styles.title}>Meet the Lumen orb</Text>
        <Text style={styles.subtitle}>
          Seven audio-reactive states, one living component
        </Text>
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => router.replace('/(tabs)/orb')}
        >
          <Text style={styles.ctaText}>Enter the lab</Text>
        </TouchableOpacity>
        <Text style={styles.caption}>Runs on iOS and Android</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  wordmark: {
    fontFamily: font.display,
    fontSize: 14,
    letterSpacing: 3,
    color: color.text1,
    textAlign: 'center',
    marginTop: 16,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: spacing.edge, paddingBottom: 24, alignItems: 'center' },
  title: {
    fontFamily: font.display,
    fontSize: 32,
    letterSpacing: -0.5,
    color: color.text1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 16,
    color: color.text2,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 28,
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: color.accentFill,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { fontFamily: font.bodySemiBold, fontSize: 16, color: '#FFFFFF' },
  caption: { fontFamily: font.body, fontSize: 12, color: color.text3, marginTop: 14 },
});
