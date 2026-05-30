import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Car, Star, CreditCard, Bell } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { colors, typography, spacing } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

type NotifType = 'booking_confirmed' | 'job_complete' | 'promo' | 'payment' | 'general';

interface NotifDoc {
  id:        string;
  type:      NotifType;
  title:     string;
  body:      string;
  read:      boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  bookingId?: string;
}

const TYPE_TINT: Record<NotifType, string> = {
  booking_confirmed: colors.sageHi,
  job_complete:      colors.success,
  promo:             colors.gold ?? colors.warm,
  payment:           '#4B8CF5',
  general:           '#9E9E9E',
};

function relTime(ts: FirebaseFirestoreTypes.Timestamp | null): string {
  if (!ts) return '';
  const diff = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} hr ago`;
  if (hrs < 48)   return 'Yesterday';
  return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isToday(ts: FirebaseFirestoreTypes.Timestamp | null): boolean {
  if (!ts) return false;
  const d = ts.toDate();
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function NotifIcon({ type }: { type: NotifType }) {
  const props = { size: 15, color: '#fff', strokeWidth: 1.5 } as const;
  switch (type) {
    case 'job_complete':      return <Check      {...props} />;
    case 'booking_confirmed': return <Bell       {...props} />;
    case 'payment':           return <CreditCard {...props} />;
    case 'promo':             return <Star       {...props} />;
    default:                  return <Car        {...props} />;
  }
}

function NotifRow({ n, isLast, onMarkRead, onDelete }: {
  n: NotifDoc; isLast: boolean;
  onMarkRead: () => void; onDelete: () => void;
}) {
  const c = useThemeColors();
  const [showClear, setShowClear] = useState(false);
  const tint = TYPE_TINT[n.type] ?? '#9E9E9E';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {!n.read && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.sage, position: 'absolute', left: 6, zIndex: 10 }} />
      )}
      <View style={{ flex: 1, opacity: n.read ? 0.7 : 1 }}>
        <Row
          icon={<NotifIcon type={n.type} />}
          iconBg={tint}
          title={n.title}
          sub={n.body}
          value={relTime(n.createdAt)}
          onPress={() => { if (!n.read) onMarkRead(); setShowClear(v => !v); }}
          isLast={isLast}
        />
      </View>
      {showClear && (
        <TouchableOpacity
          onPress={onDelete}
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
  const c  = useThemeColors();
  const ss = useSharedStyles();

  const [items,   setItems]   = useState<NotifDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    return firestore()
      .collection('customers')
      .doc(uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(40)
      .onSnapshot(snap => {
        setItems(snap.docs.map(d => ({
          id:        d.id,
          type:      (d.data().type ?? 'general') as NotifType,
          title:     d.data().title ?? '',
          body:      d.data().body  ?? '',
          read:      d.data().read  ?? false,
          createdAt: d.data().createdAt ?? null,
          bookingId: d.data().bookingId,
        })));
        setLoading(false);
      }, () => setLoading(false));
  }, [uid]);

  async function markAllRead() {
    if (!uid) return;
    const unread = items.filter(i => !i.read);
    const batch  = firestore().batch();
    unread.forEach(n => {
      batch.update(
        firestore().collection('customers').doc(uid).collection('notifications').doc(n.id),
        { read: true },
      );
    });
    await batch.commit();
  }

  async function markRead(n: NotifDoc) {
    if (!uid || n.read) return;
    await firestore()
      .collection('customers').doc(uid)
      .collection('notifications').doc(n.id)
      .update({ read: true });
  }

  async function deleteNotif(n: NotifDoc) {
    if (!uid) return;
    await firestore()
      .collection('customers').doc(uid)
      .collection('notifications').doc(n.id)
      .delete();
  }

  const todayItems   = items.filter(i => isToday(i.createdAt));
  const earlierItems = items.filter(i => !isToday(i.createdAt));

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
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={markAllRead}>
              <Text style={{ fontFamily: typography.sansMedium, fontSize: 13, color: c.sageHi, letterSpacing: 0.2 }}>
                Mark all read
              </Text>
            </TouchableOpacity>
          }
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={c.fg3} />
      ) : items.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 80, gap: 8 }}>
          <Bell size={32} color={c.fg4} strokeWidth={1} />
          <Text style={{ fontFamily: typography.serif, fontSize: 20, color: c.fg2 }}>All caught up.</Text>
          <Text style={{ fontFamily: typography.sans, fontSize: 13, color: c.fg3 }}>Booking updates will appear here.</Text>
        </View>
      ) : (
        <>
          {todayItems.length > 0 && (
            <Group header="Today">
              {todayItems.map((n, i) => (
                <NotifRow key={n.id} n={n} isLast={i === todayItems.length - 1}
                  onMarkRead={() => markRead(n)} onDelete={() => deleteNotif(n)} />
              ))}
            </Group>
          )}
          {earlierItems.length > 0 && (
            <Group header="Earlier">
              {earlierItems.map((n, i) => (
                <NotifRow key={n.id} n={n} isLast={i === earlierItems.length - 1}
                  onMarkRead={() => markRead(n)} onDelete={() => deleteNotif(n)} />
              ))}
            </Group>
          )}
        </>
      )}
    </ScrollView>
  );
}
