import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User, Bell, Shield, LogOut, ChevronRight
} from 'lucide-react-native';
import { colors, spacing } from '@pc/tokens';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

export default function WorkerSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['@pc/onboarding', '@pc/role']);
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ink }}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Settings" />
      </View>

      <Group header="ACCOUNT">
        <Row
          icon={<User size={15} color="#fff" />}
          iconBg={colors.cardHi}
          title="Profile & Identity"
          value={<ChevronRight size={14} color={colors.fg3} />}
          onPress={() => {}}
        />
        <Row
          icon={<Bell size={15} color="#fff" />}
          iconBg={colors.cardHi}
          title="Push Notifications"
          value={<ChevronRight size={14} color={colors.fg3} />}
          onPress={() => {}}
          isLast
        />
      </Group>

      <Group header="SUPPORT & LEGAL">
        <Row
          icon={<Shield size={15} color="#fff" />}
          iconBg={colors.cardHi}
          title="Privacy Policy"
          value={<ChevronRight size={14} color={colors.fg3} />}
          onPress={() => {}}
        />
        <Row
          icon={<Shield size={15} color="#fff" />}
          iconBg={colors.cardHi}
          title="Terms of Service"
          value={<ChevronRight size={14} color={colors.fg3} />}
          onPress={() => {}}
          isLast
        />
      </Group>

      <Group>
        <Row
          icon={<LogOut size={15} color="#fff" />}
          iconBg={colors.danger}
          title="Sign Out"
          titleColor={colors.danger}
          onPress={handleLogout}
          isLast
        />
      </Group>
    </ScrollView>
  );
}
