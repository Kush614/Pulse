import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DecisionAction, DecisionRecord } from '../../contracts';
import { useDecisionStore, useChatStore, useRecentStoriesStore } from '../../state';
import ActionPicker from './ActionPicker';
import { uid } from '../chat/chatHelpers';

export default function DecisionScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { storyId, decisionId } = route.params ?? {};

  const { decisions, addDecision, updateDecision } = useDecisionStore();
  const chatStore = useChatStore();
  const recentStories = useRecentStoriesStore((s) => s.stories);

  // Load existing decision if editing
  const existing = decisionId
    ? decisions.find((d) => d.id === decisionId)
    : undefined;

  const storyCtx = recentStories.find((s) => s.event.id === storyId);
  const event = storyCtx?.event;

  // Linked chat thread
  const linkedThread = chatStore.getThreadForStory(storyId);
  const linkedMessages = linkedThread
    ? chatStore.messagesByThread[linkedThread.id] ?? []
    : [];
  const chatSummary = linkedMessages.length
    ? `${linkedMessages.length} messages — last: "${linkedMessages[linkedMessages.length - 1].content.slice(0, 60)}..."`
    : undefined;

  const [action, setAction] = useState<DecisionAction | null>(
    existing?.action ?? null,
  );
  const [ticker, setTicker] = useState(existing?.ticker ?? '');
  const [note, setNote] = useState(existing?.note ?? '');

  const canSave = action !== null;

  const handleSave = () => {
    if (!action || !event) return;

    const now = new Date().toISOString();
    if (existing) {
      updateDecision(existing.id, {
        action,
        ticker: ticker.trim().toUpperCase() || undefined,
        note: note.trim(),
        linkedThreadId: linkedThread?.id,
        linkedChatSummary: chatSummary,
      });
    } else {
      const record: DecisionRecord = {
        id: uid(),
        storyId,
        storyHeadline: event.headline,
        action,
        ticker: ticker.trim().toUpperCase() || undefined,
        note: note.trim(),
        linkedThreadId: linkedThread?.id,
        linkedChatSummary: chatSummary,
        createdAt: now,
        updatedAt: now,
      };
      addDecision(record);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Story context */}
      {event && (
        <View style={styles.storyCard}>
          <Text style={styles.storyTopic}>{event.topic}</Text>
          <Text style={styles.storyHeadline}>{event.headline}</Text>
          <Text style={styles.storyBrief} numberOfLines={3}>
            {event.brief}
          </Text>
        </View>
      )}

      {/* Action picker */}
      <ActionPicker selected={action} onSelect={setAction} />

      {/* Ticker */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Ticker (optional)</Text>
        <TextInput
          style={styles.tickerInput}
          placeholder="e.g. AAPL"
          placeholderTextColor="#CBD5E0"
          value={ticker}
          onChangeText={setTicker}
          autoCapitalize="characters"
          maxLength={10}
        />
      </View>

      {/* Personal note */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Your thesis / note</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Why are you making this decision?"
          placeholderTextColor="#CBD5E0"
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Linked chat summary */}
      {linkedThread && (
        <View style={styles.linkedSection}>
          <View style={styles.linkedHeader}>
            <Ionicons name="chatbubble-outline" size={16} color="#9AA5B1" />
            <Text style={styles.linkedLabel}>Linked discussion</Text>
          </View>
          <Text style={styles.linkedPreview}>
            {chatSummary ?? 'No messages yet'}
          </Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Chat', {
                storyId,
                threadId: linkedThread.id,
              })
            }
          >
            <Text style={styles.linkedLink}>Open thread</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Related tickers from story */}
      {event && event.relatedTickers.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.fieldLabel}>Related tickers</Text>
          <View style={styles.tickerRow}>
            {event.relatedTickers.map((t) => (
              <View key={t.symbol} style={styles.tickerChip}>
                <Text style={styles.tickerSymbol}>{t.symbol}</Text>
                <Text
                  style={[
                    styles.tickerChange,
                    { color: t.change >= 0 ? '#34C759' : '#FF3B30' },
                  ]}
                >
                  {t.change >= 0 ? '+' : ''}
                  {t.change}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Text style={styles.saveBtnText}>
          {existing ? 'Update Decision' : 'Save Decision'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 40 },
  storyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  storyTopic: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9AA5B1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storyHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 4,
  },
  storyBrief: { fontSize: 13, color: '#4A5568', marginTop: 6, lineHeight: 18 },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9AA5B1',
    marginBottom: 6,
  },
  tickerInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A2E',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A2E',
    minHeight: 100,
  },
  linkedSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  linkedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkedLabel: { fontSize: 13, fontWeight: '600', color: '#9AA5B1' },
  linkedPreview: { fontSize: 13, color: '#4A5568', marginTop: 6 },
  linkedLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4DA3FF',
    marginTop: 6,
  },
  relatedSection: { marginBottom: 20 },
  tickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tickerSymbol: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  tickerChange: { fontSize: 12, fontWeight: '500' },
  saveBtn: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
