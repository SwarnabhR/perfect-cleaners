import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight, Plus, MapPin, Bell, CreditCard,
  Users, HelpCircle, LogOut,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';
import PCMonogram from '../../../components/PCMonogram';

const CARS = [
  ['BMW 3 Series', 'DL 4C AB 1234', 'Mineral Grey'],
  ['Hyundai Creta', 'DL 8C XY 0921', 'Phantom Black'],
];

const PREFERENCES = [
  ['map-pin', 'Saved Addresses'],
  ['bell', 'Notifications'],
  ['credit-card', 'Payment Methods'],
  ['users', 'Refer & Earn'],
  ['help-circle', 'Help & Support'],
  ['log-out', 'Sign Out'],
];

const PREF_ICONS: Record<string, React.ReactNode> = {
  'map-pin': <MapPin size={16} color={colors.fg2} strokeWidth={1.5} />,
  bell: <Bell size={16} color={colors.fg2} strokeWidth={1.5} />,
  'credit-card': <CreditCard size={16} color={colors.fg2} strokeWidth={1.5} />,
  users: <Users size={16} color={colors.fg2} strokeWidth={1.5} />,
  'help-circle': <HelpCircle size={16} color={colors.fg2} strokeWidth={1.5} />,
  'log-out': <LogOut size={16} color={colors.fg2} strokeWidth={1.5} />,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={s.monogram}>
          <PCMonogram size={18} color={colors.warm} />
        </View>
      </View>

      <View style={s.sectionHead}>
        <Text style={s.pageTitle}>Your account.</Text>
      </View>

      {/* User card */}
      <View style={s.userCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>AM</Text>
        </View>
        <View style={s.userInfo}>
          <Text style={s.userName}>Aarav Mehta</Text>
          <Text style={s.userPhone}>+91 98765 43210</Text>
        </View>
        <ChevronRight size={16} color={colors.fg3} strokeWidth={1.5} />
      </View>

      {/* Cars */}
      <View style={s.section}>
        <Text style={s.eyebrow}>[YOUR CARS]</Text>
        <View style={s.carsList}>
          {CARS.map(([name, plate, color]) => (
            <View key={plate} style={s.carCard}>
              <View style={s.carIcon}>
                <View style={s.carShape} />
              </View>
              <View style={s.carInfo}>
                <Text style={s.carName}>{name}</Text>
                <Text style={s.carPlate}>{plate}</Text>
                <Text style={s.carColor}>{color}</Text>
              </View>
              <ChevronRight size={14} color={colors.fg3} strokeWidth={1.5} />
            </View>
          ))}
          <TouchableOpacity style={s.addCar} activeOpacity={0.75}>
            <Plus size={14} color={colors.fg2} strokeWidth={1.5} />
            <Text style={s.addCarText}>Add Car</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferences */}
      <View style={s.section}>
        <Text style={s.eyebrow}>[PREFERENCES]</Text>
        <View style={s.prefCard}>
          {PREFERENCES.map(([icon, label], i, arr) => (
            <TouchableOpacity
              key={label}
              style={[
                s.prefItem,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line },
              ]}
              activeOpacity={0.7}
            >
              {PREF_ICONS[icon]}
              <Text style={s.prefLabel}>{label}</Text>
              <ChevronRight size={14} color={colors.fg3} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingBottom: spacing[3],
  },
  monogram: {
    width: 32, height: 32, borderRadius: radii.sm,
    backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center',
  },

  sectionHead: { paddingHorizontal: spacing[5] },
  pageTitle: {
    fontFamily: typography.serif, fontSize: 32, color: colors.fg, letterSpacing: -0.3,
  },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: spacing[5], marginTop: spacing[4],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: spacing[4],
  },
  avatar: {
    width: 52, height: 52, borderRadius: 999, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: typography.sansSemiBold, fontSize: 20, color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontFamily: typography.sansMedium, fontSize: 16, color: colors.fg },
  userPhone: { fontFamily: typography.sans, fontSize: 12, color: colors.fg2 },

  section: { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
  carsList: { marginTop: spacing[2], gap: spacing[1] },
  carCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: 12,
  },
  carIcon: {
    width: 80, height: 50, borderRadius: radii.sm, overflow: 'hidden',
    backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  carShape: {
    width: 64, height: 24, borderRadius: 4,
    backgroundColor: colors.ink, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  carInfo: { flex: 1 },
  carName: { fontFamily: typography.sansMedium, fontSize: 14, color: colors.fg },
  carPlate: { fontFamily: typography.mono, fontSize: 10, color: colors.fg3, letterSpacing: 0.8 },
  carColor: { fontFamily: typography.sans, fontSize: 11, color: colors.fg2 },
  addCar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: 14,
  },
  addCarText: { fontFamily: typography.sansMedium, fontSize: 12, color: colors.fg2, letterSpacing: 0.6, textTransform: 'uppercase' },

  prefCard: {
    marginTop: spacing[2],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, overflow: 'hidden',
  },
  prefItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: spacing[4],
  },
  prefLabel: { flex: 1, fontFamily: typography.sans, fontSize: 14, color: colors.fg },
});
