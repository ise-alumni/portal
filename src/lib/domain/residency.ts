import { api } from '@/lib/api';
import {
  type ResidencyPartner,
  type ResidencyStats,
  type NewResidencyPartner,
} from '@/lib/types';
import type { Residency, NewResidency } from '@/lib/types/residency';
import { type Profile } from '@/lib/types/profiles';
import { log } from '@/lib/utils/logger';

export type { Residency, NewResidency } from '@/lib/types/residency';
export type { ResidencyPhase } from '@/lib/types';

export async function getResidencyPartners(): Promise<ResidencyPartner[]> {
  try {
    return await api.get<ResidencyPartner[]>('/api/residency-partners');
  } catch (error) {
    log.error('Error fetching residency partners:', error);
    return [];
  }
}

export async function createResidencyPartner(partner: NewResidencyPartner): Promise<ResidencyPartner | null> {
  try {
    return await api.post<ResidencyPartner>('/api/residency-partners', partner);
  } catch (error) {
    log.error('Error creating residency partner:', error);
    return null;
  }
}

export async function updateResidencyPartner(id: string, partner: Partial<NewResidencyPartner>): Promise<ResidencyPartner | null> {
  try {
    return await api.put<ResidencyPartner>(`/api/residency-partners/${id}`, partner);
  } catch (error) {
    log.error('Error updating residency partner:', error);
    return null;
  }
}

export async function deleteResidencyPartner(id: string): Promise<boolean> {
  try {
    await api.delete(`/api/residency-partners/${id}`);
    return true;
  } catch (error) {
    log.error('Error deleting residency partner:', error);
    return false;
  }
}

export async function getResidencyStats(profiles: Profile[]): Promise<ResidencyStats> {
  try {
    const partners = await getResidencyPartners();

    const eligibleProfiles = profiles.filter(profile => ['Alum', 'Admin'].includes(profile.user_type));

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

    const totalProfiles = profiles.length;
    const atResidencyPartner = partnerMatches.filter(m => m.isAtPartner).length;
    const notAtResidencyPartner = eligibleProfiles.length - atResidencyPartner;

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

export async function getUserResidencies(userId: string): Promise<Residency[]> {
  try {
    return await api.get<Residency[]>(`/api/residencies/user/${userId}`);
  } catch (error) {
    log.error('Error fetching user residencies:', error);
    return [];
  }
}

export async function createResidency(residency: NewResidency): Promise<Residency | null> {
  try {
    return await api.post<Residency>('/api/residencies', residency);
  } catch (error) {
    log.error('Error creating residency:', error);
    return null;
  }
}

export async function updateResidency(id: string, residency: Partial<NewResidency>): Promise<Residency | null> {
  try {
    return await api.put<Residency>(`/api/residencies/${id}`, residency);
  } catch (error) {
    log.error('Error updating residency:', error);
    return null;
  }
}

export async function deleteResidency(id: string): Promise<boolean> {
  try {
    await api.delete(`/api/residencies/${id}`);
    return true;
  } catch (error) {
    log.error('Error deleting residency:', error);
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
