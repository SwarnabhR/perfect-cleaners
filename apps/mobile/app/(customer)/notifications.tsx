import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check, Car, Star, CreditCard, Bell,
} from 'lucide-react-native';
import { colors, typography, spacing } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

type IconName = 'check' | 'car' | 'star' | 'card' | 'bell' | 'sparkle';

interface NotifItem {
  unread: boolean;
  group: 'today' | 'earlier';
  iconName: IconName;
  tint: string;
  title: string;
  body: string;
  time: string;
}

const ITEMS: NotifItem[] = [
  {
    unread: true, group: 'today', iconName: 'check', tint: colors.success,
    title: 'Booking complete',
    body: 'Your Premium Wash + Interior is ready. Tap to rate.',
    time: 'Just now',
  },
  {
    unread: true, group: 'today', iconName: 'car', tint: colors.warning,
    title: 'Rahul is on the way',
    body: 'ETA 9 min · navigating to Kavi Nagar',
    time: '12 min ago',
  },
  {
    unread: true, group: 'today', iconName: 'sparkle', tint: colors.sageHi,
    title: 'MONSOON30 unlocked',
    body: '30% off ceramic coating. Ends Friday.',
    time: '2 hr ago',
  },
  {
    unread: false, group: 'earlier', iconName: 'card', tint: '#4B8CF5',
    title: 'Payment receipt · ₹1,080',
    body: 'Razorpay · HDFC •••• 4242',
    time: 'Yesterday',
  },
  {
    unread: false, group: 'earlier', iconName: 'star', tint: colors.gold,
    title: 'You earned ₹200 referral credit',
    body: 'Priya joined using your code AARAV-PC.',
    time: '2 days ago',
  },
  {
    unread: false, group: 'earlier', iconName: 'bell', tint: '#9E9E9E',
    title: 'Booking scheduled',
    body: 'Premium Wash · Tue 28 May at 2:00 PM',
    time: '3 days ago',
  },
];

function NotifIcon({ name, size = 15 }: { name: IconName; size?: number }) {
  const props = { size, color: '#fff', strokeWidth: 1.5 } as const;
  switch (name) {
    case 'check':   return <Check      {...props} />;
    case 'car':     return <Car        {...props} />;
    case 'card':    return <CreditCard {...props} />;
    case 'bell':    return <Bell       {...props} />;
    default:        return <Star       {...props} />;
  }
}

function NotifRow({ n, isLast, onClear }: { n: NotifItem; isLast: boolean; onClear: () => void }) {
  const c = useThemeColors();
  const ss = useSharedStyles();
  const [showClear, setShowClear] = useState(false);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {n.unread && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.sage, position: 'absolute', left: 6, zIndex: 10 }} />
      )}
      <View style={{ flex: 1 }}>
        <Row
          icon={<NotifIcon name={n.iconName} />}
          iconBg={n.tint}
          title={n.title}
          sub={n.body}
          value={n.time}
          onPress={() => setShowClear(!showClear)}
          isLast={isLast}
        />
      </View>
      {showClear && (
        <TouchableOpacity
          onPress={onClear}
          style={{ paddingHorizontal: 16, height: '100%', justifyContent: 'center', backgroundColor: c.danger }}
        >
          <Text style={{ color: '#fff', fontFamily: typography.sansMedium, fontSize: 13 }}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const ss = useSharedStyles();
  const [items, setItems] = useState(ITEMS);

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Inbox"
          trailing={
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              onPress={() => setItems(items.map(item => ({ ...item, unread: false })))}
            >
              <Text style={{ fontFamily: typography.sansMedium, fontSize: 13, color: c.sageHi, letterSpacing: 0.2 }}>
                Mark all read
              </Text>
            </TouchableOpacity>
          }
        />
      </View>

      {(['today', 'earlier'] as const).map(grp => {
        const list = items.filter(i => i.group === grp);
        if (list.length === 0) return null;
        return (
          <Group key={grp} header={grp === 'today' ? 'Today' : 'Earlier'}>
            {list.map((n, i) => (
              <NotifRow
                key={i}
                n={n}
                isLast={i === list.length - 1}
                onClear={() => setItems(prev => prev.filter(item => item !== n))}
              />
            ))}
          </Group>
        );
      })}
    </ScrollView>
  );
}
