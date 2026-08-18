import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, SliderRow, ToggleRow, TopBar } from '../../src/components/ui';
import { STATE_LABEL } from '../../src/orbStates';
import { useOrbLab } from '../../src/store';
import { color, font, spacing } from '../../src/theme';

export default function Settings() {
  const {
    orbState,
    particleCount,
    setParticleCount,
    showFps,
    setShowFps,
    reduceMotion,
    setReduceMotion,
    hapticsEnabled,
    setHapticsEnabled,
  } = useOrbLab();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TopBar stateLabel={STATE_LABEL[orbState]} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.group}>Performance</Text>
        <Card>
          <SliderRow
            label="Particle count"
            value={particleCount}
            min={200}
            max={1100}
            format={(v) => `${Math.round(v)}`}
            onChange={(v) => setParticleCount(Math.round(v))}
          />
          <ToggleRow label="Show FPS overlay" value={showFps} onChange={setShowFps} />
          <ToggleRow label="Reduce motion" value={reduceMotion} onChange={setReduceMotion} />
        </Card>

        <Text style={styles.group}>Feedback</Text>
        <Card>
          <ToggleRow label="Haptics" value={hapticsEnabled} onChange={setHapticsEnabled} />
        </Card>

        <Text style={styles.group}>Motion</Text>
        <Card>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => router.push('/transitions')}
          >
            <Text style={styles.rowLabel}>Transition tuner</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={color.text3} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.group}>About</Text>
        <Card>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Lumen Orb Lab v0.1.0</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  scroll: { paddingHorizontal: spacing.edge, paddingBottom: 32 },
  title: { fontFamily: font.display, fontSize: 30, color: color.text1, marginBottom: 8 },
  group: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.text2,
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: { fontFamily: font.body, fontSize: 15, color: color.text1 },
});
