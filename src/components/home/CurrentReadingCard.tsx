import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useBooksStore } from '../../store/useBooksStore';
import { SelectActiveBookModal } from './SelectActiveBookModal';
import { COLORS, SHADOWS } from '../../constants/theme';

export const CurrentReadingCard = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { getActiveChild } = useAuthStore();
  const { getActiveBook, books } = useBooksStore();
  const [showSelectModal, setShowSelectModal] = useState(false);

  const activeChild = getActiveChild();
  const activeBook = getActiveBook();

  if (!activeBook) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Current reading</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              🔥 {activeChild?.current_streak ?? 0}-Day Streak!
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.emptyBookContainer}
          onPress={() => {
            if (books.length > 0) {
              setShowSelectModal(true);
            } else {
              navigation.navigate('Library');
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyBookIcon}>📚</Text>
          <Text style={styles.emptyBookTitle}>No Active Book Selected</Text>
          <Text style={styles.emptyBookSub}>
            Tap here to pick a book from your library or add a new story today!
          </Text>
          <View style={styles.chooseBookBtn}>
            <Text style={styles.chooseBookBtnText}>
              {books.length > 0 ? 'Select Active Book' : 'Browse Library'}
            </Text>
          </View>
        </TouchableOpacity>

        <SelectActiveBookModal
          visible={showSelectModal}
          onClose={() => setShowSelectModal(false)}
          onNavigateToLibrary={() => navigation.navigate('Library')}
        />
      </View>
    );
  }

  const progressPercent = Math.min(
    100,
    Math.round((activeBook.current_page / Math.max(1, activeBook.total_pages)) * 100)
  );

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.cardTitle}>Current reading</Text>
          {books.length > 1 && (
            <TouchableOpacity
              style={styles.changeBookBtn}
              onPress={() => setShowSelectModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.changeBookBtnText}>Change ▾</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>
            🔥 {activeChild?.current_streak ?? 0}-Day Streak!
          </Text>
        </View>
      </View>

      {/* Book Info */}
      <View style={styles.bookInfoContainer}>
        <View style={styles.bookCoverWrapper}>
          {activeBook.cover_url ? (
            <Image
              source={{ uri: activeBook.cover_url }}
              style={styles.bookCoverImage}
            />
          ) : (
            <View style={styles.bookCoverPlaceholder}>
              <Text style={styles.placeholderEmoji}>📖</Text>
            </View>
          )}
        </View>

        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {activeBook.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {activeBook.author ? `by ${activeBook.author}` : 'Author unknown'}
          </Text>

          <View style={styles.timeInfo}>
            <Text style={styles.timeIcon}>⏱️</Text>
            <Text style={styles.timeText}>Est. 15 mins left today</Text>
          </View>
        </View>
      </View>

      {/* Progress Block */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.pageText}>
            📖 Page {activeBook.current_page} of {activeBook.total_pages}
          </Text>
          <Text style={styles.percentText}>{progressPercent}%</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>

        <Text style={styles.goalText}>
          Goal: {Math.max(1, Math.round(activeBook.total_pages / 10))} pages/day
        </Text>
      </View>

      {/* Book Selector Modal */}
      <SelectActiveBookModal
        visible={showSelectModal}
        onClose={() => setShowSelectModal(false)}
        onNavigateToLibrary={() => navigation.navigate('Library')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  changeBookBtn: {
    backgroundColor: COLORS.progressCardBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  changeBookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  streakBadge: {
    backgroundColor: COLORS.streakBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    color: COLORS.streakText,
    fontSize: 12,
    fontWeight: '700',
  },
  bookInfoContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  bookCoverWrapper: {
    width: 65,
    height: 95,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.progressCardBg,
    marginRight: 16,
    ...SHADOWS.small,
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookCoverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E8DF',
  },
  placeholderEmoji: {
    fontSize: 24,
  },
  bookDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
    lineHeight: 22,
  },
  bookAuthor: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 10,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  progressSection: {
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 16,
    padding: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pageText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryYellow,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryYellow,
    borderRadius: 5,
  },
  goalText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  emptyBookContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  emptyBookIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyBookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  emptyBookSub: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  chooseBookBtn: {
    backgroundColor: COLORS.primaryYellow,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
  },
  chooseBookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
});