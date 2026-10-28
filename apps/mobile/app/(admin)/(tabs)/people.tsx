import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Linking, RefreshControl, Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Phone, Car, Bike, Plus, Trash2 } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import AdminScreen from '../../../components/AdminScreen';
import { useThemeColors } from '../../../theme';
import { formatClock } from '../../../lib/sessions';
import { postOrQueue } from '../../../lib/outbox';
import { useConnectivity } from '../../../lib/connectivity';
import { getCachedDocs } from '../../../lib/cache';

type Segment = 'customers' | 'workers';
type StatusFilter = 'active' | 'pending' | 'paused' | 'inactive';
type Tier = 'normal' | 'premium' | 'ultra';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LIMIT = 500;
const TIER_OPTIONS: Tier[] = ['normal', 'premium', 'ultra'];

interface CarRow { plate: string; make: string; model: string; category: 'car' | 'two-wheeler' }

interface Resident {
  id: string; customerName?: string; customerPhone?: string;
  societyId?: string; societyName?: string; tower?: string;
  unitNumber?: string; parkingNumber?: string; parkingLevel?: string;
  cars?: { plate: string; make: string; model: string; category?: string }[];
  preferredCleaningTime?: number; preferredCleaningDays?: number[];
  status?: string; paymentStatus?: string; monthlyFee?: number; tier?: string;
}
interface WorkerRow {
  id: string; name?: string; phone?: string; isOnline?: boolean; rating?: number; totalJobs?: number;
  carsCompletedToday?: number; assignedSocietyIds?: string[]; assignedSocietyNames?: string[]; assignedSocietyName?: string;
}

interface EditForm {
  name: string; phone: string; unit: string; parkingNumber: string; parkingLevel: string;
  cars: CarRow[]; tier: Tier;
}

const BLANK_FORM: EditForm = {
  name: '', phone: '', unit: '', parkingNumber: '', parkingLevel: '',
  cars: [{ plate: '', make: '', model: '', category: 'car' }], tier: 'normal',
};

export default function PeopleScreen() {
  const c = useThemeColors();
  const { refreshPending } = useConnectivity();
  const [segment, setSegment] = useState<Segment>('customers');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm>(BLANK_FORM);
  const [tierPricing, setTierPricing] = useState<{ normal: number; premium: number; ultra: number } | null>(null);
  const [twoWheelerFee, setTwoWheelerFee] = useState(0);
  const [saving, setSaving] = useState(false);

  // Residents can run to thousands of docs, so they are fetched once per status
  // (pull to refresh) rather than held open as a live listener. getCachedDocs
  // falls back to the local cache so the list still renders offline.
  const loadResidents = useCallback(async (st: StatusFilter) => {
    try {
      const docs = await getCachedDocs(
        firestore().collection('customerSocietyRecords').where('status', '==', st).limit(LIMIT),
      );
      setResidents(docs.map(d => ({ id: d.id, ...d.data() }) as Resident));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load customers.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadResidents(status).finally(() => setLoading(false));
  }, [status, loadResidents]);

  useEffect(() => {
    return firestore().collection('workers').onSnapshot(
      snap => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as WorkerRow)
        .sort((a, b) => Number(Boolean(b.isOnline)) - Number(Boolean(a.isOnline)) || (a.name ?? '').localeCompare(b.name ?? ''))),
      err => setError(err.message),
    );
  }, []);

  function startEdit(r: Resident) {
    setEditingId(r.id);
    setForm({
      name: r.customerName ?? '',
      phone: (r.customerPhone ?? '').replace(/\D/g, '').slice(-10),
      unit: r.unitNumber ?? '',
      parkingNumber: r.parkingNumber ?? '',
      parkingLevel: r.parkingLevel ?? '',
      cars: (r.cars?.length ? r.cars : [{ plate: '', make: '', model: '' }]).map(car => ({
        plate: car.plate ?? '', make: car.make ?? '', model: car.model ?? '',
        category: car.category === 'two-wheeler' ? 'two-wheeler' : 'car',
      })),
      tier: (r.tier as Tier | undefined) ?? 'normal',
    });
    setTierPricing(null);
    setTwoWheelerFee(0);
    // Tower pricing, so we can offer a tier picker and preview the fee.
    getCachedDocs(
      firestore().collection('societyBillingConfig')
        .where('societyId', '==', r.societyId ?? '')
        .where('tower', '==', r.tower ?? ''),
    ).then(docs => {
      const cfg = docs[0]?.data();
      setTierPricing((cfg?.tierPricing as { normal: number; premium: number; ultra: number } | undefined) ?? null);
      setTwoWheelerFee((cfg?.twoWheelerFee as number | undefined) ?? 0);
    }).catch(() => {});
  }

  const cleanedCars = form.cars.filter(car => car.plate.trim() || car.make.trim() || car.model.trim());
  const hasTwoWheeler = cleanedCars.some(car => car.category === 'two-wheeler');
  const canSave = Boolean(form.name.trim() && form.unit.trim()) && form.phone.length === 10
    && cleanedCars.length > 0 && cleanedCars.every(car => car.plate.trim());
  const baseFee = tierPricing ? tierPricing[form.tier] : 0;
  const feePreview = (tierPricing ? baseFee : 0) + (hasTwoWheeler ? twoWheelerFee : 0);

  function updateCar(i: number, patch: Partial<CarRow>) {
    setForm(f => ({ ...f, cars: f.cars.map((car, idx) => (idx === i ? { ...car, ...patch } : car)) }));
  }
  function addCar() {
    setForm(f => ({ ...f, cars: [...f.cars, { plate: '', make: '', model: '', category: 'car' }] }));
  }
  function removeCar(i: number) {
    setForm(f => ({ ...f, cars: f.cars.length > 1 ? f.cars.filter((_, idx) => idx !== i) : f.cars }));
  }

  async function saveEdit(r: Resident) {
    if (saving || !canSave) return;
    setSaving(true);
    const changes = {
      customerName:  form.name.trim(),
      customerPhone: form.phone,
      unitNumber:    form.unit.trim(),
      parkingNumber: form.parkingNumber.trim(),
      parkingLevel:  form.parkingLevel.trim(),
      cars: cleanedCars.map(car => ({
        plate: car.plate.trim().toUpperCase(), make: car.make.trim(), model: car.model.trim(), category: car.category,
      })),
      ...(tierPricing ? { tier: form.tier } : {}),
    };
    try {
      const res = await postOrQueue('/api/admin/update-society-record', { recordId: r.id, changes });
      if (res.queued) refreshPending();
      // Optimistic — reflect the edit now, online or offline.
      setResidents(prev => prev.map(x => x.id === r.id ? {
        ...x,
        customerName:  changes.customerName,
        customerPhone: `+91${changes.customerPhone}`,
        unitNumber:    changes.unitNumber,
        parkingNumber: changes.parkingNumber || undefined,
        parkingLevel:  changes.parkingLevel || undefined,
        cars:          changes.cars,
        tier:          tierPricing ? form.tier : x.tier,
      } : x));
      setEditingId(null);
      if (res.queued) Alert.alert('Saved offline', 'This change will sync when you are back online.');
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function togglePause(r: Resident) {
    const next = r.status === 'active' ? 'paused' : 'active';
    Alert.alert(
      next === 'paused' ? 'Pause customer' : 'Reactivate customer',
      next === 'paused'
        ? `Pause ${r.customerName ?? 'this customer'}? Cleanings already scheduled are not removed.`
        : `Reactivate ${r.customerName ?? 'this customer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next === 'paused' ? 'Pause' : 'Reactivate',
          onPress: async () => {
            try {
              const res = await postOrQueue('/api/admin/update-society-record', { recordId: r.id, changes: { status: next } });
              if (res.queued) refreshPending();
              setResidents(prev => prev
                .map(x => (x.id === r.id ? { ...x, status: next } : x))
                .filter(x => (next === status ? true : x.id !== r.id)));
              if (res.queued) Alert.alert('Saved offline', 'This change will sync when you are back online.');
            } catch (err) {
              Alert.alert('Could not update', err instanceof Error ? err.message : 'Please try again.');
            }
          },
        },
      ],
    );
  }

  const q = search.trim().toLowerCase();
  const match = (...vals: (string | undefined)[]) => !q || vals.some(v => (v ?? '').toLowerCase().includes(q));

  const shownResidents = residents
    .filter(r => match(r.customerName, r.customerPhone, r.societyName, r.tower, r.unitNumber, ...(r.cars ?? []).map(x => x.plate)))
    .sort((a, b) => (a.customerName ?? '').localeCompare(b.customerName ?? ''));
  const shownWorkers = workers.filter(w => match(w.name, w.phone));

  const callBtn = (phone?: string, name?: string) => phone ? (
    <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)} style={s.call} accessibilityLabel={`Call ${name ?? ''}`}>
      <Phone size={16} color={c.info} strokeWidth={1.5} />
    </TouchableOpacity>
  ) : null;

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      style={[s.chip, { borderColor: active ? c.sage : c.line, backgroundColor: active ? c.sageFaint : 'transparent' }]}
    >
      <Text style={[s.chipText, { color: active ? c.fg : c.fg2 }]}>{label.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  const header = (
    <View style={{ gap: spacing[3] }}>
      <View style={s.chips}>
        {chip(`Customers`, segment === 'customers', () => setSegment('customers'))}
        {chip(`Workers · ${workers.length}`, segment === 'workers', () => setSegment('workers'))}
      </View>
      {segment === 'customers' ? (
        <View style={s.chips}>
          {(['active', 'pending', 'paused', 'inactive'] as StatusFilter[]).map(st => chip(st, status === st, () => setStatus(st)))}
        </View>
      ) : null}
      <TextInput
        style={[s.input, { backgroundColor: c.card, borderColor: c.lineStrong, color: c.fg }]}
        value={search}
        onChangeText={setSearch}
        placeholder={segment === 'customers' ? 'Search name, phone, flat, plate' : 'Search name or phone'}
        placeholderTextColor={c.fg4}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {segment === 'customers' ? (
        <Text style={[s.mono, { color: c.fg3 }]}>
          {shownResidents.length} SHOWN{residents.length >= LIMIT ? ` · FIRST ${LIMIT} ONLY, USE SEARCH` : ''}
        </Text>
      ) : null}
      {error ? <Text style={[s.note, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );

  return (
    <AdminScreen eyebrow="[ADMIN] [04]" title="People">
      {loading && segment === 'customers' ? (
        <ActivityIndicator style={{ marginTop: spacing[8] }} color={c.fg3} />
      ) : segment === 'customers' ? (
        <FlatList
          data={shownResidents}
          keyExtractor={r => r.id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={<Text style={[s.note, { color: c.fg3 }]}>No customers found.</Text>}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={c.fg3}
              onRefresh={async () => { setRefreshing(true); await loadResidents(status); setRefreshing(false); }}
            />
          }
          renderItem={({ item: r }) => {
            const open = openId === r.id;
            const twoWheelers = (r.cars ?? []).filter(car => car.category === 'two-wheeler').length;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpenId(open ? null : r.id)}
                style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}
              >
                <View style={s.rowBetween}>
                  <Text style={[s.name, { color: c.fg }]} numberOfLines={1}>{r.customerName || '—'}</Text>
                  {callBtn(r.customerPhone, r.customerName)}
                </View>
                <Text style={[s.meta, { color: c.fg2 }]}>
                  {[r.societyName, r.tower, r.unitNumber && `Flat ${r.unitNumber}`].filter(Boolean).join(' · ')}
                </Text>
                <Text style={[s.mono, { color: c.fg3 }]}>
                  {(r.cars?.length ?? 0)} VEHICLE{r.cars?.length === 1 ? '' : 'S'}
                  {twoWheelers > 0 ? ` · ${twoWheelers}× 2W` : ''}
                  {r.paymentStatus ? ` · ${r.paymentStatus.replace(/_/g, ' ').toUpperCase()}` : ''}
                </Text>
                {open ? (
                  <View style={[s.detail, { borderTopColor: c.line }]}>
                    {(r.cars ?? []).map(car => (
                      <Text key={car.plate} style={[s.meta, { color: c.fg }]}>
                        {car.make} {car.model} · {car.plate}{car.category === 'two-wheeler' ? ' · 2W' : ''}
                      </Text>
                    ))}
                    <Text style={[s.meta, { color: c.fg2 }]}>
                      {[r.parkingLevel, r.parkingNumber].filter(Boolean).join(' · ') || 'No parking recorded'}
                    </Text>
                    <Text style={[s.meta, { color: c.fg2 }]}>
                      {typeof r.preferredCleaningTime === 'number' ? formatClock(r.preferredCleaningTime) : '—'}
                      {' · '}
                      {r.preferredCleaningDays?.length ? [...r.preferredCleaningDays].sort().map(d => DAY_LABELS[d]).join(', ') : 'All tower days'}
                    </Text>
                    <Text style={[s.meta, { color: c.fg2 }]}>
                      {typeof r.monthlyFee === 'number' ? `₹${r.monthlyFee.toLocaleString('en-IN')} / ${r.tier ?? 'standard'}` : ''}
                    </Text>

                    {editingId === r.id ? (
                      <View style={{ gap: spacing[2], marginTop: spacing[2] }}>
                        {([
                          ['name', 'Name', 'default'], ['phone', 'Phone (10 digits)', 'number-pad'], ['unit', 'Flat / unit', 'default'],
                          ['parkingNumber', 'Parking slot (optional)', 'default'], ['parkingLevel', 'Parking level (optional)', 'default'],
                        ] as const).map(([key, label, kb]) => (
                          <TextInput
                            key={key}
                            style={[s.input, { backgroundColor: c.inkRaised, borderColor: c.lineStrong, color: c.fg }]}
                            value={form[key]}
                            onChangeText={t => setForm(f => ({ ...f, [key]: key === 'phone' ? t.replace(/\D/g, '').slice(0, 10) : t }))}
                            placeholder={label}
                            placeholderTextColor={c.fg4}
                            keyboardType={kb}
                            maxLength={key === 'phone' ? 10 : 80}
                          />
                        ))}

                        {/* Vehicles — add, edit and remove cars / two-wheelers */}
                        <View style={s.vehHeader}>
                          <Text style={[s.mono, { color: c.fg3 }]}>VEHICLES</Text>
                          <TouchableOpacity onPress={addCar} style={[s.addCar, { borderColor: c.line }]}>
                            <Plus size={12} color={c.fg2} strokeWidth={2} />
                            <Text style={[s.addCarText, { color: c.fg2 }]}>ADD</Text>
                          </TouchableOpacity>
                        </View>
                        {form.cars.map((car, i) => (
                          <View key={i} style={[s.carRow, { borderColor: c.line, backgroundColor: c.inkRaised }]}>
                            <View style={s.rowBetween}>
                              <View style={s.catChips}>
                                {(['car', 'two-wheeler'] as const).map(cat => {
                                  const active = car.category === cat;
                                  return (
                                    <TouchableOpacity
                                      key={cat}
                                      onPress={() => updateCar(i, { category: cat })}
                                      style={[s.catChip, { borderColor: active ? c.sage : c.line, backgroundColor: active ? c.sageFaint : 'transparent' }]}
                                    >
                                      {cat === 'two-wheeler'
                                        ? <Bike size={12} color={active ? c.fg : c.fg2} strokeWidth={1.5} />
                                        : <Car  size={12} color={active ? c.fg : c.fg2} strokeWidth={1.5} />}
                                      <Text style={[s.catChipText, { color: active ? c.fg : c.fg2 }]}>{cat === 'two-wheeler' ? '2W' : 'CAR'}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                              {form.cars.length > 1 ? (
                                <TouchableOpacity onPress={() => removeCar(i)} hitSlop={8} accessibilityLabel="Remove vehicle">
                                  <Trash2 size={15} color={c.danger} strokeWidth={1.5} />
                                </TouchableOpacity>
                              ) : null}
                            </View>
                            <TextInput
                              style={[s.input, { backgroundColor: c.card, borderColor: c.lineStrong, color: c.fg }]}
                              value={car.plate}
                              onChangeText={t => updateCar(i, { plate: t.toUpperCase() })}
                              placeholder="Plate (e.g. DL 01 AB 1234)"
                              placeholderTextColor={c.fg4}
                              autoCapitalize="characters"
                              maxLength={16}
                            />
                            <View style={s.carMakeRow}>
                              <TextInput
                                style={[s.input, s.carMakeInput, { backgroundColor: c.card, borderColor: c.lineStrong, color: c.fg }]}
                                value={car.make}
                                onChangeText={t => updateCar(i, { make: t })}
                                placeholder="Make"
                                placeholderTextColor={c.fg4}
                                maxLength={40}
                              />
                              <TextInput
                                style={[s.input, s.carMakeInput, { backgroundColor: c.card, borderColor: c.lineStrong, color: c.fg }]}
                                value={car.model}
                                onChangeText={t => updateCar(i, { model: t })}
                                placeholder="Model"
                                placeholderTextColor={c.fg4}
                                maxLength={40}
                              />
                            </View>
                          </View>
                        ))}

                        {/* Tier picker — only when this tower prices tiers */}
                        {tierPricing ? (
                          <View style={s.catChips}>
                            {TIER_OPTIONS.map(t => chip(t, form.tier === t, () => setForm(f => ({ ...f, tier: t }))))}
                          </View>
                        ) : null}
                        {tierPricing ? (
                          <Text style={[s.mono, { color: c.fg3 }]}>
                            FEE ₹{feePreview.toLocaleString('en-IN')} / MO
                          </Text>
                        ) : null}

                        <View style={s.actions}>
                          <TouchableOpacity style={[s.btnGhost, { borderColor: c.lineStrong }]} onPress={() => setEditingId(null)} disabled={saving}>
                            <Text style={[s.btnText, { color: c.fg2 }]}>CANCEL</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[s.btnPrimary, { backgroundColor: c.warm, opacity: saving || !canSave ? 0.4 : 1 }]}
                            onPress={() => saveEdit(r)}
                            disabled={saving || !canSave}
                          >
                            <Text style={[s.btnText, { color: c.ink }]}>{saving ? 'SAVING...' : 'SAVE'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={s.actions}>
                        {r.status === 'active' || r.status === 'paused' ? (
                          <TouchableOpacity style={[s.btnGhost, { borderColor: c.lineStrong }]} onPress={() => togglePause(r)}>
                            <Text style={[s.btnText, { color: r.status === 'active' ? c.warning : c.success }]}>
                              {r.status === 'active' ? 'PAUSE' : 'REACTIVATE'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity style={[s.btnPrimary, { backgroundColor: c.warm }]} onPress={() => startEdit(r)}>
                          <Text style={[s.btnText, { color: c.ink }]}>EDIT DETAILS</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          data={shownWorkers}
          keyExtractor={w => w.id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={<Text style={[s.note, { color: c.fg3 }]}>No workers found.</Text>}
          renderItem={({ item: w }) => {
            const societies = w.assignedSocietyNames?.length ? w.assignedSocietyNames : w.assignedSocietyName ? [w.assignedSocietyName] : [];
            return (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
                <View style={s.rowBetween}>
                  <View style={s.nameRow}>
                    <View style={[s.dot, { backgroundColor: w.isOnline ? c.success : c.fg4 }]} />
                    <Text style={[s.name, { color: c.fg }]} numberOfLines={1}>{w.name || '—'}</Text>
                  </View>
                  {callBtn(w.phone, w.name)}
                </View>
                <Text style={[s.mono, { color: w.isOnline ? c.success : c.fg3 }]}>{w.isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
                <Text style={[s.meta, { color: c.fg2 }]}>
                  {societies.length ? societies.join(', ') : 'No society assigned'}
                </Text>
                <Text style={[s.mono, { color: c.fg3 }]}>
                  {w.carsCompletedToday ?? 0} CARS TODAY · {w.totalJobs ?? 0} JOBS · {typeof w.rating === 'number' ? `${w.rating.toFixed(1)}★` : 'NO RATING'}
                </Text>
              </View>
            );
          }}
        />
      )}
    </AdminScreen>
  );
}

const s = StyleSheet.create({
  list:        { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  note:        { fontFamily: typography.sans, fontSize: 14, textAlign: 'center', marginTop: spacing[4] },
  card:        { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: 4 },
  rowBetween:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  name:        { fontFamily: typography.sansSemiBold, fontSize: 16, flexShrink: 1 },
  meta:        { fontFamily: typography.sans, fontSize: 13 },
  mono:        { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8, flexShrink: 1 },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  chipText:    { fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.8 },
  input:       { borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: spacing[3], height: 48, fontFamily: typography.sans, fontSize: 14 },
  call:        { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  detail:      { borderTopWidth: 1, marginTop: spacing[2], paddingTop: spacing[2], gap: 4 },
  actions:     { flexDirection: 'row', gap: 10, marginTop: spacing[2] },
  btnGhost:    { flex: 1, borderWidth: 1, borderRadius: radii.pill, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  btnPrimary:  { flex: 1.4, borderRadius: radii.pill, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  btnText:     { fontFamily: typography.sansSemiBold, fontSize: 12, letterSpacing: 0.6 },
  vehHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  addCar:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  addCarText:  { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.6 },
  carRow:      { borderWidth: 1, borderRadius: radii.sm, padding: spacing[3], gap: 8 },
  catChips:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  catChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  catChipText: { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.6 },
  carMakeRow:  { flexDirection: 'row', gap: 8 },
  carMakeInput:{ flex: 1 },
});
