import { Database } from '@/integrations/supabase/types';

export type ResidencyPhase = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

export interface Residency {
  id: string;
  phase: ResidencyPhase;
  company_id: string;
  user_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewResidency {
  phase: ResidencyPhase;
  company_id: string;
  user_id: string;
  description: string | null;
}

export interface ResidencyPartner {
  id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewResidencyPartner {
  name: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
}

export interface ResidencyStats {
  totalProfiles: number;
  atResidencyPartner: number;
  notAtResidencyPartner: number;
  residencyPercentage: number;
  partners: {
    name: string;
    count: number;
    bscCount: number;
    mscCount: number;
    percentage: number;
  }[];
}

// Re-export Supabase types for compatibility
export type ResidencyPartnerTable = Database['public']['Tables']['residency_partners']['Row'];
export type ResidencyTable = Database['public']['Tables']['residencies']['Row'];