import { create } from 'zustand';
import { BookRow, BookInsert, BookUpdate, BookStatus } from '../types/database.types';
import { booksService } from '../services/books.service';

interface BooksState {
  books: BookRow[];
  selectedStatus: BookStatus;
  activeBookId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Selectors
  getActiveBook: () => BookRow | null;
  getFilteredBooks: () => BookRow[];
  getStatusCounts: () => Record<BookStatus | 'all', number>;

  // Actions
  fetchBooks: (childId: string, isRefresh?: boolean) => Promise<void>;
  addBook: (book: BookInsert) => Promise<BookRow>;
  updateBook: (bookId: string, updates: BookUpdate) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  setSelectedStatus: (status: BookStatus) => void;
  setActiveBookId: (bookId: string | null) => void;
}

export const useBooksStore = create<BooksState>((set, get) => ({
  books: [],
  selectedStatus: 'reading',
  activeBookId: null,
  isLoading: false,
  isRefreshing: false,
  error: null,

  getActiveBook: () => {
    const { books, activeBookId } = get();
    if (activeBookId) {
      const found = books.find((b) => b.id === activeBookId);
      if (found) return found;
    }
    // Fallback: first book currently being read, or first book in list
    return books.find((b) => b.status === 'reading') || books[0] || null;
  },

  getFilteredBooks: () => {
    const { books, selectedStatus } = get();
    return books.filter((b) => b.status === selectedStatus);
  },

  getStatusCounts: () => {
    const { books } = get();
    return {
      all: books.length,
      reading: books.filter((b) => b.status === 'reading').length,
      completed: books.filter((b) => b.status === 'completed').length,
      dropped: books.filter((b) => b.status === 'dropped').length,
    };
  },

  fetchBooks: async (childId: string, isRefresh = false) => {
    try {
      if (isRefresh) {
        set({ isRefreshing: true, error: null });
      } else {
        set({ isLoading: true, error: null });
      }

      const books = await booksService.getBooksByChildId(childId);

      set((state) => {
        // If activeBookId not set or not in list, auto select first reading book
        let activeBookId = state.activeBookId;
        if (!activeBookId || !books.some((b) => b.id === activeBookId)) {
          const readingBook = books.find((b) => b.status === 'reading');
          activeBookId = readingBook ? readingBook.id : books[0]?.id || null;
        }

        return {
          books,
          activeBookId,
          isLoading: false,
          isRefreshing: false,
          error: null,
        };
      });
    } catch (err: unknown) {
      console.error('Failed to fetch books:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch books';
      set({
        error: message,
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  addBook: async (newBookData: BookInsert) => {
    try {
      set({ error: null });
      const createdBook = await booksService.createBook(newBookData);

      set((state) => ({
        books: [createdBook, ...state.books],
        activeBookId: createdBook.status === 'reading' ? createdBook.id : state.activeBookId,
      }));

      return createdBook;
    } catch (err: unknown) {
      console.error('Failed to add book:', err);
      const message = err instanceof Error ? err.message : 'Failed to add book';
      set({ error: message });
      throw err;
    }
  },

  updateBook: async (bookId: string, updates: BookUpdate) => {
    try {
      set({ error: null });
      const updated = await booksService.updateBook(bookId, updates);

      set((state) => ({
        books: state.books.map((b) => (b.id === bookId ? updated : b)),
      }));
    } catch (err: unknown) {
      console.error('Failed to update book:', err);
      const message = err instanceof Error ? err.message : 'Failed to update book';
      set({ error: message });
      throw err;
    }
  },

  deleteBook: async (bookId: string) => {
    try {
      set({ error: null });
      await booksService.deleteBook(bookId);

      set((state) => ({
        books: state.books.filter((b) => b.id !== bookId),
        activeBookId: state.activeBookId === bookId ? null : state.activeBookId,
      }));
    } catch (err: unknown) {
      console.error('Failed to delete book:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete book';
      set({ error: message });
      throw err;
    }
  },

  setSelectedStatus: (status: BookStatus) => set({ selectedStatus: status }),

  setActiveBookId: (bookId: string | null) => set({ activeBookId: bookId }),
}));
