import { useState } from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { spacing } from '@pc/tokens';
import { ScreenHeader, Group, Row, SwitchRow } from '../../components/RowGroup';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, t, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const ss = useSharedStyles();
  const s18n = t.settings;

  const [pushBooking,    setPushBooking]    = useState(true);
  const [pushPromo,      setPushPromo]      = useState(false);
  const [pushTips,       setPushTips]       = useState(true);
  const [biometric,      setBiometric]      = useState(true);
  const [locationAlways, setLocationAlways] = useState(false);
  const [haptics,        setHaptics]        = useState(true);

  async function handleSignOut() {
    Alert.alert(s18n.signOutTitle, s18n.signOutMsg, [
      { text: s18n.cancel, style: 'cancel' },
      {
        text: s18n.signOut,
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
    Alert.alert(s18n.deleteTitle, s18n.deleteMsg, [
      { text: s18n.cancel, style: 'cancel' },
      { text: s18n.delete, style: 'destructive', onPress: () => {} },
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
        <SwitchRow title={s18n.bookingUpdates} sub={s18n.bookingUpdatesSub} switchOn={pushBooking} onToggle={setPushBooking} />
        <SwitchRow title={s18n.promotions}     sub={s18n.promotionsSub}     switchOn={pushPromo}   onToggle={setPushPromo} />
        <SwitchRow title={s18n.tipReminders}   switchOn={pushTips}          onToggle={setPushTips} isLast />
      </Group>

      <Group header={s18n.privacySecurity}>
        <SwitchRow title={s18n.faceId}   sub={s18n.faceIdSub}    switchOn={biometric}      onToggle={setBiometric} />
        <SwitchRow title={s18n.location} sub={s18n.locationSub}  switchOn={locationAlways} onToggle={setLocationAlways} />
        <Row title={s18n.twoFactor} value={s18n.on} onPress={() => {}} isLast />
      </Group>

      <Group header={s18n.preferences}>
        <Row title={s18n.language}     value={t.common.langLabel} onPress={() => setLang(lang === 'en' ? 'hi' : 'en')} />
        <Row title={s18n.currency}     value={s18n.inr}           onPress={() => {}} />
        <Row title={s18n.distanceUnit} value={s18n.kilometres}    onPress={() => {}} />
        <SwitchRow title={s18n.haptics} switchOn={haptics} onToggle={setHaptics} />
        <Row
          title={s18n.appearance}
          value={theme === 'light' ? 'Light' : 'Dark'}
          onPress={toggleTheme}
          isLast
        />
      </Group>

      <Group header={s18n.account}>
        <Row title={s18n.editProfile}   onPress={() => {}} />
        <Row title={s18n.savedCards}    onPress={() => {}} />
        <Row title={s18n.exportData}    onPress={() => {}} />
        <Row title={s18n.signOut}       onPress={handleSignOut} destructive />
        <Row title={s18n.deleteAccount} onPress={handleDelete}  destructive isLast />
      </Group>
    </ScrollView>
  );
}
