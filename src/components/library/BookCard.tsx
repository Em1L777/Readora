import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { BookRow, BookStatus } from '../../types/database.types';
import { useBooksStore } from '../../store/useBooksStore';
import { COLORS, SHADOWS } from '../../constants/theme';

interface BookCardProps {
  book: BookRow;
  isActive: boolean;
  onPress?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, isActive, onPress }) => {
  const { updateBook, deleteBook, setActiveBookId } = useBooksStore();
  const [imageError, setImageError] = useState(false);

  const progressPercent = Math.min(
    100,
    Math.round((book.current_page / Math.max(1, book.total_pages)) * 100)
  );

  const pagesRemaining = Math.max(0, book.total_pages - book.current_page);

  const handleStatusChange = () => {
    const nextStatusMap: Record<BookStatus, BookStatus> = {
      reading: 'completed',
      completed: 'dropped',
      dropped: 'reading',
    };

    const nextStatus = nextStatusMap[book.status];
    updateBook(book.id, { status: nextStatus });
  };

  const handleOptionsPress = () => {
    Alert.alert(
      book.title,
      `Author: ${book.author || 'Unknown'}\nProgress: Page ${book.current_page}/${book.total_pages} (${progressPercent}%)`,
      [
        {
          text: isActive ? 'Currently Active Story' : 'Set as Current Active Book',
          onPress: () => setActiveBookId(book.id),
        },
        {
          text: `Move to ${book.status === 'reading' ? 'Completed' : book.status === 'completed' ? 'On Hold' : 'Reading'}`,
          onPress: handleStatusChange,
        },
        {
          text: 'Delete Book',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Delete Book', `Are you sure you want to delete "${book.title}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteBook(book.id) },
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.activeCard]}
      onPress={onPress || handleOptionsPress}
      activeOpacity={0.85}
    >
      {/* Top Banner for Active Book */}
      {isActive && (
        <View style={styles.activeBanner}>
          <Text style={styles.activeBannerText}>⭐ CURRENT ADVENTURE</Text>
        </View>
      )}

      <View style={styles.mainRow}>
        {/* Cover Thumbnail */}
        <View style={styles.coverWrapper}>
          {book.cover_url && !imageError ? (
            <Image
              source={{ uri: book.cover_url }}
              style={styles.coverImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderIcon}>📖</Text>
              <Text style={styles.coverPlaceholderText} numberOfLines={2}>
                {book.title}
              </Text>
            </View>
          )}
        </View>

        {/* Info & Progress */}
        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.bookTitle} numberOfLines={2}>
              {book.title}
            </Text>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={handleOptionsPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.moreIcon}>⋮</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bookAuthor} numberOfLines={1}>
            {book.author ? `by ${book.author}` : 'Author unknown'}
          </Text>

          {/* Progress Block */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.pageCountText}>
                Page {book.current_page} of {book.total_pages}
              </Text>
              <Text style={styles.percentText}>{progressPercent}%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor:
                      book.status === 'completed'
                        ? COLORS.success
                        : COLORS.primaryYellow,
                  },
                ]}
              />
            </View>

            <Text style={styles.remainingText}>
              {book.status === 'completed'
                ? '🎉 Completed'
                : `${pagesRemaining} pages left`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  activeCard: {
    borderColor: COLORS.primaryYellow,
    backgroundColor: '#FFFEFA',
  },
  activeBanner: {
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  activeBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  mainRow: {
    flexDirection: 'row',
  },
  coverWrapper: {
    width: 75,
    height: 105,
    borderRadius: 12,
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
    padding: 6,
  },
  coverPlaceholderIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  coverPlaceholderText: {
    fontSize: 10,
    color: COLORS.textDark,
    textAlign: 'center',
    fontWeight: '600',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 20,
    marginRight: 6,
  },
  moreBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  moreIcon: {
    fontSize: 18,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: 10,
  },
  progressContainer: {
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 12,
    padding: 10,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pageCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryCoral,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
  },
});
