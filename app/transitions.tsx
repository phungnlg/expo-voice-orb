import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Card } from '../src/components/ui';
import { EasingName, STATE_LABEL } from '../src/orbStates';
import { useOrbLab } from '../src/store';
import { color, font, radius, spacing } from '../src/theme';

const CURVES: Record<EasingName, string> = {
  easeInOut: 'M 2 30 C 14 30 18 2 34 2',
  spring: 'M 2 30 C 10 2 14 40 20 12 C 24 24 30 14 34 16',
};

export default function Transitions() {
  const { transitions, updateTransition } = useOrbLab();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      {transitions.map((t, i) => (
        <Card key={i} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.label}>
              {t.from === 'any' ? 'Any' : STATE_LABEL[t.from]} {'→'} {STATE_LABEL[t.to]}
            </Text>
            <Svg width={36} height={32} viewBox="0 0 36 32">
              <Path
                d={CURVES[t.easing]}
                stroke={color.support}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <View style={styles.controls}>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  updateTransition(i, { durationMs: Math.max(100, t.durationMs - 40) })
                }
              >
                <MaterialCommunityIcons name="minus" size={18} color={color.text2} />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{t.durationMs} ms</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  updateTransition(i, { durationMs: Math.min(1500, t.durationMs + 40) })
                }
              >
                <MaterialCommunityIcons name="plus" size={18} color={color.text2} />
              </TouchableOpacity>
            </View>
            <View style={styles.easings}>
              {(['easeInOut', 'spring'] as EasingName[]).map((e) => {
                const active = t.easing === e;
                return (
                  <TouchableOpacity
                    key={e}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => updateTransition(i, { easing: e })}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {e}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  scroll: { padding: spacing.edge, paddingBottom: 40, gap: 12 },
  card: { marginBottom: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: font.bodyMedium, fontSize: 16, color: color.text1 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontFamily: font.numeral,
    fontSize: 15,
    color: color.text1,
    minWidth: 64,
    textAlign: 'center',
  },
  easings: { flexDirection: 'row', gap: 8 },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: color.surfaceAlt,
  },
  chipActive: { backgroundColor: color.accentTint },
  chipText: { fontFamily: font.bodyMedium, fontSize: 13, color: color.text2 },
  chipTextActive: { color: color.accentDark },
});
