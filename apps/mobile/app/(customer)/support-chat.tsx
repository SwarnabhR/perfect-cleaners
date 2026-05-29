import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

interface Message {
  id:   string;
  from: 'agent' | 'customer';
  text: string;
  time: string;
}

function formatTime(ts: any): string {
  const d = ts?.toDate ? ts.toDate() : new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const GREETING: Omit<Message, 'id'> = {
  from: 'agent',
  text: 'Hi! Priya from Perfect Cleaners. How can I help?',
  time: '',
};

function AgentAvatar() {
  const c = useThemeColors();
  return (
    <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: c.sageHi, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: typography.sansSemiBold, fontSize: 15, color: '#fff' }}>P</Text>
    </View>
  );
}

export default function SupportChatScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const c       = useThemeColors();
  const ss      = useSharedStyles();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft,    setDraft]    = useState('');
  const listRef = useRef<FlatList>(null);

  const user = auth().currentUser;
  const uid  = user?.uid ?? 'anonymous';

  useEffect(() => {
    const chatRef = firestore()
      .collection('support')
      .doc(uid)
      .collection('messages');

    // Seed the greeting on first open if chat is empty
    chatRef.limit(1).get().then(snap => {
      if (snap.empty) {
        chatRef.add({
          from:      'agent',
          text:      GREETING.text,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    return chatRef
      .orderBy('createdAt', 'asc')
      .onSnapshot(
        snap => {
          setMessages(snap.docs.map(d => ({
            id:   d.id,
            from: d.data().from,
            text: d.data().text,
            time: formatTime(d.data().createdAt),
          })));
          setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
        },
        err => console.warn('[SupportChat]', err.message),
      );
  }, [uid]);

  async function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    await firestore()
      .collection('support')
      .doc(uid)
      .collection('messages')
      .add({
        from:      'customer',
        text,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
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
          <View style={{ alignItems: m.from === 'customer' ? 'flex-end' : 'flex-start', gap: 3 }}>
            <View style={[
              { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
              m.from === 'customer'
                ? { backgroundColor: c.sageHi }
                : { backgroundColor: c.card, borderWidth: 1, borderColor: c.line },
            ]}>
              <Text style={{ fontFamily: typography.sans, fontSize: 14, color: c.fg, lineHeight: 20 }}>
                {m.text}
              </Text>
            </View>
            {m.time ? (
              <Text style={[
                { fontFamily: typography.mono, fontSize: 9, color: c.fg3, letterSpacing: 0.3, paddingHorizontal: 4 },
                m.from === 'customer' && { textAlign: 'right' },
              ]}>
                {m.time}
              </Text>
            ) : null}
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
