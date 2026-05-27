import { useState } from 'react';
import { ScrollView, View, Text, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { colors, typography, spacing } from '@pc/tokens';
import { ScreenHeader, Group, Row, SwitchRow } from '../../components/RowGroup';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [pushBooking,    setPushBooking]    = useState(true);
  const [pushPromo,      setPushPromo]      = useState(false);
  const [pushTips,       setPushTips]       = useState(true);
  const [biometric,      setBiometric]      = useState(true);
  const [locationAlways, setLocationAlways] = useState(false);
  const [haptics,        setHaptics]        = useState(true);

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('@pc/onboarding');
            await auth().signOut();
            router.replace('/(auth)/login');
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  }

  function handleDelete() {
    Alert.alert(
      'Delete account',
      'This is permanent. All your booking history and credits will be lost. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ],
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Settings" />
      </View>

      <View style={s.titleSection}>
        <Text style={s.pageTitle}>Settings.</Text>
      </View>

      <Group header="Notifications">
        <SwitchRow
          title="Booking updates"
          sub="ETA changes, status, completion"
          switchOn={pushBooking}
          onToggle={setPushBooking}
        />
        <SwitchRow
          title="Promotions & offers"
          sub="New deals and seasonal discounts"
          switchOn={pushPromo}
          onToggle={setPushPromo}
        />
        <SwitchRow
          title="Tip reminders"
          switchOn={pushTips}
          onToggle={setPushTips}
          isLast
        />
      </Group>

      <Group header="Privacy & Security">
        <SwitchRow
          title="Face ID"
          sub="Unlock app and confirm payments"
          switchOn={biometric}
          onToggle={setBiometric}
        />
        <SwitchRow
          title="Location"
          sub="Required for live job tracking"
          switchOn={locationAlways}
          onToggle={setLocationAlways}
        />
        <Row
          title="Two-factor authentication"
          value="On"
          onPress={() => {}}
          isLast
        />
      </Group>

      <Group header="Preferences">
        <Row title="Language"      value="English (IN)" onPress={() => {}} />
        <Row title="Currency"      value="₹ INR"        onPress={() => {}} />
        <Row title="Distance unit" value="Kilometres"   onPress={() => {}} />
        <SwitchRow
          title="Haptic feedback"
          switchOn={haptics}
          onToggle={setHaptics}
        />
        <Row title="Appearance"    value="Always Dark"  onPress={() => {}} isLast />
      </Group>

      <Group header="Account">
        <Row title="Edit profile"    onPress={() => {}} />
        <Row title="Saved cards"     onPress={() => {}} />
        <Row title="Export my data"  onPress={() => {}} />
        <Row title="Sign out"        onPress={handleSignOut} destructive />
        <Row title="Delete account"  onPress={handleDelete}  destructive isLast />
      </Group>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  titleSection: { paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
  pageTitle: {
    fontFamily: typography.serif, fontSize: 32, color: colors.fg, letterSpacing: -0.3,
  },
});
