import React, { useState } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { color, font, radius, spacing } from '../theme';

export function TopBar({ stateLabel }: { stateLabel: string }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.wordmark}>LUMEN</Text>
      <View style={styles.stateChip}>
        <View style={styles.stateDot} />
        <Text style={styles.stateChipText}>{stateLabel}</Text>
      </View>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<string, string>;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {labels?.[opt] ?? opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const [width, setWidth] = useState(1);
  const ratio = (value - min) / (max - min);

  const handle = (e: GestureResponderEvent) => {
    const x = Math.min(Math.max(e.nativeEvent.locationX, 0), width);
    onChange(min + (x / width) * (max - min));
  };

  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{format(value)}</Text>
      </View>
      <View
        style={styles.sliderTouch}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handle}
        onResponderMove={handle}
      >
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${ratio * 100}%` }]} />
        </View>
        <View style={[styles.sliderThumb, { left: Math.max(0, ratio * width - 10) }]} />
      </View>
    </View>
  );
}

export function ToggleRow({
  label,
  value,
  onChange,
  detail,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  detail?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleRight}>
        {detail ? <Text style={styles.toggleDetail}>{detail}</Text> : null}
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: color.surfaceAlt, true: color.accentFill }}
          thumbColor={value ? color.accentDark : color.text2}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.edge,
    paddingVertical: 12,
  },
  wordmark: {
    fontFamily: font.display,
    fontSize: 14,
    letterSpacing: 3,
    color: color.text1,
  },
  stateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.accentTint,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  stateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.accentDark },
  stateChipText: { fontFamily: font.bodyMedium, fontSize: 13, color: color.accentDark },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    padding: 16,
  },
  sectionTitle: {
    fontFamily: font.bodySemiBold,
    fontSize: 20,
    color: color.text1,
    marginBottom: 12,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.control - 4,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: color.accentTint },
  segmentText: { fontFamily: font.bodyMedium, fontSize: 14, color: color.text2 },
  segmentTextActive: { color: color.accentDark },
  sliderRow: { marginVertical: 10 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sliderLabel: { fontFamily: font.body, fontSize: 15, color: color.text1 },
  sliderValue: { fontFamily: font.numeral, fontSize: 15, color: color.text1 },
  sliderTouch: { height: 28, justifyContent: 'center' },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: color.surfaceAlt,
    overflow: 'hidden',
  },
  sliderFill: { height: 4, backgroundColor: color.accentDark },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: color.text1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleLabel: { fontFamily: font.body, fontSize: 15, color: color.text1 },
  toggleRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleDetail: { fontFamily: font.numeral, fontSize: 14, color: color.accentDark },
});
