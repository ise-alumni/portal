import { supabase } from '@/integrations/supabase/client';
import { type ResidencyPartner, type ResidencyStats, type NewResidencyPartner, type Residency, type NewResidency, type ResidencyPhase } from '@/lib/types';
import { type Profile } from '@/lib/types/profiles';
import { log } from '@/lib/utils/logger';

// Type assertion helper to bypass Supabase typing issues
type SupabaseInsert = Record<string, unknown>;
type SupabaseUpdate = Record<string, unknown>;

export async function getResidencyPartners(): Promise<ResidencyPartner[]> {
  try {
    // Get companies that are residency partners
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .eq('is_residency_partner', true)
      .order('name');

    if (error) {
      log.error('Error fetching residency partners:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    log.error('Error in getResidencyPartners:', error);
    return [];
  }
}

export async function createResidencyPartner(partner: NewResidencyPartner): Promise<ResidencyPartner | null> {
  try {
    // Create company with is_residency_partner = true (default for residency partners)
    const companyData = {
      name: partner.name,
      website: partner.website ?? null,
      logo_url: partner.logo_url ?? null,
      description: partner.description ?? null,
      is_active: partner.is_active ?? true,
      is_residency_partner: true, // Always true when created from residency partner form
    } as SupabaseInsert;

    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) {
      log.error('Error creating residency partner:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in createResidencyPartner:', error);
    return null;
  }
}

export async function updateResidencyPartner(id: string, partner: Partial<NewResidencyPartner>): Promise<ResidencyPartner | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .update(partner as SupabaseUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      log.error('Error updating residency partner:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in updateResidencyPartner:', error);
    return null;
  }
}

export async function deleteResidencyPartner(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      log.error('Error deleting residency partner:', error);
      return false;
    }

    return true;
  } catch (error) {
    log.error('Error in deleteResidencyPartner:', error);
    return false;
  }
}

export async function getResidencyStats(profiles: Profile[]): Promise<ResidencyStats> {
  try {
    const partners = await getResidencyPartners();
    
    // Filter out staff members - include alumni and admin for partner calculations
    const eligibleProfiles = profiles.filter(profile => ['Alum', 'Admin'].includes(profile.user_type));
    
    // Match eligible profiles against residency partners by company
    const partnerMatches = eligibleProfiles.map(profile => {
      const company = profile.company?.toLowerCase().trim();
      if (!company) return { profile, isAtPartner: false, partnerName: null };
      
      const matchingPartner = partners.find(partner => 
        company.includes(partner.name.toLowerCase()) || 
        partner.name.toLowerCase().includes(company)
      );
      
      return {
        profile,
        isAtPartner: !!matchingPartner,
        partnerName: matchingPartner?.name || null
      };
    });

    // Use total profiles count (including staff) for totalProfiles
    const totalProfiles = profiles.length;
    // Use only eligible profiles (alumni + admin) counts for partner calculations
    const atResidencyPartner = partnerMatches.filter(m => m.isAtPartner).length;
    const notAtResidencyPartner = eligibleProfiles.length - atResidencyPartner;

    // Group by partner for stats
    const partnerStats = partners.map(partner => {
      const partnerProfiles = partnerMatches.filter(m => m.partnerName === partner.name);
      const count = partnerProfiles.length;
      const bscCount = partnerProfiles.filter(m => !m.profile.msc).length;
      const mscCount = partnerProfiles.filter(m => m.profile.msc).length;
      const percentage = eligibleProfiles.length > 0 ? Math.round((count / eligibleProfiles.length) * 100) : 0;
      
      return {
        name: partner.name,
        count,
        bscCount,
        mscCount,
        percentage
      };
    }).filter(stat => stat.count > 0).sort((a, b) => b.count - a.count);

    return {
      totalProfiles,
      atResidencyPartner,
      notAtResidencyPartner,
      residencyPercentage: eligibleProfiles.length > 0 ? Math.round((atResidencyPartner / eligibleProfiles.length) * 100) : 0,
      partners: partnerStats
    };
  } catch (error) {
    log.error('Error in getResidencyStats:', error);
    return {
      totalProfiles: 0,
      atResidencyPartner: 0,
      notAtResidencyPartner: 0,
      residencyPercentage: 0,
      partners: []
    };
  }
}

// Residency CRUD functions
export async function getUserResidencies(userId: string): Promise<Residency[]> {
  try {
    const { data, error } = await supabase
      .from('residencies')
      .select(`
        *,
        companies (
          id,
          name,
          website,
          logo_url,
          description
        )
      `)
      .eq('user_id', userId)
      .order('phase');

    if (error) {
      log.error('Error fetching user residencies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    log.error('Error in getUserResidencies:', error);
    return [];
  }
}

export async function createResidency(residency: NewResidency): Promise<Residency | null> {
  try {
    const { data, error } = await supabase
      .from('residencies')
      .insert(residency as unknown as SupabaseInsert)
      .select()
      .single();

    if (error) {
      log.error('Error creating residency:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in createResidency:', error);
    return null;
  }
}

export async function updateResidency(id: string, residency: Partial<NewResidency>): Promise<Residency | null> {
  try {
    const { data, error } = await supabase
      .from('residencies')
      .update(residency as SupabaseUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      log.error('Error updating residency:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in updateResidency:', error);
    return null;
  }
}

export async function deleteResidency(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('residencies')
      .delete()
      .eq('id', id);

    if (error) {
      log.error('Error deleting residency:', error);
      return false;
    }

    return true;
  } catch (error) {
    log.error('Error in deleteResidency:', error);
    return false;
  }
}

export function getAvailablePhases(isMsc: boolean): ResidencyPhase[] {
  const phases: ResidencyPhase[] = ['R1', 'R2', 'R3', 'R4'];
  if (isMsc) {
    phases.push('R5');
  }
  return phases;
}