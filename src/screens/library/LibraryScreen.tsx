import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useBooksStore } from '../../store/useBooksStore';
import { StatusTabs } from '../../components/library/StatusTabs';
import { BookCard } from '../../components/library/BookCard';
import { AddBookModal } from '../../components/library/AddBookModal';
import { BookDetailsModal } from '../../components/library/BookDetailsModal';
import { ChildSwitcherModal } from '../../components/parent/ChildSwitcherModal';
import { BookRow } from '../../types/database.types';
import { COLORS, SHADOWS } from '../../constants/theme';

export const LibraryScreen = () => {
  const insets = useSafeAreaInsets();
  const { getActiveChild } = useAuthStore();
  const {
    selectedStatus,
    activeBookId,
    isLoading,
    isRefreshing,
    fetchBooks,
    setSelectedStatus,
    getFilteredBooks,
    getStatusCounts,
  } = useBooksStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showChildSwitcher, setShowChildSwitcher] = useState(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<BookRow | null>(null);

  const activeChild = getActiveChild();
  const filteredBooks = getFilteredBooks();
  const counts = getStatusCounts();

  useEffect(() => {
    if (activeChild) {
      fetchBooks(activeChild.id);
    }
  }, [activeChild?.id]);

  const handleRefresh = () => {
    if (activeChild) {
      fetchBooks(activeChild.id, true);
    }
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={COLORS.primaryYellow} />
          <Text style={styles.loadingText}>Loading bookshelf...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require('../../../assets/images/mascot/fox.png')}
          style={styles.emptyMascot}
        />
        <Text style={styles.emptyTitle}>
          {selectedStatus === 'reading'
            ? 'No books in progress!'
            : selectedStatus === 'completed'
            ? 'No finished books yet!'
            : 'No books on hold!'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {selectedStatus === 'reading'
            ? 'Add a new story to track pages, gain XP and keep your streak shining!'
            : 'Complete reading sessions to celebrate finished books here.'}
        </Text>
        <TouchableOpacity
          style={styles.emptyAddBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyAddBtnText}>＋ Add Book to Bookshelf</Text>
        </TouchableOpacity>
      </View>
    );
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
          <View>
            <Text style={styles.headerTitle}>Kid Library</Text>
            <TouchableOpacity
              onPress={() => setShowChildSwitcher(true)}
              style={styles.childBadge}
            >
              <Text style={styles.childBadgeText}>
                {activeChild ? activeChild.display_name : 'Kid'}'s Books ▾
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBookHeaderBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBookHeaderBtnText}>＋ Add Book</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Status Filter Tabs */}
        <StatusTabs
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          counts={counts}
        />

        {/* Books List */}
        <FlatList
          data={filteredBooks}
          keyExtractor={(item: BookRow) => item.id}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              isActive={item.id === activeBookId}
              onPress={() => setSelectedBookForDetails(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredBooks.length === 0 && styles.listContentEmpty,
            { paddingBottom: insets.bottom + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primaryYellow}
              colors={[COLORS.primaryYellow]}
            />
          }
        />
      </View>

      {/* Add Book Modal */}
      <AddBookModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Book Details Modal Screen / Sheet */}
      <BookDetailsModal
        visible={Boolean(selectedBookForDetails)}
        book={selectedBookForDetails}
        onClose={() => setSelectedBookForDetails(null)}
      />

      {/* Child Switcher Modal */}
      <ChildSwitcherModal
        visible={showChildSwitcher}
        onClose={() => setShowChildSwitcher(false)}
        onAddChild={() => {}}
      />
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
    paddingBottom: 14,
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
    marginRight: 10,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  childBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  childBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  addBookHeaderBtn: {
    backgroundColor: COLORS.primaryYellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...SHADOWS.small,
  },
  addBookHeaderBtnText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  listContentEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyMascot: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyAddBtn: {
    backgroundColor: COLORS.primaryYellow,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 24,
    ...SHADOWS.primaryButton,
  },
  emptyAddBtnText: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: '700',
  },
});