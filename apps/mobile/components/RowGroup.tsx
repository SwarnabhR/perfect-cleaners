/**
 * Shared layout primitives for account-area screens.
 *
 * SegCtrl  — segmented tab picker
 * ScreenHeader — top bar with back arrow + title + optional trailing
 * Group    — labelled card container (mirrors iOS grouped table section)
 * Row      — single list row: icon? | title + sub? | value? / trailing? | chevron?
 * SwitchRow — Row shortcut with a Toggle switch as trailing
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, Switch, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';

// ─── SegCtrl ──────────────────────────────────────────────────────────────────
export interface SegOption { value: string; label: string }
interface SegCtrlProps {
  options: SegOption[];
  value: string;
  onChange: (v: string) => void;
}
export function SegCtrl({ options, value, onChange }: SegCtrlProps) {
  return (
    <View style={sc.root}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[sc.item, value === opt.value && sc.active]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}
        >
          <Text style={[sc.label, value === opt.value && sc.labelActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const sc = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: colors.cardHi,
    borderRadius: 10,
    padding: 3,
  },
  item: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 7,
  },
  active: {
    backgroundColor: colors.inkRaised,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  label: { fontFamily: typography.sansMedium, fontSize: 12, color: colors.fg3 },
  labelActive: { color: colors.fg },
});

// ─── ScreenHeader ─────────────────────────────────────────────────────────────
interface ScreenHeaderProps {
  title: string;
  trailing?: React.ReactNode;
}
export function ScreenHeader({ title, trailing }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View style={sh.root}>
      <TouchableOpacity
        style={sh.back}
        onPress={() => router.back()}
        hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <ArrowLeft size={18} color={colors.fg} strokeWidth={1.5} />
      </TouchableOpacity>
      <Text style={sh.title} numberOfLines={1}>{title}</Text>
      {trailing != null ? trailing : <View style={{ width: 36 }} />}
    </View>
  );
}
const sh = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: typography.sansSemiBold,
    fontSize: 16,
    color: colors.fg,
    letterSpacing: -0.2,
  },
});

// ─── Group ────────────────────────────────────────────────────────────────────
interface GroupProps {
  header?: string;
  children: React.ReactNode;
}
export function Group({ header, children }: GroupProps) {
  return (
    <View style={g.section}>
      {header != null ? (
        <Text style={g.header}>{header.toUpperCase()}</Text>
      ) : null}
      <View style={g.card}>{children}</View>
    </View>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
export interface RowProps {
  /** Pre-rendered icon node; wrapped in a coloured 32×32 box */
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  sub?: string;
  /**
   * Right-side value — either a plain string or a custom React node
   * (e.g. a coloured amount).
   */
  value?: React.ReactNode;
  /**
   * Explicit trailing slot — when provided, replaces both value + chevron.
   * Used for Switches, custom badges, etc.
   */
  trailing?: React.ReactNode;
  destructive?: boolean;
  onPress?: () => void;
  isLast?: boolean;
}
export function Row({
  icon, iconBg, title, sub, value,
  trailing, destructive, onPress, isLast,
}: RowProps) {
  const inner = (
    <>
      {icon != null && (
        <View style={[g.iconBox, { backgroundColor: iconBg ?? colors.sageHi }]}>
          {icon}
        </View>
      )}
      <View style={g.body}>
        <Text style={[g.title, destructive && g.danger]}>{title}</Text>
        {sub ? <Text style={g.sub}>{sub}</Text> : null}
      </View>
      {trailing !== undefined ? (
        trailing
      ) : (
        <>
          {value !== undefined ? (
            typeof value === 'string'
              ? <Text style={g.value}>{value}</Text>
              : value
          ) : null}
          {onPress ? (
            <ChevronRight size={14} color={colors.fg3} strokeWidth={1.5} />
          ) : null}
        </>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[g.row, !isLast && g.border]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {inner}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[g.row, !isLast && g.border]}>
      {inner}
    </View>
  );
}

// ─── SwitchRow ────────────────────────────────────────────────────────────────
interface SwitchRowProps extends Omit<RowProps, 'trailing' | 'onPress'> {
  switchOn: boolean;
  onToggle: (v: boolean) => void;
}
export function SwitchRow({ switchOn, onToggle, ...rest }: SwitchRowProps) {
  // Custom iOS-like switch for perfect dark-mode blending
  return (
    <Row
      {...rest}
      trailing={
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => onToggle(!switchOn)}
          style={{
            width: 51,
            height: 31,
            borderRadius: 16,
            backgroundColor: switchOn ? colors.sage : colors.card,
            borderWidth: switchOn ? 0 : 2,
            borderColor: colors.line,
            justifyContent: 'center',
            padding: 2,
          }}
        >
          <View
            style={{
              width: 27,
              height: 27,
              borderRadius: 14,
              backgroundColor: '#fff',
              transform: [{ translateX: switchOn ? 20 : (switchOn ? 0 : -2) }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            }}
          />
        </TouchableOpacity>
      }
    />
  );
}

const g = StyleSheet.create({
  section: { paddingTop: 0 },
  header: {
    fontFamily: typography.mono,
    fontSize: 10,
    color: colors.fg3,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.inkRaised,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 20,
    minHeight: 52,
  },
  border: { 
    borderBottomWidth: 1, 
    borderBottomColor: colors.line,
    marginLeft: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: typography.sans, fontSize: 17, color: colors.fg, lineHeight: 22 },
  sub: { fontFamily: typography.sans, fontSize: 13, color: colors.fg2, marginTop: 2 },
  value: { fontFamily: typography.sans, fontSize: 17, color: colors.fg2 },
  danger: { color: colors.danger },
});
