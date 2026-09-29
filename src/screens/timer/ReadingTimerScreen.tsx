import React, { useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useBooksStore } from '../../store/useBooksStore';
import { useReadingSessionStore } from '../../store/useReadingSessionStore';
import { CircularProgressTimer } from '../../components/timer/CircularProgressTimer';
import { RestEyesModal } from '../../components/timer/RestEyesModal';
import { SaveSessionModal } from '../../components/save/SaveSessionModal';
import { LevelUpModal } from '../../components/save/LevelUpModal';
import { readingService } from '../../services/reading.service';
import { LogReadingSessionResult } from '../../types/database.types';
import { COLORS, SHADOWS } from '../../constants/theme';

export const ReadingTimerScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { getActiveChild, refreshProfiles } = useAuthStore();
  const { getActiveBook, fetchBooks } = useBooksStore();
  const activeChild = getActiveChild();
  const activeBook = getActiveBook();

  const {
    isSessionActive,
    isPaused,
    elapsedSeconds,
    goalMinutes,
    startPage,
    currentReadingPage,
    lastResult,
    startSession,
    pauseSession,
    resumeSession,
    tick,
    incrementPage,
    decrementPage,
    finishSession,
    resetSession,
  } = useReadingSessionStore();

  const [showRestEyes, setShowRestEyes] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [sessionCompletedResult, setSessionCompletedResult] =
    useState<LogReadingSessionResult | null>(null);

  // Initialize session on mount if not already active
  useEffect(() => {
    if (activeBook && !isSessionActive) {
      startSession(activeBook, 20);
    }
  }, [activeBook?.id]);

  // Interval timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate live preview metrics
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const pagesReadCount = Math.max(0, currentReadingPage - startPage);
  const preview = readingService.calculateSessionPreview(
    startPage,
    currentReadingPage,
    activeBook ? activeBook.total_pages : 100,
    elapsedMinutes
  );

  const handleFinishAndSave = async (endPage: number) => {
    if (!activeChild) return;
    try {
      const result = await finishSession(activeChild.id, endPage);
      setSessionCompletedResult(result);
      setShowLevelUpModal(true);

      // Refresh child profile (XP, level, streak) and books list
      await refreshProfiles();
      await fetchBooks(activeChild.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save session';
      Alert.alert('Error', message);
      throw err;
    }
  };

  const handleCloseLevelUp = () => {
    setShowLevelUpModal(false);
    resetSession();
    navigation.goBack();
  };

  const handleCancelSession = () => {
    Alert.alert(
      'Leave Reading Session?',
      'Your active timer progress will be lost if you discard without saving.',
      [
        { text: 'Keep Reading', style: 'cancel' },
        {
          text: 'Discard Session',
          style: 'destructive',
          onPress: () => {
            resetSession();
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!activeBook) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyTitle}>No active book found</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.emptyButtonText}>Back to Library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleCancelSession}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>▾</Text>
        </TouchableOpacity>

        <View style={styles.sessionPill}>
          <View style={styles.sessionDot} />
          <Text style={styles.sessionPillText}>
            {isPaused ? 'Session Paused' : 'Reading Session'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.soundBtn}
          onPress={() => Alert.alert('Ambient Sounds', 'Cosmic library ambience active 🎧')}
          activeOpacity={0.7}
        >
          <Text style={styles.soundIcon}>🎵</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ACTIVE STORY Card */}
        <View style={styles.storyCard}>
          <View style={styles.storyCoverWrapper}>
            {activeBook.cover_url ? (
              <Image source={{ uri: activeBook.cover_url }} style={styles.storyCover} />
            ) : (
              <View style={styles.storyPlaceholder}>
                <Text style={styles.storyEmoji}>📖</Text>
              </View>
            )}
          </View>

          <View style={styles.storyDetails}>
            <View style={styles.storyBadgeRow}>
              <View style={styles.activeStoryBadge}>
                <Text style={styles.activeStoryBadgeText}>ACTIVE STORY</Text>
              </View>
              <Text style={styles.goalText}>Goal: {goalMinutes} min</Text>
            </View>

            <Text style={styles.storyTitle} numberOfLines={1}>
              {activeBook.title}
            </Text>
            <Text style={styles.storyStartingPage}>
              Starting from Page {startPage}
            </Text>
          </View>
        </View>

        {/* Motivational Mascot Speech */}
        <View style={styles.speechBubble}>
          <Text style={styles.speechSparkle}>✨</Text>
          <Text style={styles.speechText}>
            You're doing amazing, {activeChild?.display_name || 'reader'}! Keep reading!
          </Text>
        </View>

        {/* Circular Progress Timer */}
        <CircularProgressTimer
          elapsedSeconds={elapsedSeconds}
          goalMinutes={goalMinutes}
        />

        {/* Stats Row: Pages Read & Star XP */}
        <View style={styles.statsRow}>
          {/* Pages Read Stepper */}
          <View style={styles.statBox}>
            <View style={styles.statBoxHeader}>
              <Text style={styles.statBoxTitle}>PAGES READ</Text>
              <Text style={styles.statBoxIcon}>📖</Text>
            </View>

            <View style={styles.stepperMiniRow}>
              <TouchableOpacity
                style={[
                  styles.miniStepBtn,
                  currentReadingPage <= startPage && styles.miniStepBtnDisabled,
                ]}
                onPress={decrementPage}
                disabled={currentReadingPage <= startPage}
              >
                <Text style={styles.miniStepText}>−</Text>
              </TouchableOpacity>

              <Text style={styles.pagesCountNumber}>{pagesReadCount}</Text>

              <TouchableOpacity
                style={[
                  styles.miniStepBtn,
                  styles.miniStepBtnAdd,
                  currentReadingPage >= activeBook.total_pages && styles.miniStepBtnDisabled,
                ]}
                onPress={incrementPage}
                disabled={currentReadingPage >= activeBook.total_pages}
              >
                <Text style={[styles.miniStepText, styles.miniStepTextAdd]}>＋</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.nowOnPageText}>Now on page {currentReadingPage}</Text>
          </View>

          {/* Star XP Box */}
          <View style={styles.statBox}>
            <View style={styles.statBoxHeader}>
              <Text style={styles.statBoxTitle}>STAR XP</Text>
              <Text style={styles.statBoxIcon}>⭐</Text>
            </View>

            <Text style={styles.xpBigValue}>+{preview.xpEarned} ⭐</Text>
            <Text style={styles.xpBonusSub}>
              {elapsedMinutes >= goalMinutes
                ? 'Goal achieved! (+Bonus)'
                : `+10 Bonus at ${goalMinutes}m`}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          <View style={styles.subActionsRow}>
            <TouchableOpacity
              style={[
                styles.pauseBtn,
                isPaused && styles.resumeBtn,
              ]}
              onPress={isPaused ? resumeSession : pauseSession}
              activeOpacity={0.8}
            >
              <Text style={styles.pauseBtnText}>
                {isPaused ? '▶  Resume Session' : '⏸  Pause Session'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restEyesBtn}
              onPress={() => setShowRestEyes(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.restEyesText}>🧘 Rest Eyes</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => setShowSaveModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.finishBtnText}>
              ✓ Finish Session & Log Pages
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Rest Eyes Modal */}
      <RestEyesModal
        visible={showRestEyes}
        onClose={() => setShowRestEyes(false)}
      />

      {/* Save Session Modal */}
      <SaveSessionModal
        visible={showSaveModal}
        book={activeBook}
        startPage={startPage}
        initialEndPage={currentReadingPage}
        durationMinutes={elapsedMinutes}
        onClose={() => setShowSaveModal(false)}
        onSave={handleFinishAndSave}
      />

      {/* Level Up Celebration Modal */}
      <LevelUpModal
        visible={showLevelUpModal}
        result={sessionCompletedResult}
        onClose={handleCloseLevelUp}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: COLORS.primaryYellow,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontWeight: '700',
    color: COLORS.textDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  backIcon: {
    fontSize: 22,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    ...SHADOWS.small,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryYellow,
  },
  sessionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  soundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  soundIcon: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  storyCoverWrapper: {
    width: 48,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.progressCardBg,
    marginRight: 12,
  },
  storyCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyEmoji: {
    fontSize: 20,
  },
  storyDetails: {
    flex: 1,
  },
  storyBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeStoryBadge: {
    backgroundColor: '#FCEAE8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeStoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryCoral,
  },
  goalText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  storyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  storyStartingPage: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  speechBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'center',
    marginBottom: 8,
    gap: 8,
  },
  speechSparkle: {
    fontSize: 16,
  },
  speechText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338CA',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    ...SHADOWS.small,
  },
  statBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  statBoxIcon: {
    fontSize: 14,
  },
  stepperMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  miniStepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.progressCardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniStepBtnAdd: {
    backgroundColor: COLORS.primaryYellow,
  },
  miniStepBtnDisabled: {
    opacity: 0.4,
  },
  miniStepText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  miniStepTextAdd: {
    color: COLORS.textDark,
  },
  pagesCountNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  nowOnPageText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  xpBigValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D97706',
    marginVertical: 6,
    textAlign: 'center',
  },
  xpBonusSub: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryYellow,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.primaryButton,
  },
  resumeBtn: {
    backgroundColor: '#3B82F6',
  },
  pauseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  restEyesBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  restEyesText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  finishBtn: {
    backgroundColor: COLORS.primaryCoral,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    ...SHADOWS.coralButton,
  },
  finishBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
