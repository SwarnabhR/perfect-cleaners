import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Building2, MapPin, Plus } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, Group, Row, SegCtrl } from '../../components/RowGroup';

type AddressTag = 'home' | 'office' | 'other';

interface Address {
  id:      string;
  label:   string;
  line1:   string;
  line2:   string;
  city:    string;
  pincode: string;
  tag:     AddressTag;
  primary: boolean;
}

const TAG_OPTIONS = [
  { value: 'home',   label: 'Home'   },
  { value: 'office', label: 'Office' },
  { value: 'other',  label: 'Other'  },
];

const TAG_BG: Record<AddressTag, string> = {
  home:   '#2D7D6F',
  office: '#4B8CF5',
  other:  '#9E9E9E',
};

function TagIcon({ tag }: { tag: AddressTag }) {
  const p = { size: 15, color: '#fff', strokeWidth: 1.5 } as const;
  switch (tag) {
    case 'home':   return <Home      {...p} />;
    case 'office': return <Building2 {...p} />;
    default:       return <MapPin    {...p} />;
  }
}

// ─── Controlled form field ────────────────────────────────────────────────────
function SheetField({
  label, placeholder, value, onChangeText, keyboardType, isLast,
}: {
  label:          string;
  placeholder:    string;
  value:          string;
  onChangeText:   (v: string) => void;
  keyboardType?:  'default' | 'numeric';
  isLast?:        boolean;
}) {
  const c  = useThemeColors();
  const ss = useSharedStyles();
  const s  = StyleSheet.create({
    field:       { paddingHorizontal: spacing[4], paddingVertical: 11 },
    fieldBorder: { borderBottomWidth: 1, borderBottomColor: c.line },
    fieldInput:  { fontFamily: typography.sans, fontSize: 14, color: c.fg, padding: 0 },
  });
  return (
    <View style={[s.field, !isLast && s.fieldBorder]}>
      <Text style={[ss.fieldLabel, { marginBottom: 4 }]}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        placeholder={placeholder}
        placeholderTextColor={c.fg3}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        returnKeyType={isLast ? 'done' : 'next'}
      />
    </View>
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

  const [labelText, setLabelText] = useState('');
  const [line1,     setLine1]     = useState('');
  const [line2,     setLine2]     = useState('');
  const [city,      setCity]      = useState('Ghaziabad');
  const [pincode,   setPincode]   = useState('');
  const [tag,       setTag]       = useState<AddressTag>('home');
  const [saving,    setSaving]    = useState(false);

  function reset() {
    setLabelText(''); setLine1(''); setLine2('');
    setCity('Ghaziabad'); setPincode(''); setTag('home');
  }

  async function handleSave() {
    if (!line1.trim() || saving) return;
    setSaving(true);
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Not signed in');
      const ref = firestore()
        .collection('customers').doc(user.uid)
        .collection('addresses').doc();
      const addr: Address = {
        id:      ref.id,
        label:   labelText.trim() || (tag === 'home' ? 'Home' : tag === 'office' ? 'Office' : 'Other'),
        line1:   line1.trim(),
        line2:   line2.trim(),
        city:    city.trim() || 'Ghaziabad',
        pincode: pincode.trim(),
        tag,
        primary: false,
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

  const sheet = StyleSheet.create({
    root:       { flex: 1, backgroundColor: c.inkRaised },
    handle:     { width: 40, height: 4, borderRadius: 999, backgroundColor: c.lineStrong, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
    header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
    cancel:     { fontFamily: typography.sans, fontSize: 15, color: c.fg2 },
    sheetTitle: { fontFamily: typography.sansSemiBold, fontSize: 16, color: c.fg },
    save:       { fontFamily: typography.sansSemiBold, fontSize: 15, color: saving ? c.fg3 : c.sageHi },
    mapPreview: { marginHorizontal: spacing[5], height: 100, borderRadius: radii.md, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[4], gap: spacing[2] },
    mapDot:     { width: 14, height: 14, borderRadius: 999, backgroundColor: c.success, borderWidth: 2, borderColor: c.successBorder },
    mapLabel:   { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8 },
    form:       { marginHorizontal: spacing[5], backgroundColor: c.card, borderRadius: radii.md, borderWidth: 1, borderColor: c.line, overflow: 'hidden', marginBottom: spacing[3] },
    segLabel:   { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: spacing[5] + 4, marginBottom: spacing[1] },
    segWrap:    { paddingHorizontal: spacing[5] },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[sheet.root, { paddingBottom: insets.bottom + spacing[4] }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={sheet.handle} />
        <View style={sheet.header}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }} activeOpacity={0.7}>
            <Text style={sheet.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={sheet.sheetTitle}>Add Address</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7} disabled={saving}>
            <Text style={sheet.save}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <View style={sheet.mapPreview}>
          <View style={sheet.mapDot} />
          <Text style={sheet.mapLabel}>USE CURRENT LOCATION →</Text>
        </View>

        <View style={sheet.form}>
          <SheetField label="Label"     placeholder="Home, Office, Studio…"   value={labelText} onChangeText={setLabelText} />
          <SheetField label="Address 1" placeholder="House / building / street" value={line1}     onChangeText={setLine1} />
          <SheetField label="Address 2" placeholder="Landmark, sector, society" value={line2}     onChangeText={setLine2} />
          <SheetField label="City"      placeholder="Ghaziabad"                 value={city}      onChangeText={setCity} />
          <SheetField label="Pincode"   placeholder="201002" keyboardType="numeric" value={pincode} onChangeText={setPincode} isLast />
        </View>

        <Text style={sheet.segLabel}>TAG</Text>
        <View style={sheet.segWrap}>
          <SegCtrl options={TAG_OPTIONS} value={tag} onChange={v => setTag(v as AddressTag)} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    Alert.alert(addr.label, [addr.line1, addr.line2, addr.city].filter(Boolean).join(', '), buttons);
  }

  const s = StyleSheet.create({
    addBtn:    { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
    addWrap:   { paddingHorizontal: spacing[5], paddingTop: spacing[3] },
    addNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.card, borderRadius: radii.md, borderWidth: 1, borderColor: c.line, paddingVertical: 14 },
    addNewText:{ fontFamily: typography.sansMedium, fontSize: 13, color: c.fg2, letterSpacing: 0.4 },
    emptyText: { fontFamily: typography.sans, fontSize: 14, color: c.fg3, textAlign: 'center', paddingVertical: spacing[5] },
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
          <Text style={s.emptyText}>No saved addresses yet.</Text>
        ) : (
          <Group>
            {addresses.map((addr, i) => (
              <Row
                key={addr.id}
                icon={<TagIcon tag={addr.tag} />}
                iconBg={TAG_BG[addr.tag]}
                title={addr.label}
                sub={[addr.line1, addr.line2, addr.city].filter(Boolean).join(' · ')}
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
            <Text style={s.addNewText}>ADD NEW ADDRESS</Text>
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
