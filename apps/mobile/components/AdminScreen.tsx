import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing } from '@pc/tokens';
import { useThemeColors } from '../theme';
import OfflineStrip from './OfflineStrip';

interface Props { eyebrow: string; title: string; children?: ReactNode }

/** Shared frame for admin tab screens: safe-area top bar with title and sign-out. */
export default function AdminScreen({ eyebrow, title, children }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  async function signOut() {
    await auth().signOut();
    await AsyncStorage.multiRemove(['@pc/role', '@pc/onboarding']);
    router.replace('/(auth)/login');
  }

  return (
    <View style={[s.root, { backgroundColor: c.ink }]}>
      <View style={[s.bar, { paddingTop: insets.top + spacing[3] }]}>
        <View>
          <Text style={[s.eyebrow, { color: c.fg3 }]}>{eyebrow}</Text>
          <Text style={[s.title, { color: c.fg }]}>{title}</Text>
        </View>
        <TouchableOpacity onPress={signOut} hitSlop={12} accessibilityLabel="Sign out" style={s.signOut}>
          <LogOut size={20} color={c.fg3} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
      <OfflineStrip />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  bar:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  eyebrow: { fontFamily: typography.mono, fontSize: 10, letterSpacing: 1.2 },
  title:   { fontFamily: typography.sansSemiBold, fontSize: 22, marginTop: 2 },
  signOut: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
