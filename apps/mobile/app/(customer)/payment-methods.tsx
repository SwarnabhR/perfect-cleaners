import { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Animated, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';
import { CreditCard, CreditCardProps } from '../../components/CreditCard';

const DEMO_CARDS: (CreditCardProps & { id: string })[] = [
  { id: '1', last4: '4242', brand: 'visa', name: 'AARAV MEHTA', expiry: '12/27', gradientIndex: 0 },
  { id: '2', last4: '5678', brand: 'mastercard', name: 'AARAV MEHTA', expiry: '08/26', gradientIndex: 1 },
  { id: '3', last4: '9012', brand: 'rupay', name: 'AARAV MEHTA', expiry: '03/28', gradientIndex: 2 },
];

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 40;
  const cardHeight = cardWidth * 0.63;
  const STACK_OFFSET = 16;
  const FAN_GAP = 12;

  const [cards, setCards] = useState(DEMO_CARDS);
  const [expanded, setExpanded] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [defaultId, setDefaultId] = useState('1');

  // Preview state for new card
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCVV, setNewCardCVV] = useState('');
  const [isCvvFocused, setIsCvvFocused] = useState(false);

  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [expanded]);

  // Ensure default card is at the top of the stack
  const displayCards = [...cards].sort((a, b) => (a.id === defaultId ? -1 : b.id === defaultId ? 1 : 0));

  const handleDelete = (id: string, last4: string) => {
    Alert.alert('Remove Card', `Remove •••• ${last4} from your account?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setCards(prev => prev.filter(c => c.id !== id)),
      },
    ]);
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + spacing[3] }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => { /* assume router.back() */ }} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.fg} />
        </TouchableOpacity>
        <Text style={s.eyebrow}>[PAYMENT METHODS] / SAVED CARDS</Text>
      </View>

      {/* Stack Area */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => setExpanded(!expanded)}>
          <View style={{ height: expanded ? displayCards.length * (cardHeight + FAN_GAP + 60) : cardHeight + (displayCards.length - 1) * STACK_OFFSET }}>
            {displayCards.map((card, i) => {
              const stackedY = i * STACK_OFFSET;
              const fannedY = i * (cardHeight + FAN_GAP + 60); // +60 for the action buttons
              
              const translateY = expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [stackedY, fannedY]
              });

              return (
                <Animated.View key={card.id} style={{ position: 'absolute', transform: [{ translateY }], zIndex: displayCards.length - i }}>
                  <CreditCard {...card} width={cardWidth} />
                  
                  {/* Fanned Actions */}
                  <Animated.View style={{ opacity: expandAnim, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 }}>
                    {card.id !== defaultId ? (
                      <TouchableOpacity onPress={() => { setDefaultId(card.id); setExpanded(false); }}>
                        <Text style={{ color: colors.sage, fontFamily: typography.sansMedium, fontSize: 13 }}>SET DEFAULT</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ color: colors.fg3, fontFamily: typography.sansMedium, fontSize: 13 }}>DEFAULT CARD</Text>
                    )}
                    <TouchableOpacity onPress={() => handleDelete(card.id, card.last4)}>
                      <Text style={{ color: colors.danger, fontFamily: typography.sansMedium, fontSize: 13 }}>DELETE</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Add New Card Button */}
      <View style={[s.addBtnContainer, { paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity style={s.addBtn} onPress={() => setAddSheetOpen(true)}>
          <Text style={s.addBtnText}>ADD NEW CARD</Text>
        </TouchableOpacity>
      </View>

      {/* Add Card Modal */}
      {addSheetOpen && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} activeOpacity={1} onPress={() => setAddSheetOpen(false)} />
          <View style={[s.sheet, { paddingBottom: insets.bottom || 20 }]}>
            <View style={s.grabber} />
            <View style={s.sheetHeader}>
              <Text style={s.eyebrow}>ADD NEW CARD</Text>
            </View>
            
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <CreditCard 
                width={screenWidth - 80}
                last4={newCardNumber.slice(-4) || '••••'}
                brand={newCardNumber.startsWith('4') ? 'visa' : 'mastercard'}
                name={newCardName || 'YOUR NAME'}
                expiry={newCardExpiry || 'MM/YY'}
                gradientIndex={cards.length} // Give it a new color
                flipped={isCvvFocused}
              />
            </View>

            <TextInput
              style={s.input}
              placeholder="CARD NUMBER"
              placeholderTextColor={colors.fg4}
              keyboardType="numeric"
              value={newCardNumber}
              onChangeText={setNewCardNumber}
              maxLength={19}
            />
            <TextInput
              style={s.input}
              placeholder="NAME ON CARD"
              placeholderTextColor={colors.fg4}
              autoCapitalize="characters"
              value={newCardName}
              onChangeText={setNewCardName}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="EXPIRY (MM/YY)"
                placeholderTextColor={colors.fg4}
                value={newCardExpiry}
                onChangeText={setNewCardExpiry}
                maxLength={5}
              />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="CVV"
                placeholderTextColor={colors.fg4}
                keyboardType="numeric"
                secureTextEntry
                value={newCardCVV}
                onChangeText={setNewCardCVV}
                maxLength={4}
                onFocus={() => setIsCvvFocused(true)}
                onBlur={() => setIsCvvFocused(false)}
              />
            </View>

            <TouchableOpacity 
              style={[s.addBtn, { marginTop: 24 }]} 
              onPress={() => {
                if(newCardNumber.length >= 15) {
                  setCards([...cards, {
                    id: Math.random().toString(),
                    last4: newCardNumber.slice(-4),
                    brand: newCardNumber.startsWith('4') ? 'visa' : 'mastercard',
                    name: newCardName || 'NEW CARD',
                    expiry: newCardExpiry || '12/29',
                    gradientIndex: cards.length
                  }]);
                  setAddSheetOpen(false);
                  setNewCardNumber(''); setNewCardName(''); setNewCardExpiry(''); setNewCardCVV('');
                }
              }}
            >
              <Text style={s.addBtnText}>ADD CARD</Text>
            </TouchableOpacity>
            
            <Text style={s.pciText}>PCI-DSS Compliant · Tokenised by Razorpay</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: typography.mono, fontSize: 10, color: colors.fg3, letterSpacing: 1.2, textTransform: 'uppercase' },
  addBtnContainer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 20, backgroundColor: colors.ink },
  addBtn: { backgroundColor: colors.warm, paddingVertical: 16, borderRadius: radii.pill, alignItems: 'center' },
  addBtnText: { fontFamily: typography.sansBold, fontSize: 14, color: colors.ink, letterSpacing: 1.2 },
  sheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, paddingHorizontal: 20, paddingTop: 12 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.fg4, alignSelf: 'center' },
  sheetHeader: { alignItems: 'center', paddingVertical: 20 },
  input: { backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, padding: 16, fontFamily: typography.mono, fontSize: 14, color: colors.fg, marginBottom: 12 },
  pciText: { fontFamily: typography.mono, fontSize: 9, color: colors.fg3, textAlign: 'center', marginTop: 16 },
});
