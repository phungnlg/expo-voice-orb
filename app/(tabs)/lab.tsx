import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';
import { useMockAmplitude } from '../../src/amplitude';
import { Card, Segmented, SliderRow, TopBar } from '../../src/components/ui';
import { VoiceOrb } from '../../src/components/VoiceOrb';
import { ORB_STATES, STATE_LABEL } from '../../src/orbStates';
import { AmplitudeSource, useOrbLab } from '../../src/store';
import { color, font, radius, spacing } from '../../src/theme';

type Pane = 'states' | 'amplitude';

export default function Lab() {
  const [pane, setPane] = useState<Pane>('states');
  const {
    orbState,
    setOrbState,
    transitions,
    transitionLog,
    source,
    frequency,
    gain,
    smoothing,
    setSource,
    setFrequency,
    setGain,
    setSmoothing,
    hapticsEnabled,
    particleCount,
    reduceMotion,
  } = useOrbLab();

  const amplitude = useMockAmplitude({ source, frequency, gain, smoothing });

  // scrolling waveform history for the amplitude preview
  const [wave, setWave] = useState<number[]>(Array(60).fill(0));
  const [ampText, setAmpText] = useState('0.00');
  const waveRef = useRef(wave);
  useEffect(() => {
    const id = setInterval(() => {
      const next = [...waveRef.current.slice(1), amplitude.value];
      waveRef.current = next;
      setWave(next);
      setAmpText(amplitude.value.toFixed(2));
    }, 80);
    return () => clearInterval(id);
  }, [amplitude]);

  const trigger = (s: (typeof ORB_STATES)[number]) => {
    if (s === 'whisper' && hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setOrbState(s);
  };

  const W = 320;
  const H = 90;
  const points = wave
    .map((v, i) => `${(i / (wave.length - 1)) * W},${H - 6 - v * (H - 12)}`)
    .join(' ');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TopBar stateLabel={STATE_LABEL[orbState]} />
      <View style={styles.segmentWrap}>
        <Segmented<Pane>
          options={['states', 'amplitude']}
          value={pane}
          onChange={setPane}
          labels={{ states: 'State Lab', amplitude: 'Amplitude Lab' }}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {pane === 'states' ? (
          <>
            <View style={styles.preview}>
              <VoiceOrb
                state={orbState}
                amplitude={amplitude}
                transitions={transitions}
                size={130}
                particleCount={Math.min(particleCount, 90)}
                reduceMotion={reduceMotion}
              />
              <Text style={styles.previewLabel}>LIVE STATE</Text>
            </View>
            <Text style={styles.sectionTitle}>State Triggers</Text>
            <View style={styles.grid}>
              {ORB_STATES.map((s) => {
                const active = s === orbState;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.trigger,
                      s === 'complete' && styles.triggerWide,
                      active && styles.triggerActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => trigger(s)}
                  >
                    <Text style={[styles.triggerText, active && styles.triggerTextActive]}>
                      {STATE_LABEL[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.sectionTitle}>Transition Log</Text>
            <Card>
              {transitionLog.length === 0 ? (
                <Text style={styles.logEmpty}>
                  Trigger a state to see blended transitions logged here.
                </Text>
              ) : (
                transitionLog.map((e, i) => (
                  <View key={i} style={[styles.logRow, i > 0 && styles.logRowBorder]}>
                    <Text style={styles.logTime}>{e.at}</Text>
                    <Text style={styles.logText}>
                      {STATE_LABEL[e.from]} {'→'} {STATE_LABEL[e.to]}
                    </Text>
                    <Text style={styles.logMs}>{e.durationMs}ms blend</Text>
                  </View>
                ))
              )}
            </Card>
          </>
        ) : (
          <>
            <Card>
              <Text style={styles.waveTitle}>AMPLITUDE SIGNAL</Text>
              <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
                <Polyline
                  points={points}
                  fill="none"
                  stroke={color.accentDark}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.waveAmp}>
                {ampText} <Text style={styles.waveAmpUnit}>amp</Text>
              </Text>
            </Card>
            <View style={{ height: 16 }} />
            <Segmented<AmplitudeSource>
              options={['sine', 'noise', 'envelope']}
              value={source}
              onChange={setSource}
            />
            <View style={{ height: 16 }} />
            <Card>
              <SliderRow
                label="Frequency"
                value={frequency}
                min={0.1}
                max={3}
                format={(v) => `${v.toFixed(1)} Hz`}
                onChange={setFrequency}
              />
              <SliderRow
                label="Gain"
                value={gain}
                min={0}
                max={1}
                format={(v) => v.toFixed(1)}
                onChange={setGain}
              />
              <SliderRow
                label="Smoothing"
                value={smoothing}
                min={0}
                max={0.95}
                format={(v) => v.toFixed(2)}
                onChange={setSmoothing}
              />
            </Card>
            <View style={{ height: 16 }} />
            <Card style={styles.note}>
              <Text style={styles.noteText}>
                feeds the orb the same normalized 0..1 stream your audio pipeline
                will
              </Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  segmentWrap: { paddingHorizontal: spacing.edge, marginBottom: 8 },
  scroll: { paddingHorizontal: spacing.edge, paddingBottom: 32 },
  preview: { alignItems: 'center', marginVertical: 8 },
  previewLabel: {
    fontFamily: font.numeral,
    fontSize: 12,
    letterSpacing: 2,
    color: color.text2,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: font.bodySemiBold,
    fontSize: 20,
    color: color.text1,
    marginTop: 18,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  trigger: {
    width: '47%',
    paddingVertical: 15,
    borderRadius: radius.control,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
  },
  triggerWide: { width: '100%' },
  triggerActive: { backgroundColor: color.accentTint, borderColor: color.accentDark },
  triggerText: { fontFamily: font.bodyMedium, fontSize: 15, color: color.text2 },
  triggerTextActive: { color: color.accentDark },
  logEmpty: { fontFamily: font.body, fontSize: 13, color: color.text3 },
  logRow: { paddingVertical: 10 },
  logRowBorder: { borderTopWidth: 1, borderTopColor: color.border },
  logTime: { fontFamily: font.numeral, fontSize: 12, color: color.text3 },
  logText: { fontFamily: font.bodyMedium, fontSize: 15, color: color.text1, marginTop: 2 },
  logMs: { fontFamily: font.body, fontSize: 12, color: color.text3, marginTop: 2 },
  waveTitle: {
    fontFamily: font.numeral,
    fontSize: 13,
    letterSpacing: 2,
    color: color.text2,
    marginBottom: 8,
  },
  waveAmp: { fontFamily: font.display, fontSize: 28, color: color.text1, marginTop: 6 },
  waveAmpUnit: { fontFamily: font.body, fontSize: 14, color: color.accentDark },
  note: { backgroundColor: color.surfaceAlt },
  noteText: { fontFamily: font.body, fontSize: 13, color: color.text2, lineHeight: 19 },
});
