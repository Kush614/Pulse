import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../../contracts';
import ImpactAnalysisBlock from './ImpactAnalysisBlock';

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.row,
        isUser ? styles.rowUser : styles.rowAssistant,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text
          style={[
            styles.text,
            isUser ? styles.textUser : styles.textAssistant,
          ]}
        >
          {message.content}
        </Text>
        {message.impactAnalysis && (
          <ImpactAnalysisBlock data={message.impactAnalysis} />
        )}
      </View>
      <Text style={styles.time}>
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 4, paddingHorizontal: 16, maxWidth: '85%' },
  rowUser: { alignSelf: 'flex-end' },
  rowAssistant: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: '#1A1A2E' },
  bubbleAssistant: { backgroundColor: '#F0F4F8' },
  text: { fontSize: 15, lineHeight: 21 },
  textUser: { color: '#FFFFFF' },
  textAssistant: { color: '#1A1A2E' },
  time: { fontSize: 11, color: '#9AA5B1', marginTop: 2, paddingHorizontal: 4 },
});
