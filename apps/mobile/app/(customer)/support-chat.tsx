import { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { typography, spacing } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

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
  const c = useThemeColors();
  return (
    <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: c.sageHi, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: typography.sansSemiBold, fontSize: 15, color: '#fff' }}>P</Text>
    </View>
  );
}

export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();
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
      style={[ss.screen, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: spacing[5], paddingBottom: spacing[3],
        borderBottomWidth: 1, borderBottomColor: c.line,
        paddingTop: insets.top + spacing[2],
      }}>
        <TouchableOpacity
          style={ss.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={c.fg} strokeWidth={1.5} />
        </TouchableOpacity>
        <AgentAvatar />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: typography.sansSemiBold, fontSize: 14, color: c.fg }}>
            Priya · Support
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: c.success }} />
            <Text style={{ fontFamily: typography.sans, fontSize: 11.5, color: c.success }}>Active now</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={{ paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[2] }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: m }) => (
          <View style={{ alignItems: m.from === 'me' ? 'flex-end' : 'flex-start', gap: 3 }}>
            <View style={[
              { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
              m.from === 'me'
                ? { backgroundColor: c.sageHi }
                : { backgroundColor: c.card, borderWidth: 1, borderColor: c.line },
            ]}>
              <Text style={{ fontFamily: typography.sans, fontSize: 14, color: c.fg, lineHeight: 20 }}>
                {m.text}
              </Text>
            </View>
            <Text style={[
              { fontFamily: typography.mono, fontSize: 9, color: c.fg3, letterSpacing: 0.3, paddingHorizontal: 4 },
              m.from === 'me' && { textAlign: 'right' },
            ]}>
              {m.time}
            </Text>
          </View>
        )}
      />

      {/* Input bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing[2],
        paddingHorizontal: spacing[4], paddingVertical: spacing[2],
        borderTopWidth: 1, borderTopColor: c.line,
      }}>
        <TextInput
          style={{
            flex: 1,
            fontFamily: typography.sans, fontSize: 14, color: c.fg,
            backgroundColor: c.card, borderRadius: 20,
            paddingHorizontal: spacing[4],
            paddingVertical: Platform.OS === 'ios' ? 10 : 8,
            borderWidth: 1, borderColor: c.line,
            maxHeight: 100,
          }}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message"
          placeholderTextColor={c.fg3}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[
            ss.backBtn,
            draft.trim() ? { backgroundColor: c.warm, borderColor: c.warm } : {},
          ]}
          onPress={sendMessage}
          activeOpacity={0.8}
        >
          <Send size={15} color={draft.trim() ? c.ink : c.fg3} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
