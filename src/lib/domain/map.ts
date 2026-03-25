import { api } from '@/lib/api';
import { log } from '@/lib/utils/logger';

export type CurrentMapDataRow = {
  profile_id: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  lat: number;
  lng: number;
  graduation_year: number | null;
  cohort: number | null;
  msc: boolean | null;
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
    return await api.get<CurrentMapDataRow[]>('/api/map/current');
  } catch (error) {
    log.error('Error fetching current map data:', error);
    return [];
  }
}

export async function getMapDataOvertime(): Promise<OvertimeMapDataRow[]> {
  try {
    return await api.get<OvertimeMapDataRow[]>('/api/map/overtime');
  } catch (error) {
    log.error('Error fetching overtime map data:', error);
    return [];
  }
}
