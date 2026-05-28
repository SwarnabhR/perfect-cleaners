import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme';
import { spacing } from '@pc/tokens';

interface Props {
  children: ReactNode;
  /** Extra style applied to the inner ScrollView contentContainerStyle */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Shared shell for all auth + onboarding screens.
 * Handles: safe-area insets, KeyboardAvoidingView, themed background, ScrollView.
 */
export default function AuthScreenShell({ children, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.ink, paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing[6], paddingTop: spacing[5], gap: spacing[6] },
});
