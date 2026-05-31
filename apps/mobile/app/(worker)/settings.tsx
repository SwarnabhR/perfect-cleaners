import { ScrollView, View, Text, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Bell, Shield, LogOut } from 'lucide-react-native';
import { spacing } from '@pc/tokens';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';
import { useTheme } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

export default function WorkerSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c } = useTheme();
  const ss = useSharedStyles();

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
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Settings" />
      </View>

      <Group header="ACCOUNT">
        <Row
          icon={<User size={15} color="#fff" />}
          iconBg={c.cardHi}
          title="Profile & Identity"
          onPress={() => router.back()}
        />
        <Row
          icon={<Bell size={15} color="#fff" />}
          iconBg={c.cardHi}
          title="Push Notifications"
          onPress={() => Linking.openSettings()}
          isLast
        />
      </Group>

      <Group header="SUPPORT & LEGAL">
        <Row
          icon={<Shield size={15} color="#fff" />}
          iconBg={c.cardHi}
          title="Privacy Policy"
          onPress={() => Linking.openURL('https://perfectcleaners.in/privacy')}
        />
        <Row
          icon={<Shield size={15} color="#fff" />}
          iconBg={c.cardHi}
          title="Terms of Service"
          onPress={() => Linking.openURL('https://perfectcleaners.in/terms')}
          isLast
        />
      </Group>

      <Group>
        <Row
          icon={<LogOut size={15} color="#fff" />}
          iconBg={c.danger}
          title="Sign Out"
          titleColor={c.danger}
          onPress={handleLogout}
          isLast
        />
      </Group>
    </ScrollView>
  );
}
