import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { profileService } from '../../services/profile.service';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS, SHADOWS } from '../../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateChild'>;

const AVATAR_OPTIONS = [
  { id: 'fox_standard', name: 'Foxy', emoji: '🦊' },
  { id: 'owl_scholar', name: 'Barnaby', emoji: '🦉' },
  { id: 'bear_cozy', name: 'Bruno', emoji: '🐻' },
  { id: 'cat_detective', name: 'Milo', emoji: '🐱' },
];

export const CreateChildScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { parentProfile, refreshProfiles, setActiveChildId } = useAuthStore();
  const isFirstChild = route.params?.isFirstChild ?? false;

  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateChild = async () => {
    if (!name.trim()) {
      setError("Please enter your child's name");
      return;
    }

    if (!parentProfile) {
      setError('Parent session not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newChild = await profileService.createChild(
        parentProfile.id,
        name.trim(),
        selectedAvatar
      );

      await refreshProfiles();
      const { selectChild } = useAuthStore.getState();
      await selectChild(newChild.id);
    } catch (err: unknown) {
      console.error('Failed to create child profile:', err);
      const message = err instanceof Error ? err.message : 'Failed to create child profile.';
      setError(message);
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
          <Text style={styles.title}>
            {isFirstChild ? 'Create First Child Profile' : 'Add Child Profile'}
          </Text>
          <Text style={styles.subtitle}>
            Set up a reading buddy space tailored for your kid
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Child's Name or Nickname"
            placeholder="e.g. Leo, Mia, Alex"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError(null);
            }}
          />

          <Text style={styles.sectionLabel}>Choose Reading Buddy Avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((item) => {
              const isSelected = selectedAvatar === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                  onPress={() => setSelectedAvatar(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.avatarEmoji}>{item.emoji}</Text>
                  <Text
                    style={[
                      styles.avatarName,
                      isSelected && styles.avatarNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title="Start Reading Journey"
            onPress={handleCreateChild}
            loading={loading}
            style={styles.submitButton}
          />

          {!isFirstChild && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
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
    marginBottom: 24,
  },
  mascotImage: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.medium,
  },
  errorBanner: {
    backgroundColor: COLORS.streakBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F8D7DA',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: 8,
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  avatarOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    backgroundColor: COLORS.progressCardBg,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '22%',
  },
  avatarOptionSelected: {
    borderColor: COLORS.primaryYellow,
    backgroundColor: '#FFFBF0',
  },
  avatarEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  avatarName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  avatarNameSelected: {
    color: COLORS.textDark,
  },
  submitButton: {
    marginTop: 8,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});
