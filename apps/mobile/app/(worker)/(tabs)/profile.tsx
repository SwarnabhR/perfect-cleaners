import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin, Star, Settings, Phone, CreditCard, Shield,
  HelpCircle, LogOut, ChevronRight, Check,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';

const SKILLS: [string, boolean][] = [
  ['Exterior Wash', true],
  ['Interior Detailing', true],
  ['Ceramic Coating', true],
  ['Paint Protection Film', false],
  ['Engine Bay', true],
  ['Leather Conditioning', true],
];

const RATINGS = [
  ['Aarav M.', 5, 'Spotless work. Showed up 5 minutes early.', '2 hrs ago'],
  ['Priya S.', 5, 'Best detail I have ever had on this car.', 'Yesterday'],
  ['Vikram P.', 4, 'Great job. Took slightly longer than promised but no complaints.', '2 days ago'],
];

const SETTINGS = [
  ['phone', 'Contact details'],
  ['credit-card', 'Bank & payouts'],
  ['shield', 'Documents & insurance'],
  ['help-circle', 'Help & support'],
  ['log-out', 'Sign out'],
];

const SETTINGS_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone size={16} color={colors.fg2} strokeWidth={1.5} />,
  'credit-card': <CreditCard size={16} color={colors.fg2} strokeWidth={1.5} />,
  shield: <Shield size={16} color={colors.fg2} strokeWidth={1.5} />,
  'help-circle': <HelpCircle size={16} color={colors.fg2} strokeWidth={1.5} />,
  'log-out': <LogOut size={16} color={colors.fg2} strokeWidth={1.5} />,
};

export default function WorkerProfile() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={[s.banner, { paddingTop: insets.top }]}>
        <TouchableOpacity style={s.settingsBtn}>
          <Settings size={15} color={colors.fg} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Overlapping avatar */}
      <View style={s.profileHead}>
        <View style={s.bigAvatar}>
          <Text style={s.bigAvatarText}>RS</Text>
        </View>
        <View style={s.profileInfo}>
          <Text style={s.eyebrow}>[TECHNICIAN] · 02 YRS</Text>
          <Text style={s.profileName}>Rahul Sharma</Text>
          <View style={s.profileLocation}>
            <MapPin size={11} color={colors.fg2} strokeWidth={1.5} />
            <Text style={s.profileLocationText}>Ghaziabad · Indirapuram zone</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsGrid}>
        {[
          ['JOBS DONE', '312', 'lifetime'],
          ['AVG RATING', '4.9', 'last 30'],
          ['ON-TIME', '97%', 'last 30'],
        ].map(([k, v, sub]) => (
          <View key={k} style={s.statCard}>
            <Text style={s.eyebrow}>{k}</Text>
            <Text style={s.statValue}>{v}</Text>
            <Text style={s.statSub}>{sub.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      {/* Availability */}
      <View style={s.availCard}>
        <View style={s.availIcon}>
          <View style={s.availDot} />
        </View>
        <View style={s.availInfo}>
          <Text style={s.availTitle}>Available for jobs</Text>
          <Text style={s.availSub}>Receiving assignments until 8:00 PM</Text>
        </View>
        <View style={s.toggle}>
          <View style={s.toggleKnob} />
        </View>
      </View>

      {/* Skills */}
      <View style={s.section}>
        <Text style={s.eyebrow}>[SKILLS · CERTIFICATIONS]</Text>
        <View style={s.skillsRow}>
          {SKILLS.map(([label, certified]) => (
            <View
              key={label}
              style={[
                s.skillChip,
                certified && s.skillChipCertified,
              ]}
            >
              {certified && <Check size={11} color={colors.sageHi} strokeWidth={2.5} />}
              <Text style={[s.skillChipText, certified && s.skillChipTextCertified]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Ratings */}
      <View style={s.section}>
        <Text style={s.eyebrow}>[RECENT RATINGS] · 312 TOTAL</Text>
        <View style={s.ratingList}>
          {RATINGS.map(([name, stars, body, when], i) => (
            <View key={i} style={s.ratingCard}>
              <View style={s.ratingHead}>
                <View style={s.ratingUser}>
                  <View style={s.ratingAvatar}>
                    <Text style={s.ratingAvatarText}>
                      {(name as string).split(' ').map(s => s[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text style={s.ratingName}>{name}</Text>
                    <Text style={s.ratingTime}>{(when as string).toUpperCase()}</Text>
                  </View>
                </View>
                <View style={s.starsRow}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={12}
                      color={j < (stars as number) ? colors.gold : colors.fg4}
                      strokeWidth={1.5}
                      fill={j < (stars as number) ? colors.gold : 'transparent'}
                    />
                  ))}
                </View>
              </View>
              <Text style={s.ratingBody}>{body}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={s.section}>
        <Text style={s.eyebrow}>[SETTINGS]</Text>
        <View style={s.settingsCard}>
          {SETTINGS.map(([icon, label], i, arr) => (
            <TouchableOpacity
              key={label}
              style={[
                s.settingsItem,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line },
              ]}
            >
              {SETTINGS_ICONS[icon]}
              <Text style={s.settingsLabel}>{label}</Text>
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

  banner: {
    height: 120, overflow: 'hidden',
    backgroundColor: colors.inkRaised,
    borderBottomWidth: 1, borderBottomColor: colors.line,
    alignItems: 'flex-end', paddingHorizontal: spacing[4],
  },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },

  profileHead: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 14,
    paddingHorizontal: spacing[5], marginTop: -52,
  },
  bigAvatar: {
    width: 92, height: 92, borderRadius: 999, backgroundColor: colors.sage,
    borderWidth: 4, borderColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: { fontFamily: typography.sansSemiBold, fontSize: 32, color: '#fff' },
  profileInfo: { flex: 1, paddingBottom: spacing[2] },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
  profileName: { fontFamily: typography.serif, fontSize: typography['2xl'], color: colors.fg, letterSpacing: -0.3 },
  profileLocation: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  profileLocationText: { fontFamily: typography.sans, fontSize: 12, color: colors.fg2 },

  statsGrid: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: spacing[5], paddingTop: spacing[5],
  },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: 14, gap: 4,
  },
  statValue: { fontFamily: typography.sansSemiBold, fontSize: 22, color: colors.fg, letterSpacing: -0.3 },
  statSub: { fontFamily: typography.mono, fontSize: 9, color: colors.fg3, letterSpacing: 0.6 },

  availCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: spacing[5], marginTop: spacing[5],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: spacing[4],
  },
  availIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(111,174,106,0.16)',
    borderWidth: 1, borderColor: 'rgba(111,174,106,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  availDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.success },
  availInfo: { flex: 1 },
  availTitle: { fontFamily: typography.sansMedium, fontSize: 14, color: colors.fg },
  availSub: { fontFamily: typography.sans, fontSize: 11.5, color: colors.fg2 },
  toggle: {
    width: 40, height: 22, borderRadius: 999,
    backgroundColor: colors.sage, justifyContent: 'center',
  },
  toggleKnob: {
    width: 18, height: 18, borderRadius: 999,
    backgroundColor: '#fff', alignSelf: 'flex-end', marginRight: 2,
  },

  section: { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing[2] },
  skillChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: colors.line,
  },
  skillChipCertified: {
    backgroundColor: 'rgba(91,111,82,0.18)',
    borderColor: 'rgba(91,111,82,0.5)',
  },
  skillChipText: { fontFamily: typography.sans, fontSize: 12, color: colors.fg2 },
  skillChipTextCertified: { color: '#fff' },

  ratingList: { marginTop: spacing[2], gap: 8 },
  ratingCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: 14, gap: 8,
  },
  ratingHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingUser: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingAvatar: {
    width: 28, height: 28, borderRadius: 999, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  ratingAvatarText: { fontFamily: typography.sansSemiBold, fontSize: 10, color: '#fff' },
  ratingName: { fontFamily: typography.sansMedium, fontSize: 13, color: colors.fg },
  ratingTime: { fontFamily: typography.mono, fontSize: 9, color: colors.fg3, letterSpacing: 0.6 },
  starsRow: { flexDirection: 'row', gap: 1 },
  ratingBody: { fontFamily: typography.sans, fontSize: 12.5, color: colors.fg2, lineHeight: 19 },
  settingsCard: {
    marginTop: spacing[2],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: spacing[4],
  },
  settingsLabel: { flex: 1, fontFamily: typography.sans, fontSize: 14, color: colors.fg },
});
