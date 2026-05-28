import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { CarImage } from '@pc/ui';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { ScreenHeader, SegCtrl } from '../../components/RowGroup';

type Tone = 'dark' | 'sage' | 'light';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  tone: Tone;
  primary: boolean;
}

const CARS: Car[] = [
  { id: 'v1', make: 'BMW',     model: '3 Series', year: 2022, plate: 'DL 4C AB 1234', color: 'Mineral Grey',  tone: 'dark', primary: true  },
  { id: 'v2', make: 'Hyundai', model: 'Creta',    year: 2020, plate: 'DL 8C XY 0921', color: 'Phantom Black', tone: 'dark', primary: false },
];

const TONE_OPTIONS = [
  { value: 'dark',  label: 'Dark'  },
  { value: 'light', label: 'Light' },
  { value: 'sage',  label: 'Sage'  },
];

function CarField({
  label, placeholder, keyboardType, isLast,
}: {
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  isLast?: boolean;
}) {
  const c = useThemeColors();
  const s = StyleSheet.create({
    field: { paddingHorizontal: spacing[4], paddingVertical: 11 },
    fieldBorder: { borderBottomWidth: 1, borderBottomColor: c.line },
    fieldLabel: { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
    fieldInput: { fontFamily: typography.sans, fontSize: 14, color: c.fg, padding: 0 },
  });
  return (
    <View style={[s.field, !isLast && s.fieldBorder]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        placeholder={placeholder}
        placeholderTextColor={c.fg3}
        keyboardType={keyboardType ?? 'default'}
        returnKeyType={isLast ? 'done' : 'next'}
      />
    </View>
  );
}

function CarCard({ car, onEdit }: { car: Car; onEdit: () => void }) {
  const c = useThemeColors();
  const s = StyleSheet.create({
    carCard: {
      backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.line, overflow: 'hidden',
    },
    heroWrap: { position: 'relative', height: 130 },
    carHero: { height: 130, borderRadius: 0, borderWidth: 0 },
    primaryBadge: {
      position: 'absolute', top: 10, right: 10,
      paddingHorizontal: 8, paddingVertical: 4,
      backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radii.pill,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    primaryBadgeText: { fontFamily: typography.mono, fontSize: 9, color: '#fff', letterSpacing: 0.8 },
    carOverlay: { position: 'absolute', bottom: 12, left: 14, right: 14 },
    carYearColor: { fontFamily: typography.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.6 },
    carName: { fontFamily: typography.sansSemiBold, fontSize: 20, color: '#fff', letterSpacing: -0.3, marginTop: 2 },
    carFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
    plateBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radii.xs, paddingHorizontal: 10, paddingVertical: 6 },
    plateText: { fontFamily: typography.mono, fontSize: 13, color: '#fff', letterSpacing: 0.8 },
    editBtn: {
      backgroundColor: c.cardHi, borderRadius: radii.sm,
      paddingHorizontal: 14, paddingVertical: 7,
      borderWidth: 1, borderColor: c.lineStrong,
    },
    editBtnText: { fontFamily: typography.sansMedium, fontSize: 13, color: c.fg },
  });

  return (
    <View style={s.carCard}>
      <View style={s.heroWrap}>
        <CarImage tone={car.tone} style={s.carHero} />
        {car.primary && (
          <View style={s.primaryBadge}>
            <Text style={s.primaryBadgeText}>● PRIMARY</Text>
          </View>
        )}
        <View style={s.carOverlay}>
          <Text style={s.carYearColor}>{car.year} · {car.color.toUpperCase()}</Text>
          <Text style={s.carName}>{car.make} {car.model}</Text>
        </View>
      </View>
      <View style={s.carFooter}>
        <View style={s.plateBadge}>
          <Text style={s.plateText}>{car.plate}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.75}>
          <Text style={s.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddCarSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const [tone, setTone] = useState<Tone>('dark');

  const sheet = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.inkRaised },
    handle: {
      width: 40, height: 4, borderRadius: 999,
      backgroundColor: c.lineStrong, alignSelf: 'center', marginTop: 10, marginBottom: 6,
    },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing[5], paddingVertical: spacing[3],
    },
    cancel: { fontFamily: typography.sans, fontSize: 15, color: c.fg2 },
    sheetTitle: { fontFamily: typography.sansSemiBold, fontSize: 16, color: c.fg },
    save: { fontFamily: typography.sansSemiBold, fontSize: 15, color: c.sageHi },
    carPreview: { marginHorizontal: spacing[5], height: 160, marginBottom: spacing[4] },
    form: {
      marginHorizontal: spacing[5], backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.line, overflow: 'hidden', marginBottom: spacing[3],
    },
    splitRow: { flexDirection: 'row' },
    splitHalf: { flex: 1 },
    splitBorderLeft: { borderLeftWidth: 1, borderLeftColor: c.line },
    segLabel: {
      fontFamily: typography.mono, fontSize: 9.5, color: c.fg3,
      letterSpacing: 0.8, textTransform: 'uppercase',
      paddingHorizontal: spacing[5] + 4, marginBottom: spacing[1],
    },
    segWrap: { paddingHorizontal: spacing[5] },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[sheet.root, { paddingBottom: insets.bottom + spacing[4] }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={sheet.handle} />
        <View style={sheet.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={sheet.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={sheet.sheetTitle}>Add Car</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={sheet.save}>Save</Text>
          </TouchableOpacity>
        </View>

        <CarImage tone={tone} style={sheet.carPreview} />

        <View style={sheet.form}>
          <CarField label="Make"  placeholder="BMW, Hyundai, Toyota…" />
          <CarField label="Model" placeholder="3 Series, Creta…" />
          <View style={sheet.splitRow}>
            <View style={sheet.splitHalf}>
              <CarField label="Year"  placeholder="2022" keyboardType="numeric" />
            </View>
            <View style={[sheet.splitHalf, sheet.splitBorderLeft]}>
              <CarField label="Color" placeholder="Mineral Grey" />
            </View>
          </View>
          <CarField label="Plate" placeholder="DL 4C AB 1234" isLast />
        </View>

        <Text style={sheet.segLabel}>BODY TONE</Text>
        <View style={sheet.segWrap}>
          <SegCtrl options={TONE_OPTIONS} value={tone} onChange={v => setTone(v as Tone)} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function CarsScreen() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const [sheetVisible, setSheetVisible] = useState(false);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    titleSection: { paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
    pageTitle: { fontFamily: typography.serif, fontSize: 32, color: c.fg, letterSpacing: -0.3 },
    addBtn: {
      width: 36, height: 36, borderRadius: radii.pill,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      alignItems: 'center', justifyContent: 'center',
    },
    carList: { paddingHorizontal: spacing[5], gap: spacing[3] },
    addCarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.line, paddingVertical: 16,
    },
    addCarBtnText: { fontFamily: typography.sansMedium, fontSize: 14, color: c.fg2 },
  });

  return (
    <>
      <ScrollView
        style={s.root}
        contentContainerStyle={{ paddingBottom: spacing[10] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top }}>
          <ScreenHeader
            title="Garage"
            trailing={
              <TouchableOpacity style={s.addBtn} onPress={() => setSheetVisible(true)} activeOpacity={0.7}>
                <Plus size={14} color={c.fg} strokeWidth={2} />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={s.titleSection}>
          <Text style={s.pageTitle}>Your garage.</Text>
        </View>

        <View style={s.carList}>
          {CARS.map(car => (
            <CarCard key={car.id} car={car} onEdit={() => {}} />
          ))}
          <TouchableOpacity style={s.addCarBtn} onPress={() => setSheetVisible(true)} activeOpacity={0.75}>
            <Plus size={16} color={c.fg2} strokeWidth={1.5} />
            <Text style={s.addCarBtnText}>Add Car</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddCarSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
}
