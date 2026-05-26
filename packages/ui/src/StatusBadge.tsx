import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@pc/tokens';

const STATUS_MAP: Record<string, [string, string]> = {
  assigned: ['Assigned', colors.statusAssigned],
  enroute: ['En Route', colors.statusEnroute],
  inprogress: ['In Progress', colors.statusInProgress],
  done: ['Done', colors.statusDone],
  cancelled: ['Cancelled', colors.warning],
};

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const [label, c] = STATUS_MAP[status] || ['—', '#888'];
  return (
    <View style={s.badge}>
      <View style={[s.dot, { backgroundColor: c }]} />
      <Text style={s.text}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  dot: { width: 6, height: 6, borderRadius: 999 },
  text: { fontFamily: typography.sans, fontSize: 11, color: colors.fg2 },
});
