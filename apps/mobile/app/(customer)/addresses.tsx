import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Building2, MapPin, Plus, X } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';
import { ScreenHeader, Group, Row, SegCtrl } from '../../components/RowGroup';

type AddressTag = 'home' | 'office' | 'other';

interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string;
  tag: AddressTag;
  primary: boolean;
}

const ADDRESSES: Address[] = [
  { id: 'a1', label: 'Home',           line1: 'B-204, Kavi Nagar',        line2: 'Ghaziabad, UP 201002',         tag: 'home',   primary: true  },
  { id: 'a2', label: 'Office',         line1: 'Tower B, Logix Park',      line2: 'Sector 16, Noida 201301',      tag: 'office', primary: false },
  { id: 'a3', label: "Parent's house", line1: '14 Greenfield Apts',        line2: 'Indirapuram, Ghaziabad 201014', tag: 'other',  primary: false },
];

const TAG_OPTIONS = [
  { value: 'home',   label: 'Home'   },
  { value: 'office', label: 'Office' },
  { value: 'other',  label: 'Other'  },
];

function TagIcon({ tag }: { tag: AddressTag }) {
  const props = { size: 15, color: '#fff', strokeWidth: 1.5 } as const;
  switch (tag) {
    case 'home':   return <Home     {...props} />;
    case 'office': return <Building2 {...props} />;
    default:       return <MapPin   {...props} />;
  }
}

// ─── Add Address Sheet ────────────────────────────────────────────────────────
function AddAddressSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [tag, setTag] = useState<AddressTag>('home');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[sheet.root, { paddingBottom: insets.bottom + spacing[4] }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Handle */}
        <View style={sheet.handle} />

        {/* Sheet header */}
        <View style={sheet.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={sheet.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={sheet.sheetTitle}>Add Address</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={sheet.save}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Map preview placeholder */}
        <View style={sheet.mapPreview}>
          <View style={sheet.mapDot} />
          <Text style={sheet.mapLabel}>USE CURRENT LOCATION →</Text>
        </View>

        {/* Form */}
        <View style={sheet.form}>
          <SheetField label="Label"     placeholder="Home, Office, Studio…" />
          <SheetField label="Address 1" placeholder="House / building / street" />
          <SheetField label="Address 2" placeholder="Landmark, sector, society" />
          <SheetField label="City"      placeholder="Ghaziabad" />
          <SheetField label="Pincode"   placeholder="201002" keyboardType="numeric" isLast />
        </View>

        <Text style={sheet.segLabel}>TAG</Text>
        <View style={sheet.segWrap}>
          <SegCtrl options={TAG_OPTIONS} value={tag} onChange={v => setTag(v as AddressTag)} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SheetField({
  label, placeholder, keyboardType, isLast,
}: {
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  isLast?: boolean;
}) {
  return (
    <View style={[sheet.field, !isLast && sheet.fieldBorder]}>
      <Text style={sheet.fieldLabel}>{label}</Text>
      <TextInput
        style={sheet.fieldInput}
        placeholder={placeholder}
        placeholderTextColor={colors.fg3}
        keyboardType={keyboardType ?? 'default'}
        returnKeyType={isLast ? 'done' : 'next'}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      <ScrollView
        style={s.root}
        contentContainerStyle={{ paddingBottom: spacing[10] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top }}>
          <ScreenHeader
            title="Addresses"
            trailing={
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => setSheetVisible(true)}
                activeOpacity={0.7}
              >
                <Plus size={14} color={colors.fg} strokeWidth={2} />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={s.titleSection}>
          <Text style={s.pageTitle}>Your addresses.</Text>
        </View>

        <Group>
          {ADDRESSES.map((a, i) => (
            <Row
              key={a.id}
              icon={<TagIcon tag={a.tag} />}
              iconBg={a.primary ? colors.sage : colors.fg3}
              title={a.primary ? `${a.label}  [DEFAULT]` : a.label}
              sub={`${a.line1} · ${a.line2}`}
              onPress={() => {}}
              isLast={i === ADDRESSES.length - 1}
            />
          ))}
        </Group>

        <View style={s.addWrap}>
          <TouchableOpacity
            style={s.addNewBtn}
            onPress={() => setSheetVisible(true)}
            activeOpacity={0.75}
          >
            <Plus size={14} color={colors.fg2} strokeWidth={1.5} />
            <Text style={s.addNewText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddAddressSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  titleSection: { paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
  pageTitle: {
    fontFamily: typography.serif, fontSize: 32, color: colors.fg, letterSpacing: -0.3,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: radii.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  addWrap: { paddingHorizontal: spacing[5], paddingTop: spacing[3] },
  addNewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.line, paddingVertical: 14,
  },
  addNewText: {
    fontFamily: typography.sansMedium, fontSize: 13,
    color: colors.fg2, letterSpacing: 0.4,
  },
});

const sheet = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.inkRaised },
  handle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: colors.lineStrong,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  cancel: {
    fontFamily: typography.sans, fontSize: 15, color: colors.fg2,
  },
  sheetTitle: {
    fontFamily: typography.sansSemiBold, fontSize: 16, color: colors.fg,
  },
  save: {
    fontFamily: typography.sansSemiBold, fontSize: 15, color: colors.sageHi,
  },
  mapPreview: {
    marginHorizontal: spacing[5],
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  mapDot: {
    width: 14, height: 14, borderRadius: 999,
    backgroundColor: colors.success,
    borderWidth: 2, borderColor: 'rgba(111,174,106,0.35)',
  },
  mapLabel: {
    fontFamily: typography.mono, fontSize: 9.5,
    color: colors.fg3, letterSpacing: 0.8,
  },
  form: {
    marginHorizontal: spacing[5],
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  field: { paddingHorizontal: spacing[4], paddingVertical: 11 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  fieldLabel: {
    fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4,
  },
  fieldInput: {
    fontFamily: typography.sans, fontSize: 14, color: colors.fg, padding: 0,
  },
  segLabel: {
    fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3,
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: spacing[5] + 4, marginBottom: spacing[1],
  },
  segWrap: { paddingHorizontal: spacing[5] },
});
