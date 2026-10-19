import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { spacing } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BackButton from '../../components/BackButton';
import { cacheRole, resolveRole } from '../../lib/role';
import { WEB_API_URL } from '../../lib/webApi';

export default function AdminLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();
  const c  = useThemeColors();
  const ss = useSharedStyles();
  const ready = username.trim().length > 0 && password.length > 0;

  async function handleSignIn() {
    if (!ready || loading) return;
    setLoading(true);
    try {
      // The admins collection is not readable pre-auth, so the username to email lookup is server-side.
      const res = await fetch(`${WEB_API_URL}/api/admin/resolve-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.email) throw new Error('Invalid username or password.');

      const cred = await auth().signInWithEmailAndPassword(data.email, password);
      if ((await resolveRole(cred.user.uid)) !== 'admin') {
        await auth().signOut();
        throw new Error('This account does not have admin access.');
      }
      await cacheRole('admin');
      router.replace('/(admin)/(tabs)');
    } catch (err: any) {
      const code = err?.code as string | undefined;
      const invalid = code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password';
      Alert.alert('Sign-in failed', invalid ? 'Invalid username or password.' : err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenShell>
      <BackButton />
      <View style={s.header}>
        <Text style={ss.onboardingTitle}>Admin sign in</Text>
        <Text style={ss.subtitle}>Use your dashboard username and password.</Text>
      </View>

      <View style={s.form}>
        <Text style={ss.fieldLabel}>USERNAME</Text>
        <TextInput
          style={ss.formInput}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="username"
          placeholderTextColor={c.fg4}
          returnKeyType="next"
        />
        <Text style={ss.fieldLabel}>PASSWORD</Text>
        <TextInput
          style={ss.formInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="password"
          placeholderTextColor={c.fg4}
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
        />
        <TouchableOpacity
          style={[ss.primaryBtn, (!ready || loading) && ss.primaryBtnOff]}
          onPress={handleSignIn}
          activeOpacity={0.8}
          disabled={!ready || loading}
        >
          <Text style={ss.primaryBtnText}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenShell>
  );
}

const s = StyleSheet.create({
  header: { gap: 8 },
  form:   { gap: spacing[3] },
});
