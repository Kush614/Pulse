import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ActionButton,
  BodyText,
  Card,
  ChipGroup,
  HeroPanel,
  MetricPair,
  ScreenShell,
  SectionLabel,
  ToggleChip,
} from '../../theme/ui';
import { palette, spacing, typography } from '../../theme/tokens';
import { DEFAULT_FOCUS_PROFILE, focusOptions, type FocusProfile, type Horizon } from '../story/types';

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  helper: {
    fontFamily: typography.body,
    fontSize: 13,
    color: palette.textMuted,
    lineHeight: 20,
  },
  horizonRow: {
    gap: spacing.sm,
  },
  horizonCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 18,
    padding: spacing.md,
    backgroundColor: palette.surface,
    gap: spacing.sm,
  },
  horizonCardActive: {
    borderColor: palette.horizon,
    backgroundColor: '#F4EFFF',
  },
  horizonLabel: {
    fontFamily: typography.mono,
    color: palette.text,
    fontSize: 15,
  },
  horizonBody: {
    fontFamily: typography.body,
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  footerNote: {
    fontFamily: typography.body,
    fontSize: 12,
    color: palette.textSoft,
    lineHeight: 18,
  },
});

export function FocusSetupScreen({
  initialProfile = DEFAULT_FOCUS_PROFILE,
  onContinue,
}: {
  initialProfile?: FocusProfile;
  onContinue: (profile: FocusProfile) => void;
}) {
  const [profile, setProfile] = useState<FocusProfile>(initialProfile);

  const toggleValue = (key: 'sectors' | 'tickers' | 'topics', value: string) => {
    const currentValues = profile[key];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    setProfile({
      ...profile,
      [key]: nextValues,
    });
  };

  const setHorizon = (horizon: Horizon) => {
    setProfile({
      ...profile,
      horizon,
    });
  };

  return (
    <ScreenShell>
      <HeroPanel
        eyebrow="PULSE Setup"
        title="Shape a feed that thinks like your morning analyst."
        body="Select the sectors, tickers, and themes you care about. Person 1 owns this first impression, so the feed is fully personalized before any API or chat integration lands."
      >
        <View style={{ marginTop: spacing.lg }}>
          <MetricPair
            firstLabel="Tracked sectors"
            firstValue={String(profile.sectors.length).padStart(2, '0')}
            secondLabel="Active tickers"
            secondValue={String(profile.tickers.length).padStart(2, '0')}
          />
        </View>
      </HeroPanel>

      <Card>
        <View style={styles.section}>
          <SectionLabel>Sector Focus</SectionLabel>
          <Text style={styles.helper}>Choose the macro lanes you want ranking weight on.</Text>
          <ChipGroup>
            {focusOptions.sectors.map((sector) => (
              <ToggleChip
                key={sector}
                label={sector}
                active={profile.sectors.includes(sector)}
                onPress={() => toggleValue('sectors', sector)}
              />
            ))}
          </ChipGroup>
        </View>
      </Card>

      <Card>
        <View style={styles.section}>
          <SectionLabel>Ticker Bias</SectionLabel>
          <Text style={styles.helper}>Pin names you already own or names you monitor closely.</Text>
          <ChipGroup>
            {focusOptions.tickers.map((ticker) => (
              <ToggleChip
                key={ticker}
                label={ticker}
                active={profile.tickers.includes(ticker)}
                onPress={() => toggleValue('tickers', ticker)}
              />
            ))}
          </ChipGroup>
        </View>
      </Card>

      <Card>
        <View style={styles.section}>
          <SectionLabel>Story Types</SectionLabel>
          <Text style={styles.helper}>These tags shape which headlines float to the top first.</Text>
          <ChipGroup>
            {focusOptions.topics.map((topic) => (
              <ToggleChip
                key={topic}
                label={topic}
                active={profile.topics.includes(topic)}
                onPress={() => toggleValue('topics', topic)}
              />
            ))}
          </ChipGroup>
        </View>
      </Card>

      <Card>
        <View style={styles.section}>
          <SectionLabel>Risk Horizon</SectionLabel>
          <Text style={styles.helper}>Keep the app biased toward today, this week, or the next month.</Text>
          <View style={styles.horizonRow}>
            {focusOptions.horizons.map((horizon) => (
              <View
                key={horizon}
                style={[styles.horizonCard, profile.horizon === horizon ? styles.horizonCardActive : null]}
              >
                <Text style={styles.horizonLabel}>{horizon}</Text>
                <Text style={styles.horizonBody}>
                  {horizon === '24H'
                    ? 'Higher urgency and shorter-term risk surfaces.'
                    : horizon === '1W'
                      ? 'Balanced read on immediate and medium effects.'
                      : 'Favor thematic moves and follow-through patterns.'}
                </Text>
                <ActionButton
                  label={profile.horizon === horizon ? 'Selected' : 'Use This'}
                  variant={profile.horizon === horizon ? 'primary' : 'secondary'}
                  onPress={() => setHorizon(horizon)}
                />
              </View>
            ))}
          </View>
        </View>
      </Card>

      <BodyText>
        The live app will persist this profile and use it to rank stories. For Person 1, the flow is intentionally mock-driven so the UI is complete before integration starts.
      </BodyText>

      <ActionButton label="Build My Feed" onPress={() => onContinue(profile)} />
      <Text style={styles.footerNote}>
        Chat, saved decisions, and resume history are intentionally deferred to Person 2. This screen still previews the exact inputs that will drive those flows later.
      </Text>
    </ScreenShell>
  );
}
