import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, Calendar, Tag, User } from 'lucide-react-native';
import { layout } from '@pc/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';
import { useFCM } from '../../../hooks/useFCM';

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  useFCM();

  const tabBarBg = c.inkScrim;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
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
      <Tabs.Screen name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Home size={size} color={color} strokeWidth={1.5} />
            <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: c.fg, opacity: focused ? 1 : 0 }} />
          </View>
        )}} />
      <Tabs.Screen name="bookings"
        options={{ title: 'Bookings', tabBarIcon: ({ color, size, focused }) => (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Calendar size={size} color={color} strokeWidth={1.5} />
            <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: c.fg, opacity: focused ? 1 : 0 }} />
          </View>
        )}} />
      <Tabs.Screen name="offers"
        options={{ title: 'Offers', tabBarIcon: ({ color, size, focused }) => (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Tag size={size} color={color} strokeWidth={1.5} />
            <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: c.fg, opacity: focused ? 1 : 0 }} />
          </View>
        )}} />
      <Tabs.Screen name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size, focused }) => (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <User size={size} color={color} strokeWidth={1.5} />
            <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: c.fg, opacity: focused ? 1 : 0 }} />
          </View>
        )}} />
    </Tabs>
  );
}
