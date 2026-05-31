import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { spacing } from '@pc/tokens';
import { ScreenHeader, Group, Row, SwitchRow } from '../../components/RowGroup';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

const PREF_KEY = '@pc/settings';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, t, setLang } = useI18n();
  const { theme } = useTheme();
  const ss = useSharedStyles();
  const s18n = t.settings;

  const [pushBooking,    setPushBooking]    = useState(true);
  const [pushPromo,      setPushPromo]      = useState(false);
  const [pushTips,       setPushTips]       = useState(true);
  const [biometric,      setBiometric]      = useState(true);
  const [locationAlways, setLocationAlways] = useState(false);
  const [haptics,        setHaptics]        = useState(true);

  // Load persisted preferences
  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY).then(raw => {
      if (!raw) return;
      const p = JSON.parse(raw);
      if (typeof p.pushBooking    === 'boolean') setPushBooking(p.pushBooking);
      if (typeof p.pushPromo      === 'boolean') setPushPromo(p.pushPromo);
      if (typeof p.pushTips       === 'boolean') setPushTips(p.pushTips);
      if (typeof p.biometric      === 'boolean') setBiometric(p.biometric);
      if (typeof p.locationAlways === 'boolean') setLocationAlways(p.locationAlways);
      if (typeof p.haptics        === 'boolean') setHaptics(p.haptics);
    });
  }, []);

  function savePrefs(key: string, value: boolean) {
    AsyncStorage.getItem(PREF_KEY).then(raw => {
      const prefs = raw ? JSON.parse(raw) : {};
      AsyncStorage.setItem(PREF_KEY, JSON.stringify({ ...prefs, [key]: value }));
    });
  }

  function toggle(setter: React.Dispatch<React.SetStateAction<boolean>>, key: string, value: boolean) {
    setter(value);
    savePrefs(key, value);
  }

  async function handleSignOut() {
    Alert.alert(s18n.signOutTitle, s18n.signOutMsg, [
      { text: s18n.cancel, style: 'cancel' },
      {
        text: s18n.signOut,
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['@pc/onboarding', '@pc/role', '@pc/profile', PREF_KEY]);
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
    Alert.alert(s18n.deleteTitle, s18n.deleteMsg, [
      { text: s18n.cancel, style: 'cancel' },
      {
        text: s18n.delete,
        style: 'destructive',
        onPress: async () => {
          const user = auth().currentUser;
          if (!user) return;
          try {
            await firestore().collection('customers').doc(user.uid).update({ deleted: true, deletedAt: firestore.FieldValue.serverTimestamp() });
            await AsyncStorage.clear();
            await user.delete();
            router.replace('/(auth)/login');
          } catch (err: any) {
            if ((err as any)?.code === 'auth/requires-recent-login') {
              Alert.alert('Re-authentication required', 'Please sign out and sign back in, then try again.');
            } else {
              Alert.alert('Error', err?.message ?? 'Could not delete account. Please contact support.');
            }
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={s18n.header} />
      </View>

      <View style={ss.titleSection}>
        <Text style={ss.pageTitle}>{s18n.title}</Text>
      </View>

      <Group header={s18n.notifications}>
        <SwitchRow title={s18n.bookingUpdates} sub={s18n.bookingUpdatesSub} switchOn={pushBooking} onToggle={v => toggle(setPushBooking, 'pushBooking', v)} />
        <SwitchRow title={s18n.promotions}     sub={s18n.promotionsSub}     switchOn={pushPromo}   onToggle={v => toggle(setPushPromo, 'pushPromo', v)} />
        <SwitchRow title={s18n.tipReminders}   switchOn={pushTips}          onToggle={v => toggle(setPushTips, 'pushTips', v)} isLast />
      </Group>

      <Group header={s18n.privacySecurity}>
        <SwitchRow title={s18n.faceId}   sub={s18n.faceIdSub}   switchOn={biometric}      onToggle={v => toggle(setBiometric, 'biometric', v)} />
        <SwitchRow title={s18n.location} sub={s18n.locationSub} switchOn={locationAlways} onToggle={v => toggle(setLocationAlways, 'locationAlways', v)} />
        <Row title={s18n.twoFactor} value={s18n.on} onPress={() => Linking.openSettings()} isLast />
      </Group>

      <Group header={s18n.preferences}>
        <Row title={s18n.language}     value={t.common.langLabel} onPress={() => setLang(lang === 'en' ? 'hi' : 'en')} />
        <Row title={s18n.currency}     value={s18n.inr}           onPress={() => Alert.alert('Currency', 'Only INR (₹) is supported at this time.')} />
        <Row title={s18n.distanceUnit} value={s18n.kilometres}    onPress={() => Alert.alert('Distance', 'Only kilometres are supported at this time.')} />
        <SwitchRow title={s18n.haptics} switchOn={haptics} onToggle={v => toggle(setHaptics, 'haptics', v)} isLast />
      </Group>

      <Group header={s18n.account}>
        <Row title={s18n.editProfile} onPress={() => router.push('/(customer)/(tabs)/profile')} />
        <Row title={s18n.savedCards}  onPress={() => router.push('/(customer)/payment-methods')} />
        <Row title={s18n.exportData}  onPress={() => Alert.alert('Export data', 'Your data export will be sent to your registered email within 48 hours. Contact hello@perfectcleaners.in to request it.')} />
        <Row title={s18n.signOut}       onPress={handleSignOut} destructive />
        <Row title={s18n.deleteAccount} onPress={handleDelete}  destructive isLast />
      </Group>
    </ScrollView>
  );
}
