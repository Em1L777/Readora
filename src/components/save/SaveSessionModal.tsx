import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { BookRow, LogReadingSessionResult } from '../../types/database.types';
import { readingService } from '../../services/reading.service';
import { Button } from '../common/Button';
import { COLORS, SHADOWS } from '../../constants/theme';

interface SaveSessionModalProps {
  visible: boolean;
  book: BookRow;
  startPage: number;
  initialEndPage: number;
  durationMinutes: number;
  onClose: () => void;
  onSave: (endPage: number) => Promise<LogReadingSessionResult | void>;
}

export const SaveSessionModal: React.FC<SaveSessionModalProps> = ({
  visible,
  book,
  startPage,
  initialEndPage,
  durationMinutes,
  onClose,
  onSave,
}) => {
  const [endPage, setEndPage] = useState<number>(initialEndPage);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setEndPage(Math.max(startPage, initialEndPage));
  }, [initialEndPage, startPage, visible]);

  const preview = readingService.calculateSessionPreview(
    startPage,
    endPage,
    book.total_pages,
    durationMinutes
  );

  const handleIncrement = () => {
    if (endPage < book.total_pages) {
      setEndPage((prev) => prev + 1);
      setValidationError(null);
    }
  };

  const handleDecrement = () => {
    if (endPage > startPage) {
      setEndPage((prev) => prev - 1);
      setValidationError(null);
    }
  };

  const handleQuickAdd = (pagesToAdd: number) => {
    const target = Math.min(book.total_pages, endPage + pagesToAdd);
    setEndPage(target);
    setValidationError(null);
  };

  const handleManualInput = (text: string) => {
    const val = parseInt(text, 10);
    if (isNaN(val)) {
      setEndPage(startPage);
    } else {
      setEndPage(val);
    }
    setValidationError(null);
  };

  const handleSubmit = async () => {
    if (endPage < startPage) {
      setValidationError(`Page cannot be less than started page (${startPage})`);
      return;
    }
    if (endPage > book.total_pages) {
      setValidationError(`Page cannot exceed book total (${book.total_pages})`);
      return;
    }

    try {
      setLoading(true);
      await onSave(endPage);
      onClose();
    } catch (err: unknown) {
      console.error('Save error:', err);
      const message = err instanceof Error ? err.message : 'Failed to save session';
      setValidationError(message);
    } finally {
      setLoading(false);
    }
  };

  const dailyGoalPercentage = Math.min(
    200,
    Math.round((preview.pagesRead / Math.max(1, 10)) * 100)
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheetContainer}>
          {/* Top Pill / Close */}
          <View style={styles.sheetHeaderRow}>
            <View style={styles.dailyLogBadge}>
              <Text style={styles.dailyLogIcon}>🔖</Text>
              <Text style={styles.dailyLogText}>DAILY LOG</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title & Subtitle */}
            <Text style={styles.title}>How much did you read today?</Text>
            <Text style={styles.subtitle}>
              Update your bookmark to keep your streak glowing!
            </Text>

            {/* Current Adventure Card */}
            <View style={styles.adventureCard}>
              <View style={styles.bookThumbWrapper}>
                {book.cover_url ? (
                  <Image source={{ uri: book.cover_url }} style={styles.bookThumb} />
                ) : (
                  <View style={styles.bookThumbPlaceholder}>
                    <Text style={styles.bookThumbEmoji}>📖</Text>
                  </View>
                )}
              </View>

              <View style={styles.adventureDetails}>
                <Text style={styles.adventureLabel}>CURRENT ADVENTURE</Text>
                <Text style={styles.adventureTitle} numberOfLines={1}>
                  {book.title}
                </Text>
                <Text style={styles.adventureSub}>
                  Last saved: Page {startPage} of {book.total_pages}
                </Text>
              </View>
            </View>

            {/* Currently on page Stepper Card */}
            <View style={styles.stepperCard}>
              <Text style={styles.stepperHeader}>I am currently on page</Text>

              <View style={styles.stepperControlRow}>
                <TouchableOpacity
                  style={[
                    styles.stepCircleBtn,
                    endPage <= startPage && styles.stepCircleBtnDisabled,
                  ]}
                  onPress={handleDecrement}
                  disabled={endPage <= startPage}
                >
                  <Text style={styles.stepCircleIcon}>−</Text>
                </TouchableOpacity>

                <View style={styles.pageNumberBox}>
                  <TextInput
                    style={styles.pageNumberInput}
                    value={endPage.toString()}
                    onChangeText={handleManualInput}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.stepCircleBtn,
                    styles.stepCircleBtnAdd,
                    endPage >= book.total_pages && styles.stepCircleBtnDisabled,
                  ]}
                  onPress={handleIncrement}
                  disabled={endPage >= book.total_pages}
                >
                  <Text style={styles.stepCircleIcon}>＋</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Add Chips */}
              <View style={styles.quickAddRow}>
                <Text style={styles.quickAddLabel}>Quick add:</Text>
                {[5, 10, 15].map((pages) => (
                  <TouchableOpacity
                    key={pages}
                    style={styles.quickChip}
                    onPress={() => handleQuickAdd(pages)}
                  >
                    <Text style={styles.quickChipText}>+{pages} pages</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {validationError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{validationError}</Text>
              </View>
            ) : null}

            {/* Mascot Celebration Banner */}
            <View style={styles.celebrationBanner}>
              <Image
                source={require('../../../assets/images/mascot/fox.png')}
                style={styles.celebrationMascot}
              />
              <View style={styles.celebrationTextCol}>
                <Text style={styles.celebrationTitle}>Awesome job! 🎉</Text>
                <Text style={styles.celebrationSub}>
                  +{preview.pagesRead} pages read today! (+{preview.xpEarned} XP)
                </Text>
              </View>
              <View style={styles.starBadge}>
                <Text style={styles.starBadgeText}>⭐</Text>
              </View>
            </View>

            {/* Daily Goal Progress */}
            <View style={styles.goalSection}>
              <View style={styles.goalTextRow}>
                <Text style={styles.goalLabel}>Daily Goal Progress</Text>
                <Text style={styles.goalValue}>{dailyGoalPercentage}% of daily goal</Text>
              </View>
              <View style={styles.goalBarTrack}>
                <View
                  style={[
                    styles.goalBarFill,
                    { width: `${Math.min(100, dailyGoalPercentage)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Save Button */}
            <Button
              title="Save Today's Progress ⭐"
              variant="coral"
              onPress={handleSubmit}
              loading={loading}
              style={styles.saveBtn}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    maxHeight: '90%',
    ...SHADOWS.medium,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dailyLogBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  dailyLogIcon: {
    fontSize: 14,
  },
  dailyLogText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 18,
    lineHeight: 20,
  },
  adventureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
  },
  bookThumbWrapper: {
    width: 50,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    marginRight: 14,
    ...SHADOWS.small,
  },
  bookThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookThumbPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookThumbEmoji: {
    fontSize: 20,
  },
  adventureDetails: {
    flex: 1,
  },
  adventureLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryCoral,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  adventureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  adventureSub: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  stepperCard: {
    backgroundColor: '#F0F6FF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  stepperHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  stepperControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 18,
  },
  stepCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryCoral,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.coralButton,
  },
  stepCircleBtnAdd: {
    backgroundColor: COLORS.primaryYellow,
    ...SHADOWS.primaryButton,
  },
  stepCircleBtnDisabled: {
    opacity: 0.4,
    backgroundColor: COLORS.gray300,
    elevation: 0,
    shadowOpacity: 0,
  },
  stepCircleIcon: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
  },
  pageNumberBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  pageNumberInput: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAddLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  quickChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    ...SHADOWS.small,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  errorBox: {
    backgroundColor: COLORS.streakBg,
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  celebrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E6',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  celebrationMascot: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 12,
  },
  celebrationTextCol: {
    flex: 1,
  },
  celebrationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  celebrationSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.streakText,
    marginTop: 2,
  },
  starBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  starBadgeText: {
    fontSize: 18,
  },
  goalSection: {
    marginBottom: 20,
  },
  goalTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  goalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryYellow,
  },
  goalBarTrack: {
    height: 10,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 5,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryYellow,
    borderRadius: 5,
  },
  saveBtn: {
    marginBottom: 10,
  },
});
