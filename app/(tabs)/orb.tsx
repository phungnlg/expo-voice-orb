import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMockAmplitude } from '../../src/amplitude';
import { TopBar } from '../../src/components/ui';
import { VoiceOrb } from '../../src/components/VoiceOrb';
import {
  ORB_STATES,
  ORB_VISUALS,
  OrbState,
  STATE_CAPTION,
  STATE_LABEL,
} from '../../src/orbStates';
import { useOrbLab } from '../../src/store';
import { color, font, spacing } from '../../src/theme';

const FLOW: OrbState[] = ORB_STATES;

export default function OrbStage() {
  const {
    orbState,
    setOrbState,
    transitions,
    source,
    frequency,
    gain,
    smoothing,
    particleCount,
    hapticsEnabled,
    reduceMotion,
    showFps,
  } = useOrbLab();

  // optional deep-link state override, e.g. exp://.../(tabs)/orb?state=speaking
  const params = useLocalSearchParams<{ state?: string }>();
  useEffect(() => {
    const s = params.state as OrbState | undefined;
    if (s && ORB_STATES.includes(s)) setOrbState(s);
  }, [params.state]);

  const audioActive = ORB_VISUALS[orbState].audioDrive > 0;
  const amplitude = useMockAmplitude({
    source: orbState === 'speaking' || orbState === 'whisper' ? 'envelope' : source,
    frequency,
    gain: orbState === 'whisper' ? gain * 0.35 : gain,
    smoothing,
    running: audioActive,
  });

  const [ampText, setAmpText] = useState('0.00');
  const [fps, setFps] = useState(60);
  const frames = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setAmpText(amplitude.value.toFixed(2)), 200);
    return () => clearInterval(id);
  }, [amplitude]);

  useEffect(() => {
    if (!showFps) return;
    let raf: number;
    const tick = () => {
      frames.current += 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const id = setInterval(() => {
      setFps(frames.current);
      frames.current = 0;
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [showFps]);

  const advance = () => {
    const next = FLOW[(FLOW.indexOf(orbState) + 1) % FLOW.length];
    // the whisper state fires a brief haptic pulse immediately BEFORE the
    // whispered response begins playing
    if (next === 'whisper' && hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setOrbState(next);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TopBar stateLabel={STATE_LABEL[orbState]} />
      <Pressable style={styles.stage} onPress={advance}>
        <VoiceOrb
          state={orbState}
          amplitude={amplitude}
          transitions={transitions}
          size={340}
          particleCount={particleCount}
          reduceMotion={reduceMotion}
        />
      </Pressable>
      <View style={styles.readouts}>
        <Text style={styles.caption}>{STATE_CAPTION[orbState]}</Text>
        <Text style={styles.amp}>amp {audioActive ? ampText : '0.00'}</Text>
        <View style={styles.meterTrack}>
          <View
            style={[
              styles.meterFill,
              { width: `${Math.round(parseFloat(audioActive ? ampText : '0') * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.hint}>tap the orb to advance the flow</Text>
      </View>
      {showFps ? <Text style={styles.fps}>{fps} fps</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  readouts: { alignItems: 'center', paddingBottom: 28, paddingHorizontal: spacing.edge },
  caption: { fontFamily: font.body, fontSize: 14, color: color.text2 },
  amp: { fontFamily: font.numeral, fontSize: 16, color: color.text1, marginTop: 6 },
  meterTrack: {
    alignSelf: 'stretch',
    height: 4,
    borderRadius: 2,
    backgroundColor: color.surfaceAlt,
    marginTop: 10,
    overflow: 'hidden',
  },
  meterFill: { height: 4, backgroundColor: color.accentDark },
  hint: { fontFamily: font.body, fontSize: 12, color: color.text3, marginTop: 14 },
  fps: {
    position: 'absolute',
    top: 64,
    left: spacing.edge,
    fontFamily: font.numeral,
    fontSize: 12,
    color: color.support,
  },
});
