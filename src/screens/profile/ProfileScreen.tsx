import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { profileService } from '../../services/profile.service';
import { Button } from '../../components/common/Button';
import { COLORS, SHADOWS } from '../../constants/theme';

const AVATARS = [
  { id: 'fox', emoji: '🦊', label: 'Foxy' },
  { id: 'owl', emoji: '🦉', label: 'Barnaby' },
  { id: 'bear', emoji: '🐻', label: 'Bruno' },
  { id: 'cat', emoji: '🐱', label: 'Milo' },
];

const GENRE_TAGS = [
  { id: 'fantasy', name: '🧚 Fantasy' },
  { id: 'scifi', name: '🚀 Sci-Fi & Space' },
  { id: 'animals', name: '🐾 Cute Animals' },
  { id: 'mystery', name: '🔍 Mystery' },
  { id: 'legends', name: '🏰 Castle Legends' },
  { id: 'comics', name: '🎨 Comic Books' },
];

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { getActiveChild, refreshProfiles } = useAuthStore();
  const activeChild = getActiveChild();

  const [displayName, setDisplayName] = useState(activeChild?.display_name || '');
  const [dailyTarget, setDailyTarget] = useState(20);
  const [selectedAvatar, setSelectedAvatar] = useState('fox');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['fantasy', 'scifi']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeChild) {
      setDisplayName(activeChild.display_name);
    }
  }, [activeChild]);

  const toggleGenre = (id: string) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!activeChild) return;

    try {
      setSaving(true);
      await profileService.updateProfile(activeChild.id, {
        display_name: displayName.trim() || activeChild.display_name,
      });
      await refreshProfiles();
      Alert.alert('Saved!', 'Profile settings have been updated.');
    } catch (err: unknown) {
      console.error('Failed to save profile:', err);
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../assets/images/mascot/fox.png')}
            style={styles.logoImage}
          />
          <Text style={styles.headerTitle}>Kid Profile</Text>
        </View>

        <View style={styles.headerRight}>
          <Image
            source={require('../../../assets/images/icons/Notification.png')}
            style={styles.notificationIcon}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              ⭐ LEVEL {activeChild?.level ?? 1} ADVENTURER
            </Text>
          </View>

          <View style={styles.avatarWrapper}>
            <Image
              source={require('../../../assets/images/mascot/fox.png')}
              style={styles.heroAvatarImage}
            />
          </View>

          <Text style={styles.childName}>{displayName || 'Kid Explorer'}</Text>
          <Text style={styles.explorerSub}>
            Readora Explorer • 🔥 {activeChild?.current_streak ?? 0}-Day Streak
          </Text>

          {/* Reading Buddy Avatar Selector */}
          <Text style={styles.chooseBuddyText}>CHOOSE READING BUDDY</Text>
          <View style={styles.avatarRow}>
            {AVATARS.map((av) => (
              <TouchableOpacity
                key={av.id}
                style={[
                  styles.avatarBubble,
                  selectedAvatar === av.id && styles.avatarBubbleSelected,
                ]}
                onPress={() => setSelectedAvatar(av.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.avatarEmoji}>{av.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section: About Kid */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderIcon}>👶</Text>
            <Text style={styles.cardHeaderTitle}>About {displayName || 'Kid'}</Text>
          </View>

          <Text style={styles.fieldLabel}>CHILD'S NAME</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Child's Name"
            />
          </View>

          <Text style={styles.fieldLabel}>READING GRADE / AGE BAND</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>🎓 Grade 3 (Ages 8-9)</Text>
          </View>
        </View>

        {/* Section: Reading Habits & Goals */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderIcon}>🎯</Text>
            <Text style={styles.cardHeaderTitle}>Reading Habits & Goals</Text>
          </View>

          <View style={styles.targetRow}>
            <View>
              <Text style={styles.targetLabel}>Daily Target</Text>
              <Text style={styles.targetSub}>⚡ Recommended 20m</Text>
            </View>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setDailyTarget((prev) => Math.max(5, prev - 5))}
              >
                <Text style={styles.stepperText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{dailyTarget} min</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setDailyTarget((prev) => Math.min(120, prev + 5))}
              >
                <Text style={styles.stepperText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.fieldLabel}>FAVORITE STORY WORLDS</Text>
          <View style={styles.tagsContainer}>
            {GENRE_TAGS.map((genre) => {
              const isSelected = selectedGenres.includes(genre.id);
              return (
                <TouchableOpacity
                  key={genre.id}
                  style={[styles.genreTag, isSelected && styles.genreTagSelected]}
                  onPress={() => toggleGenre(genre.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.genreTagText,
                      isSelected && styles.genreTagTextSelected,
                    ]}
                  >
                    {genre.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Recent Badges */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderIcon}>🏆</Text>
            <Text style={styles.cardHeaderTitle}>Recent Badges (3)</Text>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>🔥</Text>
              <Text style={styles.badgeName}>7-Day Streak</Text>
              <Text style={styles.badgeStatus}>Achieved</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>📖</Text>
              <Text style={styles.badgeName}>10 Books Fin</Text>
              <Text style={styles.badgeStatus}>Achieved</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>🚀</Text>
              <Text style={styles.badgeName}>Cosmic Reader</Text>
              <Text style={styles.badgeStatus}>3/5 left</Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />

        {/* Parent Gate Link */}
        <TouchableOpacity
          style={styles.parentGateLink}
          onPress={() => navigation.navigate('Parent')}
          activeOpacity={0.7}
        >
          <Text style={styles.parentGateText}>🔒 Parent Dashboard & PIN Controls</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    marginRight: 10,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.small,
  },
  levelBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF8ED',
    borderWidth: 3,
    borderColor: COLORS.primaryYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroAvatarImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  childName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  explorerSub: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  chooseBuddyText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 14,
  },
  avatarBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.progressCardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarBubbleSelected: {
    borderColor: COLORS.primaryYellow,
    backgroundColor: '#FFFBF0',
    ...SHADOWS.small,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    marginBottom: 16,
  },
  input: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  infoRow: {
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  targetLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  targetSub: {
    fontSize: 12,
    color: COLORS.primaryCoral,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 16,
    padding: 4,
    gap: 8,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  stepperText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    minWidth: 50,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    backgroundColor: COLORS.progressCardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genreTagSelected: {
    backgroundColor: COLORS.darkBlue,
  },
  genreTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  genreTagTextSelected: {
    color: COLORS.white,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeItem: {
    alignItems: 'center',
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 16,
    padding: 12,
    width: '31%',
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeStatus: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  parentGateLink: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 10,
  },
  parentGateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});