import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import { BookRow } from '../../types/database.types';
import { useBooksStore } from '../../store/useBooksStore';
import { COLORS, SHADOWS } from '../../constants/theme';

interface SelectActiveBookModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToLibrary?: () => void;
}

export const SelectActiveBookModal: React.FC<SelectActiveBookModalProps> = ({
  visible,
  onClose,
  onNavigateToLibrary,
}) => {
  const { books, activeBookId, setActiveBookId } = useBooksStore();

  const handleSelectBook = (bookId: string) => {
    setActiveBookId(bookId);
    onClose();
  };

  const readingBooks = books.filter((b) => b.status === 'reading');
  const otherBooks = books.filter((b) => b.status !== 'reading');

  const renderBookItem = (book: BookRow) => {
    const isActive = book.id === activeBookId;
    const progressPercent = Math.min(
      100,
      Math.round((book.current_page / Math.max(1, book.total_pages)) * 100)
    );

    return (
      <TouchableOpacity
        key={book.id}
        style={[styles.bookCard, isActive && styles.bookCardActive]}
        onPress={() => handleSelectBook(book.id)}
        activeOpacity={0.8}
      >
        <View style={styles.coverWrapper}>
          {book.cover_url ? (
            <Image source={{ uri: book.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverEmoji}>📖</Text>
            </View>
          )}
        </View>

        <View style={styles.bookInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.bookTitle} numberOfLines={1}>
              {book.title}
            </Text>
            {isActive && (
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>Active</Text>
              </View>
            )}
          </View>

          <Text style={styles.bookAuthor} numberOfLines={1}>
            {book.author ? `by ${book.author}` : 'Author unknown'}
          </Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              Page {book.current_page} / {book.total_pages} ({progressPercent}%)
            </Text>
          </View>
        </View>

        <View style={[styles.radioCircle, isActive && styles.radioCircleSelected]}>
          {isActive && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View style={styles.indicator} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Select Current Reading Book</Text>
          <Text style={styles.subtitle}>
            Choose which story you want to read in your next session!
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollList}>
            {readingBooks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>📖 Currently Reading</Text>
                {readingBooks.map(renderBookItem)}
              </View>
            )}

            {otherBooks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>📚 Other Books in Library</Text>
                {otherBooks.map(renderBookItem)}
              </View>
            )}

            {books.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📖</Text>
                <Text style={styles.emptyText}>No books in library yet!</Text>
              </View>
            )}

            {onNavigateToLibrary && (
              <TouchableOpacity
                style={styles.browseLibraryBtn}
                onPress={() => {
                  onClose();
                  onNavigateToLibrary();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.browseLibraryText}>＋ Browse & Add Books in Library</Text>
              </TouchableOpacity>
            )}
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '80%',
    ...SHADOWS.medium,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  indicator: {
    width: 44,
    height: 5,
    backgroundColor: COLORS.gray300,
    borderRadius: 3,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: -4,
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  scrollList: {
    marginBottom: 10,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  bookCardActive: {
    borderColor: COLORS.primaryYellow,
    backgroundColor: '#FFFEFA',
  },
  coverWrapper: {
    width: 46,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.progressCardBg,
    marginRight: 12,
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
    fontSize: 20,
  },
  bookInfo: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    flexShrink: 1,
  },
  activeTag: {
    backgroundColor: COLORS.primaryYellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  bookAuthor: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  progressRow: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.primaryYellow,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primaryYellow,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  browseLibraryBtn: {
    backgroundColor: COLORS.progressCardBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  browseLibraryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
});
