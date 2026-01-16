import { supabase } from '@/integrations/supabase/client';
import { type Tag } from '@/lib/types';
import { log } from '@/lib/utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseError = any;

/**
 * Generic function to handle tag CRUD operations with consistent error handling
 */
async function handleTagOperation<T>(
  operation: () => Promise<{ data: T | null; error: SupabaseError }>,
  errorMessage: string
): Promise<T | null> {
  try {
    const { data, error } = await operation();

    if (error) {
      log.error(errorMessage, error);
      return null;
    }

    return data;
  } catch (error) {
    log.error(`Error in ${errorMessage}:`, error);
    return null;
  }
}

/**
 * Generic function to handle tag delete operations
 */
async function handleTagDelete(
  operation: () => Promise<{ error: SupabaseError }>,
  errorMessage: string
): Promise<boolean> {
  try {
    const { error } = await operation();

    if (error) {
      log.error(errorMessage, error);
      return false;
    }

    return true;
  } catch (error) {
    log.error(`Error in ${errorMessage}:`, error);
    return false;
  }
}

export async function createTag(name: string, color: string): Promise<Tag | null> {
  return handleTagOperation(
    () => supabase.from('tags').insert({ name, color }).select().single(),
    'Error creating tag:'
  );
}

export async function updateTag(id: string, name: string, color: string): Promise<Tag | null> {
  return handleTagOperation(
    () => supabase.from('tags').update({ name, color }).eq('id', id).select().single(),
    'Error updating tag:'
  );
}

export async function deleteTag(id: string): Promise<boolean> {
  return handleTagDelete(
    () => supabase.from('tags').delete().eq('id', id),
    'Error deleting tag:'
  );
}

export async function getTagById(id: string): Promise<Tag | null> {
  return handleTagOperation(
    () => supabase.from('tags').select('*').eq('id', id).single(),
    'Error fetching tag:'
  );
}

