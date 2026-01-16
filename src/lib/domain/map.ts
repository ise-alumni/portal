import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/utils/logger';

export type CurrentMapDataRow = {
  profile_id: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  lat: number;
  lng: number;
  graduation_year: number | null;
  cohort: string | null;
  msc: string | null;
  city: string | null;
  country: string | null;
};

export type OvertimeMapDataRow = {
  profile_id: string;
  full_name: string | null;
  timestamps: string[] | null;
  cities: (string | null)[] | null;
  countries: (string | null)[] | null;
  companies: (string | null)[] | null;
  job_titles: (string | null)[] | null;
  lats: number[] | null;
  lngs: number[] | null;
};

export async function getMapDataCurrent(): Promise<CurrentMapDataRow[]> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_map_data', {
      view_mode: 'current',
    });

    if (error) {
      log.error('Error fetching current map data:', error);
      throw error;
    }

    return (data as CurrentMapDataRow[]) || [];
  } catch (error) {
    log.error('Error in getMapDataCurrent:', error);
    return [];
  }
}

export async function getMapDataOvertime(): Promise<OvertimeMapDataRow[]> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_map_data', {
      view_mode: 'overtime',
    });

    if (error) {
      log.error('Error fetching overtime map data:', error);
      throw error;
    }

    return (data as OvertimeMapDataRow[]) || [];
  } catch (error) {
    log.error('Error in getMapDataOvertime:', error);
    return [];
  }
}

