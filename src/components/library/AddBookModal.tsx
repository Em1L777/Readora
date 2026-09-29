import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/useAuthStore';
import { useBooksStore } from '../../store/useBooksStore';
import { booksService, DEFAULT_BOOK_COVER } from '../../services/books.service';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { COLORS, SHADOWS } from '../../constants/theme';

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e3ddb5?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80',
];

export const AddBookModal: React.FC<AddBookModalProps> = ({ visible, onClose }) => {
  const { user, getActiveChild } = useAuthStore();
  const { addBook } = useBooksStore();
  const activeChild = getActiveChild();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('1');
  const [selectedCover, setSelectedCover] = useState(DEFAULT_BOOK_COVER);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access photo gallery is required to upload custom covers.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLocalImageUri(result.assets[0].uri);
        setSelectedCover(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Book title is required';
    }

    const total = parseInt(totalPages, 10);
    if (!totalPages || isNaN(total) || total <= 0) {
      newErrors.totalPages = 'Enter a valid total page count (> 0)';
    }

    const current = parseInt(currentPage, 10);
    if (!currentPage || isNaN(current) || current < 1) {
      newErrors.currentPage = 'Starting page must be at least 1';
    } else if (total > 0 && current > total) {
      newErrors.currentPage = 'Current page cannot exceed total pages';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveBook = async () => {
    if (!validate() || !activeChild || !user) return;

    try {
      setLoading(true);

      let finalCoverUrl = selectedCover;
      // If local image was picked from device gallery, upload to Supabase storage bucket
      if (localImageUri) {
        finalCoverUrl = await booksService.uploadCoverImage(user.id, localImageUri);
      }

      const total = parseInt(totalPages, 10);
      const current = parseInt(currentPage, 10) || 1;

      await addBook({
        child_id: activeChild.id,
        title: title.trim(),
        author: author.trim() || null,
        total_pages: total,
        current_page: current,
        cover_url: finalCoverUrl,
        status: current === total ? 'completed' : 'reading',
      });

      // Reset form & close
      setTitle('');
      setAuthor('');
      setTotalPages('');
      setCurrentPage('1');
      setLocalImageUri(null);
      setSelectedCover(DEFAULT_BOOK_COVER);
      setErrors({});
      onClose();
    } catch (err: any) {
      console.error('Failed to save book:', err);
      setErrors({ form: err.message || 'Failed to save book' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheetContainer}>
          <View style={styles.indicator} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add New Book</Text>
              <Text style={styles.subtitle}>
                Adding to {activeChild ? activeChild.display_name : 'Kid'}'s bookshelf
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
            {errors.form ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.form}</Text>
              </View>
            ) : null}

            {/* Cover Picker Section */}
            <Text style={styles.sectionLabel}>Book Cover</Text>
            <View style={styles.coverSelectionRow}>
              <TouchableOpacity
                style={styles.customCoverBtn}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                {selectedCover ? (
                  <Image source={{ uri: selectedCover }} style={styles.coverPreview} />
                ) : (
                  <View style={styles.coverUploadPlaceholder}>
                    <Text style={styles.uploadIcon}>📷</Text>
                    <Text style={styles.uploadText}>Upload</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.presetCovers}>
                <Text style={styles.presetLabel}>Or pick a preset:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {PRESET_COVERS.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.presetThumb,
                        selectedCover === url && styles.presetThumbSelected,
                      ]}
                      onPress={() => {
                        setLocalImageUri(null);
                        setSelectedCover(url);
                      }}
                    >
                      <Image source={{ uri: url }} style={styles.presetImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Book Details */}
            <Input
              label="Book Title *"
              placeholder="e.g. Harry Potter and the Sorcerer's Stone"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
            />

            <Input
              label="Author (Optional)"
              placeholder="e.g. J.K. Rowling"
              value={author}
              onChangeText={setAuthor}
            />

            <View style={styles.pagesRow}>
              <View style={styles.pageInputCol}>
                <Input
                  label="Total Pages *"
                  placeholder="e.g. 240"
                  value={totalPages}
                  onChangeText={setTotalPages}
                  keyboardType="numeric"
                  error={errors.totalPages}
                />
              </View>

              <View style={styles.pageInputCol}>
                <Input
                  label="Current Page *"
                  placeholder="1"
                  value={currentPage}
                  onChangeText={setCurrentPage}
                  keyboardType="numeric"
                  error={errors.currentPage}
                />
              </View>
            </View>

            <Button
              title="Add Book to Library"
              onPress={handleSaveBook}
              loading={loading}
              style={styles.saveBtn}
            />
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
    maxHeight: '85%',
    ...SHADOWS.medium,
  },
  indicator: {
    width: 44,
    height: 5,
    backgroundColor: COLORS.gray300,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textLight,
  },
  formScroll: {
    marginBottom: 10,
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  coverSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  customCoverBtn: {
    width: 70,
    height: 95,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.progressCardBg,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverUploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  uploadText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  presetCovers: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  presetThumb: {
    width: 50,
    height: 70,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  presetThumbSelected: {
    borderColor: COLORS.primaryYellow,
  },
  presetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pageInputCol: {
    flex: 1,
  },
  saveBtn: {
    marginTop: 10,
    marginBottom: 20,
  },
});
