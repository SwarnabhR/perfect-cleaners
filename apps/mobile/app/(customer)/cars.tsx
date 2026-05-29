import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { CarImage } from '@pc/ui';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, SegCtrl } from '../../components/RowGroup';

type Tone = 'dark' | 'sage' | 'light';

interface Car {
  id:      string;
  make:    string;
  model:   string;
  year:    number;
  plate:   string;
  color:   string;
  tone:    Tone;
  primary: boolean;
}

const TONE_OPTIONS = [
  { value: 'dark',  label: 'Dark'  },
  { value: 'light', label: 'Light' },
  { value: 'sage',  label: 'Sage'  },
];

// ─── Controlled form field ────────────────────────────────────────────────────
function CarField({
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

// ─── Car Card ─────────────────────────────────────────────────────────────────
function CarCard({ car, onEdit }: { car: Car; onEdit: () => void }) {
  const c = useThemeColors();
  const s = StyleSheet.create({
    carCard:      { backgroundColor: c.card, borderRadius: radii.md, borderWidth: 1, borderColor: c.line, overflow: 'hidden' },
    heroWrap:     { position: 'relative', height: 130 },
    carHero:      { height: 130, borderRadius: 0, borderWidth: 0 },
    primaryBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    primaryBadgeText: { fontFamily: typography.mono, fontSize: 9, color: '#fff', letterSpacing: 0.8 },
    carOverlay:   { position: 'absolute', bottom: 12, left: 14, right: 14 },
    carYearColor: { fontFamily: typography.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.6 },
    carName:      { fontFamily: typography.sansSemiBold, fontSize: 20, color: '#fff', letterSpacing: -0.3, marginTop: 2 },
    carFooter:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
    plateBadge:   { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radii.xs, paddingHorizontal: 10, paddingVertical: 6 },
    plateText:    { fontFamily: typography.mono, fontSize: 13, color: '#fff', letterSpacing: 0.8 },
    editBtn:      { backgroundColor: c.cardHi, borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: c.lineStrong },
    editBtnText:  { fontFamily: typography.sansMedium, fontSize: 12, color: c.fg2, letterSpacing: 0.4 },
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
        <View style={s.carOverlay}>
          <Text style={s.carYearColor}>{car.year} · {car.color.toUpperCase()}</Text>
          <Text style={s.carName}>{car.make} {car.model}</Text>
        </View>
      </View>
      <View style={s.carFooter}>
        <View style={s.plateBadge}>
          <Text style={s.plateText}>{car.plate || '—'}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.75}>
          <Text style={s.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Add Car Sheet ────────────────────────────────────────────────────────────
function AddCarSheet({
  visible, onClose, onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: (car: Car) => void;
}) {
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();

  const [make,   setMake]   = useState('');
  const [model,  setModel]  = useState('');
  const [year,   setYear]   = useState(String(new Date().getFullYear()));
  const [plate,  setPlate]  = useState('');
  const [color,  setColor]  = useState('');
  const [tone,   setTone]   = useState<Tone>('dark');
  const [saving, setSaving] = useState(false);

  function reset() {
    setMake(''); setModel(''); setYear(String(new Date().getFullYear()));
    setPlate(''); setColor(''); setTone('dark');
  }

  async function handleSave() {
    if (!make.trim() || !model.trim() || saving) return;
    setSaving(true);
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Not signed in');

      const car: Car = {
        id:      `v_${Date.now()}`,
        make:    make.trim(),
        model:   model.trim(),
        year:    parseInt(year) || new Date().getFullYear(),
        plate:   plate.trim().toUpperCase(),
        color:   color.trim(),
        tone,
        primary: false,
      };

      // Store cars as an array field on the customer document
      await firestore()
        .collection('customers')
        .doc(user.uid)
        .update({
          vehicles: firestore.FieldValue.arrayUnion({
            id:           car.id,
            make:         car.make,
            model:        car.model,
            year:         car.year,
            type:         'sedan',
            registration: car.plate,
            color:        car.color,
          }),
        });

      onSaved(car);
      reset();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save vehicle.');
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
    preview:    { marginHorizontal: spacing[5], height: 150, marginBottom: spacing[4] },
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
          <Text style={sheet.sheetTitle}>Add Car</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7} disabled={saving}>
            <Text style={sheet.save}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <CarImage tone={tone} style={sheet.preview} />

        <View style={sheet.form}>
          <CarField label="Make"         placeholder="BMW, Hyundai, Toyota…"  value={make}  onChangeText={setMake} />
          <CarField label="Model"        placeholder="3 Series, Creta…"        value={model} onChangeText={setModel} />
          <CarField label="Year"         placeholder="2022" keyboardType="numeric" value={year} onChangeText={setYear} />
          <CarField label="Plate Number" placeholder="DL 4C AB 1234"           value={plate} onChangeText={v => setPlate(v.toUpperCase())} />
          <CarField label="Colour"       placeholder="Mineral Grey"             value={color} onChangeText={setColor} isLast />
        </View>

        <Text style={sheet.segLabel}>BODY TONE</Text>
        <View style={sheet.segWrap}>
          <SegCtrl options={TONE_OPTIONS} value={tone} onChange={v => setTone(v as Tone)} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CarsScreen() {
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();
  const ss     = useSharedStyles();
  const [cars,         setCars]         = useState<Car[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Load vehicles from Firestore customer document
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    return firestore()
      .collection('customers')
      .doc(user.uid)
      .onSnapshot(
        snap => {
          if (Boolean(snap.exists)) {
            const vehicles = (snap.data()?.vehicles ?? []) as Array<{
              id: string; make: string; model: string; year: number;
              registration: string; color: string;
            }>;
            setCars(vehicles.map((v, i) => ({
              id:      v.id,
              make:    v.make,
              model:   v.model,
              year:    v.year,
              plate:   v.registration,
              color:   v.color,
              tone:    'dark' as Tone,
              primary: i === 0,
            })));
          }
        },
        err => console.warn('[Cars] Firestore:', err.message),
      );
  }, []);

  const s = StyleSheet.create({
    titleSection: { paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
    addBtn:       { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
    carList:      { paddingHorizontal: spacing[5], gap: spacing[3] },
    addCarBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.card, borderRadius: radii.md, borderWidth: 1, borderColor: c.line, paddingVertical: 16 },
    addCarBtnText:{ fontFamily: typography.sansMedium, fontSize: 14, color: c.fg2 },
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
                <Plus size={14} color={c.fg} strokeWidth={2} />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={s.titleSection}>
          <Text style={ss.pageTitle}>Your garage.</Text>
        </View>

        <View style={s.carList}>
          {cars.map(car => (
            <CarCard key={car.id} car={car} onEdit={() => {}} />
          ))}
          <TouchableOpacity style={s.addCarBtn} onPress={() => setSheetVisible(true)} activeOpacity={0.75}>
            <Plus size={16} color={c.fg2} strokeWidth={1.5} />
            <Text style={s.addCarBtnText}>Add Car</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddCarSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSaved={car => setCars(prev => [...prev, car])}
      />
    </>
  );
}
