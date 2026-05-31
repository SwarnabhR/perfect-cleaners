import { ScrollView, View, Text, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageCircle, Phone, Mail, Search } from 'lucide-react-native';
import { colors, spacing, radii, typography } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

const FAQ = [
  'How do I reschedule a booking?',
  "What if I'm not happy with the wash?",
  'How does ceramic coating work?',
  'How do I add a tip?',
  'Cancellation & refund policy',
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();

  const s = StyleSheet.create({
    searchWrap: { paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: spacing[2],
      backgroundColor: c.cardHi, borderRadius: radii.sm,
      paddingHorizontal: spacing[3], paddingVertical: 10,
      borderWidth: 1, borderColor: c.line,
    },
    searchPlaceholder: { fontFamily: typography.sans, fontSize: 14, color: c.fg3 },
  });

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Help & Support" />
      </View>

      <View style={ss.titleSection}>
        <Text style={ss.pageTitle}>Help.</Text>
      </View>

      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Search size={15} color={c.fg3} strokeWidth={2} />
          <Text style={s.searchPlaceholder}>Search help articles…</Text>
        </View>
      </View>

      <Group header="Get in Touch">
        <Row
          icon={<MessageCircle size={15} color="#fff" strokeWidth={1.5} />}
          iconBg={colors.sageHi}
          title="Chat with support"
          sub="Average response time · 2 min"
          onPress={() => router.push('/(customer)/support-chat')}
        />
        <Row
          icon={<Phone size={15} color="#fff" strokeWidth={1.5} />}
          iconBg={colors.success}
          title="Call us"
          sub="+91 98765 43210 · 9 AM – 9 PM"
          onPress={() => Linking.openURL('tel:+919876543210')}
        />
        <Row
          icon={<Mail size={15} color="#fff" strokeWidth={1.5} />}
          iconBg="#4B8CF5"
          title="Email us"
          sub="hello@perfectcleaners.in"
          onPress={() => Linking.openURL('mailto:hello@perfectcleaners.in')}
          isLast
        />
      </Group>

      <Group header="Frequently Asked">
        {FAQ.map((q, i) => (
          <Row
            key={i}
            title={q}
            onPress={() => router.push('/(customer)/support-chat')}
            isLast={i === FAQ.length - 1}
          />
        ))}
      </Group>

      <Group header="About">
        <Row title="Terms of Service"     onPress={() => Linking.openURL('https://perfectcleaners.in/terms')} />
        <Row title="Privacy Policy"       onPress={() => Linking.openURL('https://perfectcleaners.in/privacy')} />
        <Row title="Open Source Licenses" onPress={() => Linking.openURL('https://perfectcleaners.in/licenses')} />
        <Row title="App Version"          value="2.4.1 (build 318)" isLast />
      </Group>
    </ScrollView>
  );
}
