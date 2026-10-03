import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BookRow, BookStatus } from '../../types/database.types';
import { useBooksStore } from '../../store/useBooksStore';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { COLORS, SHADOWS } from '../../constants/theme';

interface BookDetailsModalProps {
  visible: boolean;
  book: BookRow | null;
  onClose: () => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  visible,
  book,
  onClose,
}) => {
  const { updateBook, deleteBook, activeBookId, setActiveBookId } = useBooksStore();

  const [totalPagesInput, setTotalPagesInput] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (book) {
      setTotalPagesInput(book.total_pages.toString());
      setIsCompleted(book.status === 'completed');
      setError(null);
    }
  }, [book, visible]);

  if (!book) return null;

  const isActive = activeBookId === book.id;
  const currentTotal = parseInt(totalPagesInput, 10) || book.total_pages;
  const progressPercent = Math.min(
    100,
    Math.round((book.current_page / Math.max(1, currentTotal)) * 100)
  );
  const pagesRemaining = Math.max(0, currentTotal - book.current_page);

  const handleTotalPagesChange = (text: string) => {
    setTotalPagesInput(text);
    setError(null);
  };

  const handleAdjustTotalPages = (delta: number) => {
    const nextVal = Math.max(book.current_page, currentTotal + delta);
    setTotalPagesInput(nextVal.toString());
    setError(null);
  };

  const handleToggleCompleted = () => {
    setIsCompleted((prev) => !prev);
    setError(null);
  };

  const handleSetActive = () => {
    setActiveBookId(book.id);
  };

  const handleSaveChanges = async () => {
    const parsedTotal = parseInt(totalPagesInput, 10);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      setError('Total pages must be a number greater than 0');
      return;
    }

    if (parsedTotal < book.current_page) {
      setError(`Total pages cannot be less than current page (${book.current_page})`);
      return;
    }

    try {
      setLoading(true);
      const nextStatus: BookStatus = isCompleted ? 'completed' : 'reading';
      const updates: { total_pages: number; status: BookStatus; current_page?: number } = {
        total_pages: parsedTotal,
        status: nextStatus,
      };

      // If marked as completed and current page is less than total, set to total pages
      if (isCompleted && book.current_page < parsedTotal) {
        updates.current_page = parsedTotal;
      }

      await updateBook(book.id, updates);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update book';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to remove "${book.title}" from your bookshelf?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteBook(book.id);
              onClose();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed to delete book';
              setError(msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheetContainer}>
          {/* Header pill & Close */}
          <View style={styles.sheetHeaderRow}>
            <View style={styles.indicator} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Book Details Hero Card */}
            <View style={styles.heroRow}>
              <View style={styles.coverWrapper}>
                {book.cover_url ? (
                  <Image source={{ uri: book.cover_url }} style={styles.coverImage} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Text style={styles.coverEmoji}>📖</Text>
                  </View>
                )}
              </View>

              <View style={styles.heroInfo}>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>⭐ CURRENT ADVENTURE</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.setActiveBtn}
                    onPress={handleSetActive}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.setActiveBtnText}>Set as Active Book ⭐</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>
                  {book.author ? `by ${book.author}` : 'Author unknown'}
                </Text>
              </View>
            </View>

            {/* Progress Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Reading Progress</Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: isCompleted ? COLORS.success : COLORS.primaryYellow,
                    },
                  ]}
                />
              </View>

              <View style={styles.progressSubRow}>
                <Text style={styles.progressPagesText}>
                  Page {book.current_page} of {currentTotal}
                </Text>
                <Text style={styles.progressRemainingText}>
                  {isCompleted ? '🎉 Completed' : `${pagesRemaining} pages left`}
                </Text>
              </View>
            </View>

            {/* Edit Total Pages */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Total Pages in Book</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleAdjustTotalPages(-10)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>-10</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleAdjustTotalPages(-1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>-1</Text>
                </TouchableOpacity>

                <View style={styles.inputCol}>
                  <Input
                    value={totalPagesInput}
                    onChangeText={handleTotalPagesChange}
                    keyboardType="numeric"
                    containerStyle={{ marginBottom: 0 }}
                    style={styles.centerInput}
                  />
                </View>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleAdjustTotalPages(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>+1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleAdjustTotalPages(10)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>+10</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mark as Completed Toggle Card */}
            <TouchableOpacity
              style={[
                styles.statusToggleCard,
                isCompleted && styles.statusToggleCardActive,
              ]}
              onPress={handleToggleCompleted}
              activeOpacity={0.85}
            >
              <View style={styles.statusToggleLeft}>
                <Text style={styles.statusToggleIcon}>{isCompleted ? '🎉' : '📖'}</Text>
                <View>
                  <Text style={styles.statusToggleTitle}>
                    {isCompleted ? 'Book Completed' : 'Mark as Read'}
                  </Text>
                  <Text style={styles.statusToggleSubtitle}>
                    {isCompleted
                      ? 'Moves book to Completed tab'
                      : 'Toggle when finished reading entire book'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.checkbox,
                  isCompleted && styles.checkboxChecked,
                ]}
              >
                {isCompleted && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <Button
              title="Save Changes"
              onPress={handleSaveChanges}
              loading={loading}
              style={styles.saveBtn}
            />

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeletePress}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteBtnText}>🗑️ Delete Book from Library</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '90%',
    ...SHADOWS.medium,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  indicator: {
    width: 44,
    height: 5,
    backgroundColor: COLORS.gray300,
    borderRadius: 3,
    alignSelf: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  closeBtn: {
    padding: 6,
    position: 'absolute',
    right: 0,
    top: -4,
  },
  closeBtnText: {
    fontSize: 18,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  heroRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  coverWrapper: {
    width: 80,
    height: 115,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.progressCardBg,
    marginRight: 16,
    ...SHADOWS.small,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E8DF',
  },
  coverEmoji: {
    fontSize: 32,
  },
  heroInfo: {
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  setActiveBtn: {
    backgroundColor: COLORS.progressCardBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  setActiveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    lineHeight: 22,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  progressCard: {
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryCoral,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPagesText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  progressRemainingText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  inputCol: {
    flex: 1,
  },
  centerInput: {
    textAlign: 'center',
    fontWeight: '700',
  },
  statusToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  statusToggleCardActive: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  statusToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  statusToggleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusToggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statusToggleSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: COLORS.streakBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
  },
  saveBtn: {
    marginBottom: 12,
  },
  deleteBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
