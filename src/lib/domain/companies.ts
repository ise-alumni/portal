import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/utils/logger';

export interface Company {
  id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewCompany {
  name: string;
  website?: string | null;
  logo_url?: string | null;
  description?: string | null;
}

type SupabaseInsert = Record<string, unknown>;

export async function getCompanies(): Promise<Company[]> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) {
      log.error('Error fetching companies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    log.error('Error in getCompanies:', error);
    return [];
  }
}

export async function createCompany(company: NewCompany): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert(company as SupabaseInsert)
      .select()
      .single();

    if (error) {
      log.error('Error creating company:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in createCompany:', error);
    return null;
  }
}

export async function getCompanyById(id: string): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      log.error('Error fetching company:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in getCompanyById:', error);
    return null;
  }
}

