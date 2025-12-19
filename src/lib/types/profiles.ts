import { Database } from '@/integrations/supabase/types';
import { UserRole } from './common';

export type ProfessionalStatus = 'employed' | 'entrepreneur' | 'open_to_work';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  email_visible: boolean | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  cohort: number | null;
  graduation_year: number | null;
  company: string | null;
  job_title: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  is_public: boolean | null;
  msc: boolean | null;
  is_remote: boolean | null;
  is_entrepreneur: boolean | null;
  is_ise_champion: boolean | null;
  professional_status: ProfessionalStatus | null;
  user_type: UserRole;
  removed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  fullName: string;
  city: string;
  country: string;
  graduationYear: string;
  msc: boolean;
  jobTitle: string;
  companyId: string | null;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  avatarUrl: string;
  emailVisible: boolean;
  isRemote: boolean;
  isEntrepreneur: boolean;
  isIseChampion: boolean;
  professionalStatus: ProfessionalStatus | null;
}



// Re-export Supabase types for compatibility
export type ProfileTable = Database['public']['Tables']['profiles']['Row'];