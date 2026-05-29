import { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Animated, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { CreditCard, CreditCardProps } from '../../components/CreditCard';

const DEMO_CARDS: (CreditCardProps & { id: string })[] = [
  { id: '1', last4: '4242', brand: 'visa',       name: 'AARAV MEHTA', expiry: '12/27', gradientIndex: 0 },
  { id: '2', last4: '5678', brand: 'mastercard', name: 'AARAV MEHTA', expiry: '08/26', gradientIndex: 1 },
  { id: '3', last4: '9012', brand: 'rupay',      name: 'AARAV MEHTA', expiry: '03/28', gradientIndex: 2 },
];

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const ss = useSharedStyles();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth  = screenWidth - 40;
  const cardHeight = cardWidth * 0.63;
  const STACK_OFFSET = 16;
  const FAN_GAP = 12;

  const [cards, setCards]         = useState(DEMO_CARDS);
  const [expanded, setExpanded]   = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [defaultId, setDefaultId] = useState('1');

  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardName,   setNewCardName]   = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCVV,    setNewCardCVV]    = useState('');
  const [isCvvFocused,  setIsCvvFocused]  = useState(false);

  const expandAnim = useRef(new Animated.Value(0)).current;

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[5], gap: 12 },
    addBtnContainer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: spacing[5], backgroundColor: c.ink },
    sheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: c.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, paddingHorizontal: spacing[5], paddingTop: 12 },
    grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.fg4, alignSelf: 'center' },
    sheetHeader: { alignItems: 'center', paddingVertical: spacing[5] },
    input: { backgroundColor: c.ink, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: spacing[3], color: c.fg, fontFamily: typography.mono, fontSize: 14, marginBottom: spacing[3] },
    inputRow: { flexDirection: 'row', gap: spacing[2] },
    defaultLabel: { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing[2], marginTop: spacing[1] },
    menuContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: c.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, paddingHorizontal: spacing[5], paddingTop: 12, paddingBottom: spacing[8] },
    menuTitle: { fontFamily: typography.sansSemiBold, fontSize: 16, color: c.fg, textAlign: 'center', paddingVertical: spacing[4] },
    menuItem: { paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: c.line },
    menuItemText: { fontFamily: typography.sans, fontSize: 15, color: c.fg, textAlign: 'center' },
    menuItemDestructive: { color: c.danger },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    emptyCard: { backgroundColor: c.card, borderRadius: radii.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: c.line, alignItems: 'center', justifyContent: 'center', height: cardHeight, marginHorizontal: spacing[5] },
    emptyCardText: { fontFamily: typography.sans, fontSize: 14, color: c.fg3 },
  });

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showCardMenu, setShowCardMenu] = useState(false);

  function toggleExpand() {
    const toVal = expanded ? 0 : 1;
    Animated.spring(expandAnim, { toValue: toVal, useNativeDriver: false, friction: 8, tension: 60 }).start();
    setExpanded(!expanded);
  }

  function handleAddCard() {
    if (!newCardNumber || !newCardName || !newCardExpiry || !newCardCVV) {
      Alert.alert('Missing fields', 'Please fill in all card details.');
      return;
    }
    const last4 = newCardNumber.replace(/\s/g, '').slice(-4);
    const newCard = {
      id: Date.now().toString(), last4, brand: 'visa' as const,
      name: newCardName.toUpperCase(), expiry: newCardExpiry, gradientIndex: cards.length % 3,
    };
    setCards(prev => [...prev, newCard]);
    setNewCardNumber(''); setNewCardName(''); setNewCardExpiry(''); setNewCardCVV('');
    setAddSheetOpen(false);
  }

  const stackHeight = expanded
    ? cardHeight + (cards.length - 1) * (cardHeight + FAN_GAP)
    : cardHeight + (cards.length - 1) * STACK_OFFSET;

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + spacing[3] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity style={ss.backBtn}>
            <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={ss.eyebrow}>[PAYMENT] / METHODS</Text>
        </View>

        <View style={[ss.titleSection, { marginTop: spacing[4], marginBottom: spacing[4] }]}>
          <Text style={ss.pageTitle}>Your cards.</Text>
        </View>

        {/* Card stack */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleExpand}
          style={{ paddingHorizontal: spacing[5] }}
        >
          <View style={{ height: stackHeight, position: 'relative' }}>
            {cards.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyCardText}>No cards saved</Text>
              </View>
            ) : (
              [...cards].reverse().map((card, idx) => {
                const realIdx = cards.length - 1 - idx;
                const animatedTop = expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [realIdx * STACK_OFFSET, realIdx * (cardHeight + FAN_GAP)],
                });
                return (
                  <Animated.View
                    key={card.id}
                    style={[{ position: 'absolute', width: '100%', top: animatedTop }]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onLongPress={() => { setSelectedCardId(card.id); setShowCardMenu(true); }}
                    >
                      <CreditCard
                        last4={card.last4}
                        brand={card.brand}
                        name={card.name}
                        expiry={card.expiry}
                        gradientIndex={card.gradientIndex}
                        flipped={isCvvFocused && card.id === cards[0].id}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Add card CTA */}
      <View style={[s.addBtnContainer, { paddingBottom: insets.bottom + spacing[4] }]}>
        <TouchableOpacity style={ss.primaryBtn} onPress={() => setAddSheetOpen(true)} activeOpacity={0.85}>
          <Text style={ss.primaryBtnText}>+ ADD NEW CARD</Text>
        </TouchableOpacity>
      </View>

      {/* Add card sheet */}
      {addSheetOpen && (
        <>
          <TouchableOpacity style={s.overlay} onPress={() => setAddSheetOpen(false)} />
          <View style={[s.sheet, { paddingBottom: insets.bottom + spacing[6] }]}>
            <View style={s.grabber} />
            <View style={s.sheetHeader}>
              <Text style={ss.eyebrow}>[ADD NEW CARD]</Text>
            </View>
            <TextInput style={s.input} placeholder="Card number" placeholderTextColor={c.fg3} keyboardType="numeric" value={newCardNumber} onChangeText={setNewCardNumber} />
            <TextInput style={s.input} placeholder="Name on card" placeholderTextColor={c.fg3} autoCapitalize="characters" value={newCardName} onChangeText={setNewCardName} />
            <View style={s.inputRow}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="MM/YY" placeholderTextColor={c.fg3} keyboardType="numeric" value={newCardExpiry} onChangeText={setNewCardExpiry} />
              <TextInput
                style={[s.input, { flex: 1 }]} placeholder="CVV" placeholderTextColor={c.fg3}
                keyboardType="numeric" secureTextEntry
                value={newCardCVV} onChangeText={setNewCardCVV}
                onFocus={() => setIsCvvFocused(true)}
                onBlur={() => setIsCvvFocused(false)}
              />
            </View>
            <TouchableOpacity style={ss.primaryBtn} onPress={handleAddCard} activeOpacity={0.85}>
              <Text style={ss.primaryBtnText}>SAVE CARD</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Card context menu */}
      {showCardMenu && selectedCardId && (
        <>
          <TouchableOpacity style={s.overlay} onPress={() => setShowCardMenu(false)} />
          <View style={s.menuContainer}>
            <View style={s.grabber} />
            <Text style={s.menuTitle}>Card •••• {cards.find(c => c.id === selectedCardId)?.last4}</Text>
            <TouchableOpacity style={s.menuItem} onPress={() => { setDefaultId(selectedCardId); setShowCardMenu(false); }}>
              <Text style={s.menuItemText}>Set as default</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuItem} onPress={() => { setCards(prev => prev.filter(c => c.id !== selectedCardId)); setShowCardMenu(false); }}>
              <Text style={[s.menuItemText, s.menuItemDestructive]}>Remove card</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
