import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, FlatList,
  Modal, KeyboardAvoidingView, Platform, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Building2, Plus, Check, ChevronRight, X, Star } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocietyOption {
  id: string;
  name: string;
  towers: string[];
}

interface Address {
  id: string;
  societyId: string;
  societyName: string;
  tower?: string;
  unitNumber: string;
  primary: boolean;
}

function addressLabel(addr: Address): string {
  return [addr.tower, `Unit ${addr.unitNumber}`].filter(Boolean).join(', ');
}

function addressSub(addr: Address): string {
  return addr.societyName;
}

// ─── Society Picker (shared modal) ───────────────────────────────────────────

function SocietyPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: SocietyOption | null;
  onSelect: (s: SocietyOption) => void;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const [societies, setSocieties] = useState<SocietyOption[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
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
      .finally(() => setLoading(false));
  }, [visible]);

  const filtered = societies.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const m = StyleSheet.create({
    root:       { flex: 1, backgroundColor: c.inkRaised, paddingTop: spacing[2] },
    header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: c.line },
    title:      { fontFamily: typography.sansSemiBold, fontSize: 17, color: c.fg },
    searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], margin: spacing[4], borderWidth: 1, borderColor: c.line, borderRadius: radii.pill, paddingHorizontal: spacing[4], paddingVertical: 10, backgroundColor: c.card },
    searchIn:   { flex: 1, fontFamily: typography.sans, fontSize: 14, color: c.fg, padding: 0 },
    row:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
    icon:       { width: 38, height: 38, borderRadius: 9, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    initial:    { fontFamily: typography.sansSemiBold, fontSize: 15, color: c.ink },
    name:       { fontFamily: typography.sansMedium, fontSize: 14, color: c.fg, marginBottom: 1 },
    meta:       { fontFamily: typography.mono, fontSize: 11, color: c.fg3, letterSpacing: 0.4 },
    divider:    { height: 1, backgroundColor: c.line, marginLeft: spacing[5] + 50 },
    empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
    emptyTxt:   { fontFamily: typography.sans, fontSize: 14, color: c.fg3, textAlign: 'center' },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.root}>
        <View style={m.header}>
          <Text style={m.title}>Select Society</Text>
          <TouchableOpacity onPress={() => { onClose(); setSearch(''); }} activeOpacity={0.7}>
            <X size={20} color={c.fg2} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
        <View style={m.searchWrap}>
          <Search size={15} color={c.fg3} strokeWidth={1.5} />
          <TextInput style={m.searchIn} value={search} onChangeText={setSearch} placeholder="Search…" placeholderTextColor={c.fg4} autoFocus />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <X size={14} color={c.fg3} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={m.empty}><ActivityIndicator size="large" color={c.sageHi} /></View>
        ) : filtered.length === 0 ? (
          <View style={m.empty}><Text style={m.emptyTxt}>{search ? 'No societies match.' : 'No active society partners yet.'}</Text></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={() => <View style={m.divider} />}
            contentContainerStyle={{ paddingBottom: spacing[8] }}
            renderItem={({ item }) => (
              <TouchableOpacity style={m.row} onPress={() => { onSelect(item); setSearch(''); }} activeOpacity={0.7}>
                <View style={m.icon}>
                  <Text style={m.initial}>{item.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={m.name}>{item.name}</Text>
                  {item.towers.length > 0 && (
                    <Text style={m.meta}>{item.towers.length} tower{item.towers.length !== 1 ? 's' : ''}</Text>
                  )}
                </View>
                {selected?.id === item.id
                  ? <Check size={16} color={c.sageHi} strokeWidth={2} />
                  : <ChevronRight size={16} color={c.fg3} strokeWidth={1.5} />}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Add Address Sheet ────────────────────────────────────────────────────────

function AddAddressSheet({
  visible, onClose, onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: (addr: Address) => void;
}) {
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();
  const ss     = useSharedStyles();

  const [societyPickerOpen, setSocietyPickerOpen] = useState(false);
  const [selectedSociety,   setSelectedSociety]   = useState<SocietyOption | null>(null);
  const [selectedTower,     setSelectedTower]     = useState('');
  const [unitNumber,        setUnitNumber]        = useState('');
  const [saving,            setSaving]            = useState(false);

  function reset() {
    setSelectedSociety(null);
    setSelectedTower('');
    setUnitNumber('');
  }

  const hasTowers = (selectedSociety?.towers?.length ?? 0) > 0;
  const canSave   = selectedSociety !== null &&
                    (!hasTowers || selectedTower !== '') &&
                    unitNumber.trim().length > 0;

  async function handleSave() {
    if (!canSave || saving || !selectedSociety) return;
    setSaving(true);
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Not signed in');
      const ref = firestore().collection('customers').doc(user.uid).collection('addresses').doc();
      const addr: Address = {
        id:          ref.id,
        societyId:   selectedSociety.id,
        societyName: selectedSociety.name,
        tower:       selectedTower || undefined,
        unitNumber:  unitNumber.trim(),
        primary:     false,
      };
      await ref.set(addr);
      onSaved(addr);
      reset();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  }

  const sh = StyleSheet.create({
    root:       { flex: 1, backgroundColor: c.inkRaised },
    handle:     { width: 40, height: 4, borderRadius: 999, backgroundColor: c.lineStrong, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
    header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
    cancel:     { fontFamily: typography.sans, fontSize: 15, color: c.fg2 },
    sheetTitle: { fontFamily: typography.sansSemiBold, fontSize: 16, color: c.fg },
    save:       { fontFamily: typography.sansSemiBold, fontSize: 15, color: saving ? c.fg3 : c.sageHi },
    body:       { paddingHorizontal: spacing[5], gap: spacing[4], paddingTop: spacing[4] },
    label:      { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.8, marginBottom: spacing[2] },
    selector:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing[4], paddingVertical: 14, backgroundColor: c.card, gap: spacing[2] },
    selText:    { fontFamily: typography.sans, fontSize: 15, flex: 1 },
    towerWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
    chip:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8 },
    chipTxt:    { fontFamily: typography.sansMedium, fontSize: 13 },
    unitInput:  { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing[4], paddingVertical: 13, backgroundColor: c.card, fontFamily: typography.sans, fontSize: 15, color: c.fg },
  });

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { reset(); onClose(); }}
      >
        <KeyboardAvoidingView
          style={[sh.root, { paddingBottom: insets.bottom + spacing[4] }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={sh.handle} />
          <View style={sh.header}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} activeOpacity={0.7}>
              <Text style={sh.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={sh.sheetTitle}>Add Address</Text>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.7} disabled={!canSave || saving}>
              <Text style={[sh.save, !canSave && { color: c.fg4 }]}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={sh.body} keyboardShouldPersistTaps="handled">
            {/* Society */}
            <View>
              <Text style={sh.label}>SOCIETY</Text>
              <TouchableOpacity
                style={[sh.selector, { borderColor: selectedSociety ? c.sageHi : c.line }]}
                onPress={() => setSocietyPickerOpen(true)}
                activeOpacity={0.75}
              >
                <Text style={[sh.selText, { color: selectedSociety ? c.fg : c.fg3 }]}>
                  {selectedSociety?.name ?? 'Select your society…'}
                </Text>
                <ChevronRight size={16} color={c.fg3} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            {/* Tower chips */}
            {selectedSociety && hasTowers && (
              <View>
                <Text style={sh.label}>TOWER / BLOCK</Text>
                <View style={sh.towerWrap}>
                  {selectedSociety.towers.map(tower => (
                    <TouchableOpacity
                      key={tower}
                      style={[
                        sh.chip,
                        {
                          borderColor:     selectedTower === tower ? c.sageHi : c.line,
                          backgroundColor: selectedTower === tower ? c.sage + '22' : c.card,
                        },
                      ]}
                      onPress={() => setSelectedTower(prev => prev === tower ? '' : tower)}
                      activeOpacity={0.7}
                    >
                      {selectedTower === tower && <Check size={11} color={c.sageHi} strokeWidth={2} />}
                      <Text style={[sh.chipTxt, { color: selectedTower === tower ? c.sageHi : c.fg2 }]}>{tower}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Unit number */}
            {selectedSociety && (
              <View>
                <Text style={sh.label}>FLAT / UNIT NO.</Text>
                <TextInput
                  style={[sh.unitInput, { borderColor: unitNumber ? c.sageHi : c.line }]}
                  value={unitNumber}
                  onChangeText={setUnitNumber}
                  placeholder={selectedTower ? `${selectedTower.replace('Tower ', '')} - 1204` : '1204'}
                  placeholderTextColor={c.fg4}
                  keyboardType="default"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <SocietyPickerModal
        visible={societyPickerOpen}
        selected={selectedSociety}
        onSelect={s => { setSelectedSociety(s); setSelectedTower(''); setSocietyPickerOpen(false); }}
        onClose={() => setSocietyPickerOpen(false)}
      />
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();
  const ss     = useSharedStyles();
  const [addresses,    setAddresses]    = useState<Address[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    return firestore()
      .collection('customers').doc(user.uid)
      .collection('addresses')
      .onSnapshot(
        snap => setAddresses(snap.docs.map(d => d.data() as Address)),
        err  => console.warn('[Addresses] Firestore:', err.message),
      );
  }, []);

  async function setPrimaryAddress(id: string) {
    const user = auth().currentUser;
    if (!user) return;
    const batch = firestore().batch();
    addresses.forEach(addr => {
      batch.update(
        firestore().collection('customers').doc(user.uid).collection('addresses').doc(addr.id),
        { primary: addr.id === id },
      );
    });
    await batch.commit().catch(err => console.warn('[Addresses] setPrimary:', err.message));
  }

  async function deleteAddress(id: string) {
    const user = auth().currentUser;
    if (!user) return;
    await firestore()
      .collection('customers').doc(user.uid)
      .collection('addresses').doc(id)
      .delete()
      .catch(err => console.warn('[Addresses] delete:', err.message));
  }

  function handleAddressPress(addr: Address) {
    const buttons: any[] = [];
    if (!addr.primary) {
      buttons.push({ text: 'Set as Primary', onPress: () => setPrimaryAddress(addr.id) });
    }
    buttons.push({ text: 'Delete', style: 'destructive', onPress: () => deleteAddress(addr.id) });
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(addressLabel(addr), addressSub(addr), buttons);
  }

  const s = StyleSheet.create({
    addBtn:    { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
    addWrap:   { paddingHorizontal: spacing[5], paddingTop: spacing[3] },
    addNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.card, borderRadius: radii.md, borderWidth: 1, borderColor: c.line, paddingVertical: 14 },
    addNewTxt: { fontFamily: typography.sansMedium, fontSize: 13, color: c.fg2, letterSpacing: 0.4 },
    emptyTxt:  { fontFamily: typography.sans, fontSize: 14, color: c.fg3, textAlign: 'center', paddingVertical: spacing[5] },
  });

  return (
    <>
      <ScrollView
        style={ss.screen}
        contentContainerStyle={{ paddingBottom: spacing[10] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top }}>
          <ScreenHeader
            title="Addresses"
            trailing={
              <TouchableOpacity style={s.addBtn} onPress={() => setSheetVisible(true)} activeOpacity={0.7}>
                <Plus size={16} color={c.fg} strokeWidth={1.5} />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={ss.titleSection}>
          <Text style={ss.pageTitle}>Your addresses.</Text>
        </View>

        {addresses.length === 0 ? (
          <Text style={s.emptyTxt}>No saved addresses yet.</Text>
        ) : (
          <Group>
            {addresses.map((addr, i) => (
              <Row
                key={addr.id}
                icon={<Building2 size={15} color="#fff" strokeWidth={1.5} />}
                iconBg="#4A5E44"
                title={addressLabel(addr)}
                sub={addressSub(addr)}
                value={addr.primary ? 'Primary' : undefined}
                onPress={() => handleAddressPress(addr)}
                isLast={i === addresses.length - 1}
              />
            ))}
          </Group>
        )}

        <View style={s.addWrap}>
          <TouchableOpacity style={s.addNewBtn} onPress={() => setSheetVisible(true)} activeOpacity={0.8}>
            <Plus size={15} color={c.fg2} strokeWidth={1.5} />
            <Text style={s.addNewTxt}>ADD NEW ADDRESS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddAddressSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSaved={addr => setAddresses(prev => [...prev, addr])}
      />
    </>
  );
}
