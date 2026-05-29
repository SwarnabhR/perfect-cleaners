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
import { useSharedStyles } from '../../theme/sharedStyles';
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
  const ss = useSharedStyles();
  const s = StyleSheet.create({
    field: { paddingHorizontal: spacing[4], paddingVertical: 11 },
    fieldBorder: { borderBottomWidth: 1, borderBottomColor: c.line },
    fieldInput: { fontFamily: typography.sans, fontSize: 14, color: c.fg, padding: 0 },
  });
  return (
    <View style={[s.field, !isLast && s.fieldBorder]}>
      <Text style={[ss.fieldLabel, { marginBottom: 4 }]}>{label}</Text>
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
  const ss = useSharedStyles();
  const s = StyleSheet.create({
    carCard: {
      backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.line, overflow: 'hidden',
    },
    heroWrap: { position: 'relative', height: 130 },
    carHero: { height: 130, borderRadius: 0, borderWidth: 0 },
    primaryBadge: {
      position: 'absolute', top: spacing[2], left: spacing[2],
      paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999,
      backgroundColor: c.sage,
    },
    primaryBadgeText: { fontFamily: typography.mono, fontSize: 9, color: '#fff', letterSpacing: 0.8 },
    carMeta: { padding: 14, gap: 4 },
    carName: { fontFamily: typography.sansMedium, fontSize: 15, color: c.fg },
    carDetail: { fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
    editBtn: {
      margin: spacing[2], marginTop: 0,
      borderRadius: radii.sm, paddingVertical: 10,
      alignItems: 'center', backgroundColor: c.cardHi,
      borderWidth: 1, borderColor: c.line,
    },
    editBtnText: { fontFamily: typography.sansMedium, fontSize: 12, color: c.fg2, letterSpacing: 0.4 },
  });
  return (
    <View style={s.carCard}>
      <View style={s.heroWrap}>
        <CarImage tone={car.tone} label={`${car.make} ${car.model}`} style={s.carHero} />
        {car.primary && (
          <View style={s.primaryBadge}>
            <Text style={s.primaryBadgeText}>PRIMARY</Text>
          </View>
        )}
      </View>
      <View style={s.carMeta}>
        <Text style={s.carName}>{car.make} {car.model} · {car.year}</Text>
        <Text style={[ss.eyebrow, { letterSpacing: 0.4 }]}>{car.plate}</Text>
        <Text style={s.carDetail}>{car.color}</Text>
      </View>
      <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.8}>
        <Text style={s.editBtnText}>EDIT</Text>
      </TouchableOpacity>
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
    preview: {
      marginHorizontal: spacing[5], height: 130, borderRadius: radii.md,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3], overflow: 'hidden',
    },
    form: {
      marginHorizontal: spacing[5], backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.line, overflow: 'hidden', marginBottom: spacing[3],
    },
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
          <Text style={sheet.sheetTitle}>Add Vehicle</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={sheet.save}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={sheet.preview}>
          <CarImage tone={tone} style={{ width: '100%', height: 130, borderRadius: 0 }} />
        </View>

        <View style={sheet.form}>
          <CarField label="Make"         placeholder="BMW, Hyundai, Toyota…" />
          <CarField label="Model"        placeholder="3 Series, Creta, Fortuner…" />
          <CarField label="Year"         placeholder="2022" keyboardType="numeric" />
          <CarField label="Plate Number" placeholder="DL 4C AB 1234" />
          <CarField label="Colour"       placeholder="Mineral Grey" isLast />
        </View>

        <Text style={sheet.segLabel}>TONE</Text>
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
  const ss = useSharedStyles();
  const [sheetVisible, setSheetVisible] = useState(false);

  const s = StyleSheet.create({
    addBtn: {
      width: 36, height: 36, borderRadius: radii.pill,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      alignItems: 'center', justifyContent: 'center',
    },
    carList: { paddingHorizontal: spacing[5], gap: spacing[3], paddingTop: spacing[2] },
    addWrap: { paddingHorizontal: spacing[5], paddingTop: spacing[3] },
    addNewBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.line, paddingVertical: 14,
    },
    addNewText: { fontFamily: typography.sansMedium, fontSize: 13, color: c.fg2, letterSpacing: 0.4 },
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
            title="Garage"
            trailing={
              <TouchableOpacity style={s.addBtn} onPress={() => setSheetVisible(true)} activeOpacity={0.7}>
                <Plus size={16} color={c.fg} strokeWidth={1.5} />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={ss.titleSection}>
          <Text style={ss.pageTitle}>Your garage.</Text>
        </View>

        <View style={s.carList}>
          {CARS.map(car => (
            <CarCard key={car.id} car={car} onEdit={() => setSheetVisible(true)} />
          ))}
        </View>

        <View style={s.addWrap}>
          <TouchableOpacity style={s.addNewBtn} onPress={() => setSheetVisible(true)} activeOpacity={0.8}>
            <Plus size={15} color={c.fg2} strokeWidth={1.5} />
            <Text style={s.addNewText}>ADD ANOTHER VEHICLE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddCarSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
}
