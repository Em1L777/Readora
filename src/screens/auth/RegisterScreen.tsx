import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { authService } from '../../services/auth.service';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const validate = (): boolean => {
    let valid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);
    setErrorMessage(null);

    if (!displayName.trim()) {
      setNameError('Parent name is required');
      valid = false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      await authService.signUp(email, password, displayName);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const message = err instanceof Error ? err.message : 'Failed to create parent account. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/mascot/fox.png')}
            style={styles.mascotImage}
          />
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.subtitle}>Start your family's reading adventure</Text>
        </View>

        {/* Card Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Parent Profile</Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Input
            label="Your Name"
            placeholder="e.g. Sarah Vance"
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (nameError) setNameError(null);
            }}
            error={nameError}
          />

          <Input
            label="Email Address"
            placeholder="parent@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={emailError}
          />

          <Input
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            isPassword
            error={passwordError}
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmError) setConfirmError(null);
            }}
            isPassword
            error={confirmError}
          />

          <Button
            title="Create Parent Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mascotImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: COLORS.streakBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F8D7DA',
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryYellow,
  },
});
