import { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';

interface Message {
  id: string;
  from: 'agent' | 'me';
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', from: 'agent', text: 'Hi! Priya from Perfect Cleaners. How can I help?', time: '12:42' },
  { id: '2', from: 'me',    text: 'Hi — can I move my Tuesday booking to Wednesday?', time: '12:43' },
  { id: '3', from: 'agent', text: 'Of course. I can see #PC-2058 — Premium Wash + Interior, Tue 2:00 PM. What time on Wednesday?', time: '12:43' },
  { id: '4', from: 'me',    text: '2 PM works again', time: '12:44' },
  { id: '5', from: 'agent', text: 'Done. New booking confirmed for Wed 29 May at 2:00 PM. Anything else?', time: '12:44' },
];

function AgentAvatar() {
  return (
    <View style={s.agentAvatar}>
      <Text style={s.agentAvatarText}>P</Text>
    </View>
  );
}

export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages(prev => [...prev, { id: String(Date.now()), from: 'me', text, time }]);
    setDraft('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.fg} strokeWidth={1.5} />
        </TouchableOpacity>
        <AgentAvatar />
        <View style={s.agentInfo}>
          <Text style={s.agentName}>Priya · Support</Text>
          <View style={s.onlineRow}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Active now</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={s.messageList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: m }) => (
          <View style={[s.msgRow, m.from === 'me' && s.msgRowMe]}>
            <View style={[
              s.bubble,
              m.from === 'me' ? s.bubbleMe : s.bubbleAgent,
            ]}>
              <Text style={s.bubbleText}>{m.text}</Text>
            </View>
            <Text style={[s.msgTime, m.from === 'me' && s.msgTimeMe]}>
              {m.time}
            </Text>
          </View>
        )}
      />

      {/* Input bar */}
      <View style={[s.inputBar, { borderTopColor: colors.line }]}>
        <TextInput
          style={s.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message"
          placeholderTextColor={colors.fg3}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[s.sendBtn, draft.trim() && s.sendBtnActive]}
          onPress={sendMessage}
          activeOpacity={0.8}
        >
          <Send size={15} color={draft.trim() ? colors.ink : colors.fg3} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: radii.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  agentAvatar: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.sageHi,
    alignItems: 'center', justifyContent: 'center',
  },
  agentAvatarText: {
    fontFamily: typography.sansSemiBold, fontSize: 15, color: '#fff',
  },
  agentInfo: { flex: 1 },
  agentName: {
    fontFamily: typography.sansSemiBold, fontSize: 14, color: colors.fg,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: {
    width: 6, height: 6, borderRadius: 999, backgroundColor: colors.success,
  },
  onlineText: {
    fontFamily: typography.sans, fontSize: 11.5, color: colors.success,
  },

  messageList: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  msgRow: {
    alignItems: 'flex-start',
    gap: 3,
  },
  msgRowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleAgent: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  bubbleMe:    { backgroundColor: colors.sageHi },
  bubbleText: {
    fontFamily: typography.sans, fontSize: 14, color: colors.fg,
    lineHeight: 20,
  },
  msgTime: {
    fontFamily: typography.mono, fontSize: 9, color: colors.fg3,
    letterSpacing: 0.3, paddingHorizontal: 4,
  },
  msgTimeMe: { textAlign: 'right' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.fg,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: spacing[4],
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderColor: colors.line,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.warm, borderColor: colors.warm,
  },
});
