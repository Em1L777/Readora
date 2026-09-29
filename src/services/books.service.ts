import { supabase } from './supabase';
import { BookRow, BookInsert, BookUpdate, BookStatus } from '../types/database.types';

const BUCKET_NAME = 'book-covers';
export const DEFAULT_BOOK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80';

export const booksService = {
  /**
   * Fetches all books for a specific child, optionally filtered by status.
   */
  async getBooksByChildId(childId: string, status?: BookStatus): Promise<BookRow[]> {
    let query = supabase
      .from('books')
      .select('*')
      .eq('child_id', childId)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches a single book by ID.
   */
  async getBookById(bookId: string): Promise<BookRow | null> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Creates a new book record for a child.
   */
  async createBook(book: BookInsert): Promise<BookRow> {
    const { data, error } = await supabase
      .from('books')
      .insert({
        ...book,
        cover_url: book.cover_url || DEFAULT_BOOK_COVER,
        current_page: book.current_page || 1,
        status: book.status || 'reading',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Updates an existing book.
   */
  async updateBook(bookId: string, updates: BookUpdate): Promise<BookRow> {
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deletes a book by ID.
   */
  async deleteBook(bookId: string): Promise<void> {
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    if (error) throw error;
  },

  /**
   * Uploads an image file to the Supabase 'book-covers' bucket.
   * Path structured as: `${userId}/${timestamp}-${filename}`
   */
  async uploadCoverImage(userId: string, imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          upsert: true,
        });

      if (uploadError) {
        console.warn('Storage upload error, falling back to local/default:', uploadError);
        return imageUri;
      }

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.warn('Cover upload failed, using URI as fallback:', err);
      return imageUri;
    }
  },
};
