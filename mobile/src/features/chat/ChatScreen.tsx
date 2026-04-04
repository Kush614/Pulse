import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, ChatThreadSummary, SuggestedPrompt } from '../../contracts';
import { useChatStore } from '../../state';
import { useRecentStoriesStore } from '../../state';
import {
  sendChatMessage,
  buildStorySystemPrompt,
  parseImpactAnalysis,
} from '../../api';
import ChatBubble from './ChatBubble';
import SuggestedPrompts from './SuggestedPrompts';
import { buildSuggestedPrompts, uid } from './chatHelpers';

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { storyId, threadId: existingThreadId } = route.params ?? {};

  const {
    threads,
    messagesByThread,
    addThread,
    updateThread,
    addMessage,
    setLastOpenedThread,
    getThreadForStory,
  } = useChatStore();

  const recentStories = useRecentStoriesStore((s) => s.stories);

  // Find existing thread or prepare to create one
  const existingThread =
    existingThreadId
      ? threads.find((t) => t.id === existingThreadId)
      : getThreadForStory(storyId);

  const [threadId] = useState(() => existingThread?.id ?? uid());
  const messages = messagesByThread[threadId] ?? [];

  // Find the story from recent stories
  const storyCtx = recentStories.find((s) => s.event.id === storyId);
  const event = storyCtx?.event;

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [prompts, setPrompts] = useState<SuggestedPrompt[]>([]);
  const listRef = useRef<FlatList>(null);

  // Build suggested prompts on mount
  useEffect(() => {
    if (event && messages.length === 0) {
      setPrompts(buildSuggestedPrompts(event));
    }
  }, [event?.id]);

  // Track last opened thread
  useEffect(() => {
    setLastOpenedThread(threadId);
  }, [threadId]);

  // Create thread record if it doesn't exist
  useEffect(() => {
    if (!existingThread && event) {
      const thread: ChatThreadSummary = {
        id: threadId,
        storyId,
        storyHeadline: event.headline,
        lastMessagePreview: '',
        messageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addThread(thread);
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !event) return;

      const userMsg: ChatMessage = {
        id: uid(),
        threadId,
        role: 'user',
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };
      addMessage(userMsg);
      setInput('');
      setPrompts([]);
      setSending(true);

      try {
        const systemPrompt = buildStorySystemPrompt(
          event.headline,
          event.brief,
          event.viewpoints.map((v) => v.take),
        );

        const history = messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        const reply = await sendChatMessage(
          systemPrompt,
          history,
          text.trim(),
        );

        const impactAnalysis = parseImpactAnalysis(reply);
        // Strip JSON block from displayed content if impact was extracted
        const cleanContent = impactAnalysis
          ? reply.replace(/\{[^}]*"ticker"[^}]*\}/, '').trim()
          : reply;

        const assistantMsg: ChatMessage = {
          id: uid(),
          threadId,
          role: 'assistant',
          content: cleanContent,
          createdAt: new Date().toISOString(),
          impactAnalysis,
        };
        addMessage(assistantMsg);

        updateThread(threadId, {
          lastMessagePreview: cleanContent.slice(0, 80),
          messageCount: messages.length + 2,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        const errorMsg: ChatMessage = {
          id: uid(),
          threadId,
          role: 'assistant',
          content: `Sorry, I couldn't process that. ${err.message ?? 'Please try again.'}`,
          createdAt: new Date().toISOString(),
        };
        addMessage(errorMsg);
      } finally {
        setSending(false);
      }
    },
    [event, messages, threadId],
  );

  const handlePromptSelect = (prompt: SuggestedPrompt) => {
    send(prompt.prompt);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Story context header */}
      {event && (
        <View style={styles.storyBanner}>
          <Text style={styles.storyTopic}>{event.topic}</Text>
          <Text style={styles.storyHeadline} numberOfLines={2}>
            {event.headline}
          </Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Start a discussion about this story
            </Text>
          </View>
        }
      />

      {/* Suggested prompts */}
      {prompts.length > 0 && messages.length === 0 && (
        <SuggestedPrompts prompts={prompts} onSelect={handlePromptSelect} />
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask about this story..."
          placeholderTextColor="#9AA5B1"
          value={input}
          onChangeText={setInput}
          multiline
          editable={!sending}
        />
        {sending ? (
          <ActivityIndicator color="#1A1A2E" style={styles.sendBtn} />
        ) : (
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => send(input)}
            disabled={!input.trim()}
          >
            <Ionicons
              name="send"
              size={22}
              color={input.trim() ? '#1A1A2E' : '#CBD5E0'}
            />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  storyBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  storyTopic: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9AA5B1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storyHeadline: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginTop: 2 },
  messageList: { paddingVertical: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#9AA5B1' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1A1A2E',
  },
  sendBtn: { marginLeft: 8, padding: 8 },
});
