import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Car, IndianRupee, Clock,
} from 'lucide-react-native';
import { colors, typography, spacing } from '@pc/tokens';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

const NOTIFS = [
  { id:'1', title:'New Job Assigned', body:'BMW 3 Series · Interior Detailing · 10:30 AM today', time:'2 min ago', read:false, icon:'car' },
  { id:'2', title:'Customer Tip Received', body:'Aarav Mehta added ₹100 tip for job #PC-2052', time:'1 hr ago', read:false, icon:'rupee' },
  { id:'3', title:'Schedule Update', body:'Your 2:00 PM slot has been moved to 3:00 PM', time:'3 hr ago', read:true, icon:'clock' },
  { id:'4', title:'Earnings Credited', body:'₹1,840 for 3 jobs credited to your wallet', time:'Yesterday', read:true, icon:'rupee' },
];

function WorkerNotifIcon({ name }: { name: string }) {
  const props = { size: 15, color: '#fff', strokeWidth: 1.5 };
  if (name === 'car') return <Car {...props} />;
  if (name === 'rupee') return <IndianRupee {...props} />;
  if (name === 'clock') return <Clock {...props} />;
  return <Car {...props} />;
}

function WorkerNotifRow({ n, isLast, onClear }: { n: typeof NOTIFS[0]; isLast: boolean; onClear: () => void }) {
  const [showClear, setShowClear] = useState(false);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: n.read ? 0.7 : 1 }}>
      {!n.read && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sage, position: 'absolute', left: 6, zIndex: 10 }} />
      )}
      <View style={{ flex: 1 }}>
        <Row
          icon={<WorkerNotifIcon name={n.icon} />}
          iconBg={n.icon === 'rupee' ? colors.success : n.icon === 'clock' ? colors.warning : colors.sageHi}
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
          style={{ paddingHorizontal: 16, height: '100%', justifyContent: 'center', backgroundColor: colors.danger }}
        >
          <Text style={{ color: '#fff', fontFamily: typography.sansMedium, fontSize: 13 }}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function WorkerNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState(NOTIFS);

  const handleClear = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleMarkAllRead = () => {
    setItems(items.map(item => ({ ...item, read: true })));
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Notifications"
          trailing={
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={handleMarkAllRead}>
              <Text style={s.markAll}>Mark all read</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <Group>
        {items.map((n, i) => (
          <WorkerNotifRow
            key={n.id}
            n={n}
            isLast={i === items.length - 1}
            onClear={() => handleClear(n.id)}
          />
        ))}
      </Group>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  markAll: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: colors.sageHi,
    letterSpacing: 0.2,
  },
});
