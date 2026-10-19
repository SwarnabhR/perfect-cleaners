import { View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { CalendarDays, UserCheck, Receipt, Users } from 'lucide-react-native';
import { layout } from '@pc/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';

type IconType = typeof Users;

function TabIcon({ Icon, color, size, focused, dot }: { Icon: IconType; color: ColorValue; size: number; focused: boolean; dot: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Icon size={size} color={color} strokeWidth={1.5} />
      <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: dot, opacity: focused ? 1 : 0 }} />
    </View>
  );
}

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();

  const tab = (Icon: IconType) => ({
    tabBarIcon: ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
      <TabIcon Icon={Icon} color={color} size={size} focused={focused} dot={c.fg} />
    ),
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: c.inkScrim,
          borderTopColor: c.line,
          borderTopWidth: 1,
          height: layout.bottomTab + Math.max(insets.bottom - 6, 0),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
        },
        tabBarActiveTintColor: c.fg,
        tabBarInactiveTintColor: c.fg3,
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Schedule',  ...tab(CalendarDays) }} />
      <Tabs.Screen name="approvals" options={{ title: 'Approvals', ...tab(UserCheck) }} />
      <Tabs.Screen name="billing"   options={{ title: 'Billing',   ...tab(Receipt) }} />
      <Tabs.Screen name="people"    options={{ title: 'People',    ...tab(Users) }} />
    </Tabs>
  );
}
