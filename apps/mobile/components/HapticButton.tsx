import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props extends TouchableOpacityProps {
  haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

export default function HapticButton({ haptic = 'light', onPress, ...props }: Props) {
  function handlePress(e: any) {
    switch (haptic) {
      case 'light':   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
      case 'medium':  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      case 'heavy':   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
      case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
      case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
      case 'error':   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
    }
    onPress?.(e);
  }
  return <TouchableOpacity {...props} onPress={handlePress} />;
}
