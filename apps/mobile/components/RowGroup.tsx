import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../theme';

// ─── SegCtrl ──────────────────────────────────────────────────────────────────
export interface SegOption { value: string; label: string }
interface SegCtrlProps { options: SegOption[]; value: string; onChange: (v: string) => void }
export function SegCtrl({ options, value, onChange }: SegCtrlProps) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.cardHi, borderRadius: 10, padding: 3 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[
            { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 7 },
            value === opt.value && { backgroundColor: c.inkRaised, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
          ]}
          onPress={() => onChange(opt.value)} activeOpacity={0.8}
        >
          <Text style={{ fontFamily: typography.sansMedium, fontSize: 12, color: value === opt.value ? c.fg : c.fg3 }}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── ScreenHeader ─────────────────────────────────────────────────────────────
interface ScreenHeaderProps { title: string; trailing?: React.ReactNode }
export function ScreenHeader({ title, trailing }: ScreenHeaderProps) {
  const router = useRouter();
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[3] }}>
      <TouchableOpacity
        style={{ width: 36, height: 36, borderRadius: radii.pill, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}
        onPress={() => router.back()} hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }} activeOpacity={0.7}
      >
        <ArrowLeft size={18} color={c.fg} strokeWidth={1.5} />
      </TouchableOpacity>
      <Text style={{ flex: 1, fontFamily: typography.sansSemiBold, fontSize: 16, color: c.fg, letterSpacing: -0.2 }} numberOfLines={1}>
        {title}
      </Text>
      {trailing != null ? trailing : <View style={{ width: 36 }} />}
    </View>
  );
}

// ─── Group ────────────────────────────────────────────────────────────────────
interface GroupProps { header?: string; children: React.ReactNode }
export function Group({ header, children }: GroupProps) {
  const c = useThemeColors();
  return (
    <View style={{ paddingTop: 0 }}>
      {header != null && (
        <Text style={{ fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 1.2, textTransform: 'uppercase', paddingTop: 24, paddingBottom: 8, paddingHorizontal: 20 }}>
          {header.toUpperCase()}
        </Text>
      )}
      <View style={{ backgroundColor: c.inkRaised, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
export interface RowProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  sub?: string;
  value?: React.ReactNode;
  trailing?: React.ReactNode;
  destructive?: boolean;
  titleColor?: string;
  onPress?: () => void;
  isLast?: boolean;
}
export function Row({ icon, iconBg, title, sub, value, trailing, destructive, titleColor, onPress, isLast }: RowProps) {
  const c = useThemeColors();
  const rowStyle = [
    { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 4, paddingHorizontal: 20, minHeight: 52 },
    !isLast && { borderBottomWidth: 1, borderBottomColor: c.line, marginLeft: 16 },
  ];
  const inner = (
    <>
      {icon != null && (
        <View style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: iconBg ?? c.sageHi }}>
          {icon}
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: typography.sans, fontSize: 17, lineHeight: 22, color: destructive ? c.danger : (titleColor ?? c.fg) }}>{title}</Text>
        {sub ? <Text style={{ fontFamily: typography.sans, fontSize: 13, color: c.fg2, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {trailing !== undefined ? trailing : (
        <>
          {value !== undefined ? (typeof value === 'string' ? <Text style={{ fontFamily: typography.sans, fontSize: 17, color: c.fg2 }}>{value}</Text> : value) : null}
          {onPress ? <ChevronRight size={14} color={c.fg3} strokeWidth={1.5} /> : null}
        </>
      )}
    </>
  );
  if (onPress) return <TouchableOpacity style={rowStyle} onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>;
  return <View style={rowStyle}>{inner}</View>;
}

// ─── SwitchRow ────────────────────────────────────────────────────────────────
interface SwitchRowProps extends Omit<RowProps, 'trailing' | 'onPress'> {
  switchOn: boolean;
  onToggle: (v: boolean) => void;
}
export function SwitchRow({ switchOn, onToggle, ...rest }: SwitchRowProps) {
  const c = useThemeColors();
  return (
    <Row
      {...rest}
      trailing={
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => onToggle(!switchOn)}
          style={{ width: 51, height: 31, borderRadius: 16, backgroundColor: switchOn ? c.sage : c.card, borderWidth: switchOn ? 0 : 2, borderColor: c.line, justifyContent: 'center', padding: 2 }}
        >
          <View style={{ width: 27, height: 27, borderRadius: 14, backgroundColor: '#fff', transform: [{ translateX: switchOn ? 20 : -2 }], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 }} />
        </TouchableOpacity>
      }
    />
  );
}
