import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@pc/tokens';

const DEFAULT_STEPS = ['Assigned', 'En Route', 'In Progress', 'Done'];

type StepperProps = {
  current?: number;
  steps?: string[];
};

export function Stepper({ current = 1, steps = DEFAULT_STEPS }: StepperProps) {
  return (
    <View style={s.row}>
      {steps.map((label, i) => {
        const active = i <= current;
        const isCurrent = i === current;
        return (
          <View key={i} style={s.item}>
            <View style={[s.dot, active && s.dotActive, isCurrent && s.dotCurrent]}>
              <Text style={[s.dotText, active && s.dotTextActive]}>{i + 1}</Text>
            </View>
            <Text style={[s.label, active && s.labelActive]} numberOfLines={1}>
              {label}
            </Text>
            {i < steps.length - 1 && (
              <View style={[s.line, i < current && s.lineActive]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  item: { flex: 1, alignItems: 'center', gap: 8 },
  dot: {
    width: 28, height: 28, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: colors.sage, borderColor: 'transparent' },
  dotCurrent: { borderColor: colors.sageHi },
  dotText: { fontFamily: typography.mono, fontSize: 10, color: colors.fg3 },
  dotTextActive: { color: '#fff' },
  label: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textAlign: 'center' as const },
  labelActive: { color: '#fff' },
  line: { height: 1, marginTop: 14, backgroundColor: colors.line },
  lineActive: { backgroundColor: colors.sage },
});
