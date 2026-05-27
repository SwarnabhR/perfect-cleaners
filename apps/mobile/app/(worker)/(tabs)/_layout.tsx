import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Briefcase, Wallet, User } from 'lucide-react-native';
import { colors, layout } from '@pc/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFCM } from '../../../hooks/useFCM';

export default function WorkerTabsLayout() {
  const insets = useSafeAreaInsets();
  useFCM('workers'); // Registers FCM token to workers/{uid}

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(14,13,11,0.88)',
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: layout.bottomTab + Math.max(insets.bottom - 6, 0),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.fg,
        tabBarInactiveTintColor: colors.fg3,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Briefcase size={size} color={color} strokeWidth={1.5} />
              <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: colors.fg, opacity: focused ? 1 : 0 }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Wallet size={size} color={color} strokeWidth={1.5} />
              <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: colors.fg, opacity: focused ? 1 : 0 }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center', gap: 6 }}>
              <User size={size} color={color} strokeWidth={1.5} />
              <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: colors.fg, opacity: focused ? 1 : 0 }} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
