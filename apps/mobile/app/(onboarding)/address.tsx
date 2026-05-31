import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Modal, KeyboardAvoidingView, Platform, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, ChevronDown, ChevronRight, Check, X } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { spacing, typography, radii } from '@pc/tokens';
import type { Vehicle } from '@pc/firebase';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BrandLogo from '../../components/BrandLogo';
import OnboardingProgress from '../../components/OnboardingProgress';

interface SocietyOption {
  id: string;
  name: string;
  towers: string[];
}

export default function OnboardingAddress() {
  const params = useLocalSearchParams<{
    firstName?: string; lastName?: string; email?: string;
    make?: string; model?: string; plate?: string; color?: string;
  }>();
  const fullName = `${params.firstName ?? ''} ${params.lastName ?? ''}`.trim();

  const [societies,        setSocieties]        = useState<SocietyOption[]>([]);
  const [loadingSocieties, setLoadingSocieties] = useState(true);
  const [pickerOpen,       setPickerOpen]       = useState(false);
  const [societySearch,    setSocietySearch]    = useState('');
  const [selectedSociety,  setSelectedSociety]  = useState<SocietyOption | null>(null);
  const [selectedTower,    setSelectedTower]    = useState('');
  const [unitNumber,       setUnitNumber]       = useState('');
  const [saving,           setSaving]           = useState(false);

  const router = useRouter();
  const c  = useThemeColors();
  const ss = useSharedStyles();

  useEffect(() => {
    firestore()
      .collection('societies')
      .where('isActive', '==', true)
      .get()
      .then(snap => {
        setSocieties(snap.docs.map(d => ({
          id:     d.id,
          name:   d.data().name   as string,
          towers: (d.data().towers as string[]) ?? [],
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingSocieties(false));
  }, []);

  const filteredSocieties = societies.filter(s =>
    s.name.toLowerCase().includes(societySearch.toLowerCase()),
  );

  const hasTowers = (selectedSociety?.towers?.length ?? 0) > 0;
  const ready     = selectedSociety !== null &&
                    (!hasTowers || selectedTower !== '') &&
                    unitNumber.trim().length > 0;

  function handleSelectSociety(s: SocietyOption) {
    setSelectedSociety(s);
    setSelectedTower('');  // reset tower when society changes
    setPickerOpen(false);
    setSocietySearch('');
  }

  async function handleFinish() {
    if (!ready || saving || !selectedSociety) return;
    setSaving(true);
    try {
      // Auth must still be valid — if the session expired during onboarding,
      // abort rather than writing AsyncStorage as "done" without a Firestore doc.
      const user = auth().currentUser;
      if (!user) {
        throw new Error('Session expired. Please sign in again.');
      }

      const vehicle: Vehicle | undefined = params.make ? {
        id:           'v1',
        make:         params.make,
        model:        params.model ?? '',
        year:         new Date().getFullYear(),
        type:         'sedan',
        registration: params.plate ?? '',
        color:        params.color ?? '',
      } : undefined;

      // Write Firestore first — if this fails the AsyncStorage gate is never set,
      // so onboarding can be retried rather than being permanently broken.
      await firestore()
        .collection('customers')
        .doc(user.uid)
        .set({
          id:                user.uid,
          name:              fullName,
          email:             params.email ?? '',
          phone:             user.phoneNumber ?? '',
          vehicles:          vehicle ? [vehicle] : [],
          societyId:         selectedSociety.id,
          societyName:       selectedSociety.name,
          unitNumber:        unitNumber.trim(),
          ...(selectedTower ? { tower: selectedTower } : {}),
          defaultAddress: {
            societyId:   selectedSociety.id,
            societyName: selectedSociety.name,
            tower:       selectedTower || undefined,
            unitNumber:  unitNumber.trim(),
          },
          onboardingComplete: true,
          role:               'customer',
          walletBalance:      0,
          createdAt:          firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

      const profileData = {
        name:  fullName,
        email: params.email ?? '',
        phone: user.phoneNumber ?? '',
        car: {
          make:  params.make  ?? '',
          model: params.model ?? '',
          plate: params.plate ?? '',
          color: params.color ?? '',
        },
        address: {
          societyId:   selectedSociety.id,
          societyName: selectedSociety.name,
          tower:       selectedTower,
          unitNumber:  unitNumber.trim(),
        },
      };

      await AsyncStorage.setItem('@pc/profile', JSON.stringify(profileData));
      await AsyncStorage.setItem('@pc/onboarding', 'done');
      await AsyncStorage.setItem('@pc/role', 'customer');

      router.replace('/(customer)/(tabs)');
    } catch (err: any) {
      Alert.alert('Setup failed', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const s = makeStyles(c);

  return (
    <AuthScreenShell>
      <OnboardingProgress current={3} total={3} />
      <BrandLogo size="sm" />

      <View style={s.heading}>
        <Text style={ss.onboardingStep}>[STEP 03 OF 03]</Text>
        <Text style={ss.onboardingTitle}>Where do{'\n'}you live?</Text>
        <Text style={ss.subtitle}>Your society and unit — so we know exactly which car to clean.</Text>
      </View>

      {/* Society selector */}
      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>SOCIETY</Text>
        <TouchableOpacity
          style={[s.selector, { borderColor: selectedSociety ? c.sageHi : c.line, backgroundColor: c.card }]}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.75}
        >
          {loadingSocieties ? (
            <ActivityIndicator size="small" color={c.fg3} />
          ) : (
            <Text style={[s.selectorText, { color: selectedSociety ? c.fg : c.fg3 }]}>
              {selectedSociety?.name ?? 'Select your society…'}
            </Text>
          )}
          <ChevronDown size={16} color={c.fg3} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Tower chips — shown only if society has towers */}
      {selectedSociety && hasTowers && (
        <View style={ss.fieldArea}>
          <Text style={ss.fieldLabel}>TOWER / BLOCK</Text>
          <View style={s.towerRow}>
            {selectedSociety.towers.map(tower => (
              <TouchableOpacity
                key={tower}
                style={[
                  s.towerChip,
                  {
                    borderColor:     selectedTower === tower ? c.sageHi : c.line,
                    backgroundColor: selectedTower === tower ? c.sage + '22' : c.card,
                  },
                ]}
                onPress={() => setSelectedTower(prev => prev === tower ? '' : tower)}
                activeOpacity={0.7}
              >
                {selectedTower === tower && (
                  <Check size={11} color={c.sageHi} strokeWidth={2} />
                )}
                <Text style={[
                  s.towerChipText,
                  { color: selectedTower === tower ? c.sageHi : c.fg2 },
                ]}>
                  {tower}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Unit number */}
      {selectedSociety && (
        <View style={ss.fieldArea}>
          <Text style={ss.fieldLabel}>FLAT / UNIT NO.</Text>
          <TextInput
            style={ss.formInput}
            value={unitNumber}
            onChangeText={setUnitNumber}
            placeholder={selectedTower ? `${selectedTower.replace('Tower ', '')} - 1204` : '1204'}
            placeholderTextColor={c.fg4}
            keyboardType="default"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleFinish}
          />
        </View>
      )}

      <TouchableOpacity
        style={[ss.primaryBtn, (!ready || saving) && ss.primaryBtnOff]}
        onPress={handleFinish}
        activeOpacity={0.8}
        disabled={!ready || saving}
      >
        <Text style={ss.primaryBtnText}>{saving ? 'SAVING…' : 'FINISH SETUP →'}</Text>
      </TouchableOpacity>

      {/* Society picker modal */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={[s.modal, { backgroundColor: c.inkRaised }]}>
          {/* Modal header */}
          <View style={[s.modalHeader, { borderBottomColor: c.line }]}>
            <Text style={[s.modalTitle, { color: c.fg }]}>Select Society</Text>
            <TouchableOpacity onPress={() => { setPickerOpen(false); setSocietySearch(''); }} activeOpacity={0.7}>
              <X size={20} color={c.fg2} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[s.searchWrap, { backgroundColor: c.card, borderColor: c.line }]}>
            <Search size={15} color={c.fg3} strokeWidth={1.5} />
            <TextInput
              style={[s.searchInput, { color: c.fg }]}
              value={societySearch}
              onChangeText={setSocietySearch}
              placeholder="Search societies…"
              placeholderTextColor={c.fg4}
              autoFocus
            />
            {societySearch.length > 0 && (
              <TouchableOpacity onPress={() => setSocietySearch('')} activeOpacity={0.7}>
                <X size={14} color={c.fg3} strokeWidth={1.5} />
              </TouchableOpacity>
            )}
          </View>

          {/* Society list */}
          {loadingSocieties ? (
            <View style={s.emptyState}>
              <ActivityIndicator size="large" color={c.sageHi} />
            </View>
          ) : filteredSocieties.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={[s.emptyText, { color: c.fg3 }]}>
                {societySearch ? 'No societies match your search.' : 'No active society partners yet.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredSocieties}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: spacing[8] }}
              ItemSeparatorComponent={() => <View style={[s.divider, { backgroundColor: c.line }]} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.societyRow}
                  onPress={() => handleSelectSociety(item)}
                  activeOpacity={0.7}
                >
                  <View style={[s.societyIcon, { backgroundColor: c.sage }]}>
                    <Text style={[s.societyInitial, { color: c.ink }]}>{item.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.societyName, { color: c.fg }]}>{item.name}</Text>
                    {item.towers.length > 0 && (
                      <Text style={[s.societyMeta, { color: c.fg3 }]}>
                        {item.towers.length} tower{item.towers.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                  {selectedSociety?.id === item.id
                    ? <Check size={16} color={c.sageHi} strokeWidth={2} />
                    : <ChevronRight size={16} color={c.fg3} strokeWidth={1.5} />
                  }
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </AuthScreenShell>
  );
}

function makeStyles(c: ReturnType<typeof import('../../theme').useThemeColors>) {
  return StyleSheet.create({
    heading:      { gap: spacing[2] },
    selector:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing[4], paddingVertical: 14, gap: spacing[3] },
    selectorText: { fontFamily: typography.sans, fontSize: 15, flex: 1 },
    towerRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
    towerChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8 },
    towerChipText:{ fontFamily: typography.sansMedium, fontSize: 13 },
    // Modal
    modal:        { flex: 1, paddingTop: spacing[2] },
    modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1 },
    modalTitle:   { fontFamily: typography.sansSemiBold, fontSize: 17 },
    searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginHorizontal: spacing[5], marginVertical: spacing[3], borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing[4], paddingVertical: 10 },
    searchInput:  { flex: 1, fontFamily: typography.sans, fontSize: 14, padding: 0 },
    societyRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: spacing[4] },
    societyIcon:  { width: 38, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    societyInitial:{ fontFamily: typography.sansSemiBold, fontSize: 15 },
    societyName:  { fontFamily: typography.sansMedium, fontSize: 14, marginBottom: 1 },
    societyMeta:  { fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.4 },
    divider:      { height: 1, marginLeft: 50 },
    emptyState:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
    emptyText:    { fontFamily: typography.sans, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  });
}
