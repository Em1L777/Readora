import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { profileService } from '../../services/profile.service';
import { readingService } from '../../services/reading.service';
import { PinPad } from '../../components/parent/PinPad';
import { ChildSwitcherModal } from '../../components/parent/ChildSwitcherModal';
import { COLORS, SHADOWS } from '../../constants/theme';

export const ParentScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    parentProfile,
    isParentUnlocked,
    unlockParent,
    lockParent,
    getActiveChild,
    refreshProfiles,
    signOut,
  } = useAuthStore();

  // Auto-lock parent mode when navigating away / switching tabs
  useFocusEffect(
    useCallback(() => {
      return () => {
        lockParent();
      };
    }, [lockParent])
  );

  const activeChild = getActiveChild();

  // Analytics state loaded from Supabase
  const [analytics, setAnalytics] = useState<{
    totalPagesRead: number;
    avgPagesPerDay: number;
    avgSessionMinutes: number;
  } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  React.useEffect(() => {
    if (activeChild?.id) {
      setLoadingAnalytics(true);
      readingService
        .getChildAnalytics(activeChild.id)
        .then((data) => setAnalytics(data))
        .catch((err) => console.error('Failed to load child analytics:', err))
        .finally(() => setLoadingAnalytics(false));
    }
  }, [activeChild?.id]);

  // State for PIN setup flow if parent has no PIN yet
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempPin, setTempPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // State for Child Switcher modal
  const [showChildSwitcher, setShowChildSwitcher] = useState(false);

  // 1. PIN verification / setup handling
  const handlePinComplete = async (enteredPin: string) => {
    setPinError(null);

    // Case A: Parent already has a PIN
    if (parentProfile?.pin_hash) {
      const success = unlockParent(enteredPin);
      if (!success) {
        setPinError('Incorrect PIN. Please try again.');
      }
      return;
    }

    // Case B: First time PIN Setup
    if (setupStep === 'create') {
      setTempPin(enteredPin);
      setSetupStep('confirm');
    } else {
      if (enteredPin !== tempPin) {
        setPinError('PINs do not match. Try again.');
        setSetupStep('create');
        setTempPin('');
        return;
      }

      try {
        if (parentProfile) {
          await profileService.setParentPin(parentProfile.id, enteredPin);
          await refreshProfiles();
          unlockParent(enteredPin);
          Alert.alert('PIN Created', 'Your parent security PIN has been saved.');
        }
      } catch (err: unknown) {
        console.error('Failed to set parent PIN:', err);
        const message = err instanceof Error ? err.message : 'Failed to save PIN. Please try again.';
        setPinError(message);
      }
    }
  };

  // If locked, render PIN Gate
  if (!isParentUnlocked) {
    const hasPin = Boolean(parentProfile?.pin_hash);

    let title = 'Parent Security PIN';
    let subtitle = 'Enter 4-digit PIN to access parent analytics';

    if (!hasPin) {
      title = setupStep === 'create' ? 'Create Parent PIN' : 'Confirm Your PIN';
      subtitle =
        setupStep === 'create'
          ? 'Set a 4-digit code to protect parental controls'
          : 'Re-enter the 4 digits to confirm';
    }

    return (
      <View
        style={[
          styles.lockedContainer,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <PinPad
          title={title}
          subtitle={subtitle}
          error={pinError}
          onComplete={handlePinComplete}
        />
      </View>
    );
  }

  // If unlocked, render full Parent Analytics Dashboard (designs/screen_parent.png)
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
          <View>
            <Text style={styles.headerTitle}>READORA</Text>
            <Text style={styles.headerSubtitle}>Parent Analytics</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Image
            source={require('../../../assets/images/icons/Notification.png')}
            style={styles.notificationIcon}
          />
          <TouchableOpacity
            style={styles.avatarPlaceholder}
            onPress={() => setShowChildSwitcher(true)}
          >
            <Text style={styles.avatarLetter}>
              {parentProfile?.display_name ? parentProfile.display_name[0] : 'P'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Parental Area Security Banner */}
        <View style={styles.parentAreaCard}>
          <View style={styles.parentAreaLeft}>
            <View style={styles.lockCircle}>
              <Text style={styles.lockIconSmall}>🔒</Text>
            </View>
            <View>
              <Text style={styles.parentAreaTitle}>Parental Area</Text>
              <View style={styles.verifiedRow}>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>🛡️ PIN Verified</Text>
                </View>
                <Text style={styles.authenticatedTime}>• Active session</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.kidModeButton}
            onPress={lockParent}
            activeOpacity={0.8}
          >
            <Text style={styles.kidModeText}>👶 Kid Mode</Text>
          </TouchableOpacity>
        </View>

        {/* Child Profile Switcher Strip */}
        <View style={styles.profileStrip}>
          <View style={styles.profileStripLeft}>
            <Text style={styles.profileStripLabel}>Monitoring Child:</Text>
            <Text style={styles.profileStripName}>
              {activeChild ? activeChild.display_name : 'No profile selected'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.switchChildBtn}
            onPress={() => setShowChildSwitcher(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.switchChildText}>Switch Child ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Log Past Reading Banner */}
        <View style={styles.logReadingCard}>
          <View style={styles.logReadingHeader}>
            <View style={styles.logReadingTitleRow}>
              <Text style={styles.logReadingIcon}>📖</Text>
              <Text style={styles.logReadingTitle}>Log Past Reading</Text>
            </View>
            <View style={styles.forChildBadge}>
              <Text style={styles.forChildText}>
                For {activeChild ? activeChild.display_name : 'Kid'}
              </Text>
            </View>
          </View>
          <Text style={styles.logReadingSubtitle}>
            Forgot to run the timer? Manually add reading time and pages read offline
            to keep their streak glowing.
          </Text>
          <TouchableOpacity style={styles.addLogBtn} activeOpacity={0.8}>
            <Text style={styles.addLogBtnText}>＋ Add Reading Log</Text>
          </TouchableOpacity>
        </View>

        {/* 2x2 Bento Stat Grid */}
        <View style={styles.bentoGrid}>
          {/* Total Pages */}
          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <Text style={styles.statIcon}>📚</Text>
              <View style={styles.growthBadge}>
                <Text style={styles.growthText}>Total</Text>
              </View>
            </View>
            <Text style={styles.statCardLabel}>Total Pages</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statCardValue}>
                {analytics ? analytics.totalPagesRead.toLocaleString() : '0'}
              </Text>
              <Text style={styles.statCardUnit}>pgs</Text>
            </View>
          </View>

          {/* Average Speed */}
          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <Text style={styles.statIcon}>🦊</Text>
              <Text style={styles.steadyBadge}>Average</Text>
            </View>
            <Text style={styles.statCardLabel}>Average Speed</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statCardValue}>
                {analytics ? analytics.avgPagesPerDay : 0}
              </Text>
              <Text style={styles.statCardUnit}>pg/day</Text>
            </View>
          </View>

          {/* Avg Session */}
          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.goalPill}>Goal: 20m</Text>
            </View>
            <Text style={styles.statCardLabel}>Avg Session</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statCardValue}>
                {analytics ? analytics.avgSessionMinutes : 0}
              </Text>
              <Text style={styles.statCardUnit}>mins</Text>
            </View>
          </View>

          {/* Current Streak */}
          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <Text style={styles.statIcon}>🔥</Text>
              <View style={styles.masteryBadge}>
                <Text style={styles.masteryText}>Streak</Text>
              </View>
            </View>
            <Text style={styles.statCardLabel}>Current Streak</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statCardValue}>
                {activeChild?.current_streak ?? 0}
              </Text>
              <Text style={styles.statCardUnit}>days</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]);
          }}
        >
          <Text style={styles.signOutText}>Sign Out Parent Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Child Switcher Sheet */}
      <ChildSwitcherModal
        visible={showChildSwitcher}
        onClose={() => setShowChildSwitcher(false)}
        onAddChild={() => navigation.navigate('CreateChild', { isFirstChild: false })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    width: 36,
    height: 36,
    marginRight: 12,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 22,
    height: 22,
    marginRight: 16,
    resizeMode: 'contain',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.primaryYellow,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: COLORS.textDark,
    fontWeight: '700',
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  parentAreaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.small,
  },
  parentAreaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lockIconSmall: {
    fontSize: 20,
  },
  parentAreaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  authenticatedTime: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  kidModeButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  kidModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  profileStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  profileStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileStripLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  profileStripName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  switchChildBtn: {
    backgroundColor: COLORS.progressCardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  switchChildText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryYellow,
  },
  logReadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  logReadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logReadingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logReadingIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logReadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  forChildBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  forChildText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  logReadingSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 16,
  },
  addLogBtn: {
    backgroundColor: COLORS.darkBlue,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addLogBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    ...SHADOWS.small,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 18,
  },
  growthBadge: {
    backgroundColor: '#FCEAE8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryCoral,
  },
  steadyBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  goalPill: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  masteryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  masteryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  statCardLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  statCardUnit: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  signOutText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 14,
  },
});