import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from './tokens';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    boxShadow: '0px 8px 18px rgba(22, 32, 51, 0.1)',
  },
  label: {
    fontFamily: typography.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: palette.textSoft,
  },
  title: {
    fontFamily: typography.display,
    color: palette.text,
  },
  body: {
    fontFamily: typography.body,
    color: palette.textMuted,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  chipActive: {
    backgroundColor: palette.text,
    borderColor: palette.text,
  },
  chipText: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: palette.text,
  },
  chipTextActive: {
    color: palette.surface,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
    gap: spacing.md,
    boxShadow: '0px 4px 10px rgba(17, 24, 39, 0.05)',
  },
  button: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: palette.text,
  },
  buttonSecondary: {
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.line,
  },
  buttonPrimaryText: {
    color: palette.surface,
  },
  buttonSecondaryText: {
    color: palette.text,
  },
  buttonText: {
    fontFamily: typography.medium,
    fontSize: 14,
  },
  splitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: palette.surfaceMuted,
    gap: spacing.xs,
  },
  metricValue: {
    fontFamily: typography.mono,
    fontSize: 18,
    color: palette.text,
  },
  metricLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: palette.line,
  },
});

export function ScreenShell({ children }: { children: ReactNode }) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

export function HeroPanel({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <LinearGradient
      colors={[palette.heroStart, palette.heroEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Text style={styles.label}>{eyebrow}</Text>
      <Text style={[styles.title, { fontSize: 34, lineHeight: 38, marginTop: spacing.sm }]}>{title}</Text>
      <Text style={[styles.body, { marginTop: spacing.sm }]}>{body}</Text>
      {children}
    </LinearGradient>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function BodyText({ children, emphasized = false }: { children: ReactNode; emphasized?: boolean }) {
  return (
    <Text
      style={[
        styles.body,
        emphasized ? { color: palette.text, fontFamily: typography.medium } : null,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : null]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export function ActionButton({
  label,
  variant = 'primary',
  onPress,
}: {
  label: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, isPrimary ? styles.buttonPrimary : styles.buttonSecondary]}
    >
      <Text
        style={[
          styles.buttonText,
          isPrimary ? styles.buttonPrimaryText : styles.buttonSecondaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function MetricPair({
  firstLabel,
  firstValue,
  secondLabel,
  secondValue,
}: {
  firstLabel: string;
  firstValue: string;
  secondLabel: string;
  secondValue: string;
}) {
  return (
    <View style={styles.splitRow}>
      <View style={styles.metric}>
        <Text style={styles.metricValue}>{firstValue}</Text>
        <Text style={styles.metricLabel}>{firstLabel}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricValue}>{secondValue}</Text>
        <Text style={styles.metricLabel}>{secondLabel}</Text>
      </View>
    </View>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}
