import { supabase } from '@/integrations/supabase/client';
import { type Profile, type ProfileFormData } from '@/lib/types';
import { log } from '@/lib/utils/logger';

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('removed', false)
    .order('full_name', { ascending: true });

  if (error) {
    log.error('Error fetching profiles:', error);
    return [];
  }

  return data || [];
}

export async function getAlumniProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_public', true)
    .eq('removed', false)
    .in('user_type', ['Alum', 'Admin']) // Include alumni and admin, exclude Staff
    .order('full_name', { ascending: true });

  if (error) {
    log.error('Error fetching alumni profiles:', error);
    return [];
  }

  return data || [];
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('removed', false)
    .single();

  if (error) {
    log.error('Error fetching profile by user ID:', error);
    return null;
  }

  return data;
}

export async function updateProfile(userId: string, formData: ProfileFormData): Promise<Profile | null> {
  try {
    const updatePayload = {
      user_id: userId,
      full_name: formData.fullName || null,
      city: formData.city || null,
      country: formData.country || null,
      graduation_year: formData.graduationYear ? parseInt(formData.graduationYear) : null,
      msc: formData.msc,
      job_title: formData.jobTitle || null,
      company: formData.company || null, // To Do: Remove this field
      company_id: formData.companyId || null,
      bio: formData.bio || null,
      github_url: formData.githubUrl || null,
      linkedin_url: formData.linkedinUrl || null,
      twitter_url: formData.twitterUrl || null,
      website_url: formData.websiteUrl || null,
      email_visible: formData.emailVisible,
      is_remote: formData.isRemote,
      is_entrepreneur: formData.isEntrepreneur,
      is_ise_champion: formData.isIseChampion,
      employed: formData.employed,
      professional_status: formData.professionalStatus,
      avatar_url: formData.avatarUrl || undefined,
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      log.error('Error updating profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in updateProfile:', error);
    return null;
  }
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_public', true)
    .eq('removed', false)
    .or(`full_name.ilike.%${query}%,bio.ilike.%${query}%,company.ilike.%${query}%`)
    .order('full_name', { ascending: true });

  if (error) {
    log.error('Error searching profiles:', error);
    return [];
  }

  return data || [];
}

export function isProfileComplete(profile: Profile): boolean {
  return !!(
    profile.full_name &&
    profile.bio &&
    profile.company &&
    profile.job_title
  );
}

export interface UserActivity {
  id: string;
  userId: string;
  email: string;
  lastSignInAt: string | null;
  createdAt: string;
  profile: Profile | null;
}

export async function getUserActivity(): Promise<UserActivity[]> {
  try {
    // Get all profiles - use profile data as primary source
    const profiles = await getProfiles();
    
    // Create user activity from profile data
    const userActivity: UserActivity[] = profiles.map(profile => ({
      id: profile.id,
      userId: profile.user_id,
      email: profile.email || '',
      lastSignInAt: profile.updated_at, // Use updated_at as proxy for last activity
      createdAt: profile.created_at,
      profile: profile
    }));

    return userActivity.sort((a, b) => {
      const aDate = a.lastSignInAt || a.createdAt;
      const bDate = b.lastSignInAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  } catch (error) {
    log.error('Error fetching user activity:', error);
    return [];
  }
}

export function getRecentSignIns(users: UserActivity[], days: number = 7): UserActivity[] {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return users.filter(user => {
    const signInDate = user.lastSignInAt ? new Date(user.lastSignInAt) : null;
    return signInDate && signInDate >= cutoffDate;
  });
}

export function getInactiveUsers(users: UserActivity[], days: number = 30): UserActivity[] {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return users.filter(user => {
    const signInDate = user.lastSignInAt ? new Date(user.lastSignInAt) : new Date(user.createdAt);
    return signInDate < cutoffDate;
  });
}

export interface ProfileHistory {
  id: string;
  profile_id: string;
  job_title: string | null;
  company: string | null;
  city: string | null;
  country: string | null;
  professional_status: 'employed' | 'entrepreneur' | 'open_to_work' | null;
  is_remote: boolean | null;
  is_ise_champion: boolean | null;
  changed_at: string;
  change_type: 'INSERT' | 'UPDATE';
}

export async function getProfileHistory(profileId?: string): Promise<ProfileHistory[]> {
  try {
    let query = supabase
      .from('profiles_history')
      .select('*')
      .order('changed_at', { ascending: true });

    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    const { data, error } = await query;

    if (error) {
      log.error('Error fetching profile history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    log.error('Error in getProfileHistory:', error);
    return [];
  }
}

export async function getProfileHistoryStats(): Promise<{
  totalChanges: number;
  changesByMonth: { month: string; count: number }[];
  changesByType: { type: string; count: number }[];
  topChangedFields: { field: string; count: number }[];
}> {
  try {
    const history = await getProfileHistory();
    const profiles = await getProfiles();
    
    // Include all profiles for comprehensive stats
    const eligibleProfiles = profiles;
    const eligibleProfileIds = new Set(eligibleProfiles.map(p => p.id));
    
    // Filter history to only include changes from eligible profiles
    const filteredHistory = history.filter(change => eligibleProfileIds.has(change.profile_id));
    
    // Group by month
    const changesByMonth = filteredHistory.reduce((acc, change) => {
      const month = new Date(change.changed_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ month, count: 1 });
      }
      return acc;
    }, [] as { month: string; count: number }[]);

    // Group by type
    const changesByType = filteredHistory.reduce((acc, change) => {
      const existing = acc.find(item => item.type === change.change_type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: change.change_type, count: 1 });
      }
      return acc;
    }, [] as { type: string; count: number }[]);

    // Count field changes (simplified - in real implementation you'd track specific fields)
    const topChangedFields = [
      { field: 'job_title', count: filteredHistory.filter(h => h.job_title !== null).length },
      { field: 'company', count: filteredHistory.filter(h => h.company !== null).length },
      { field: 'city', count: filteredHistory.filter(h => h.city !== null).length },
      { field: 'country', count: filteredHistory.filter(h => h.country !== null).length },
      { field: 'professional_status', count: filteredHistory.filter(h => h.professional_status !== null).length },
      { field: 'is_remote', count: filteredHistory.filter(h => h.is_remote !== null).length },
      { field: 'is_ise_champion', count: filteredHistory.filter(h => h.is_ise_champion !== null).length },
    ].sort((a, b) => b.count - a.count);

    return {
      totalChanges: filteredHistory.length,
      changesByMonth: changesByMonth.slice(-12), // Last 12 months
      changesByType,
      topChangedFields
    };
  } catch (error) {
    log.error('Error in getProfileHistoryStats:', error);
    return {
      totalChanges: 0,
      changesByMonth: [],
      changesByType: [],
      topChangedFields: []
    };
  }
}

export interface SignInData {
  date: string;
  count: number;
}

export async function getSignInsOverTime(days: number = 30): Promise<SignInData[]> {
  try {
    const profiles = await getProfiles();
    
    // Group sign-ins by date (using updated_at as proxy for last activity)
    const signInsByDate = profiles.reduce((acc, profile) => {
      const date = new Date(profile.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [] as SignInData[]);

    // Sort by date and limit to requested days
    return signInsByDate
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-days);
  } catch (error) {
    log.error('Error in getSignInsOverTime:', error);
    return [];
  }
}

export interface FieldChange {
  id: string;
  userName: string;
  userEmail: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changeType: 'INSERT' | 'UPDATE';
}

export async function getFieldChanges(limit: number = 50): Promise<FieldChange[]> {
  try {
    const history = await getProfileHistory();
    const profiles = await getProfiles();
    
    // Filter out staff members - only include alumni and admin
    const eligibleProfiles = profiles.filter(profile => ['Alum', 'Admin'].includes(profile.user_type));
    
    // Map history to field changes with user details
    const fieldChanges: FieldChange[] = [];
    
    for (const change of history) {
      const profile = eligibleProfiles.find(p => p.id === change.profile_id);
      if (!profile) continue;
      
      // Add changes for each field that has a value
      if (change.job_title) {
        fieldChanges.push({
          id: `${change.id}_job_title`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Job Title',
          oldValue: null, // We don't track old values in current schema
          newValue: change.job_title,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.company) {
        fieldChanges.push({
          id: `${change.id}_company`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Company',
          oldValue: null,
          newValue: change.company,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.city) {
        fieldChanges.push({
          id: `${change.id}_city`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'City',
          oldValue: null,
          newValue: change.city,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.country) {
        fieldChanges.push({
          id: `${change.id}_country`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Country',
          oldValue: null,
          newValue: change.country,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.professional_status) {
        fieldChanges.push({
          id: `${change.id}_professional_status`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Professional Status',
          oldValue: null,
          newValue: change.professional_status,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.is_remote !== null) {
        fieldChanges.push({
          id: `${change.id}_is_remote`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Remote Work',
          oldValue: null,
          newValue: change.is_remote ? 'Yes' : 'No',
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.is_ise_champion !== null) {
        fieldChanges.push({
          id: `${change.id}_is_ise_champion`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'ISE Champion',
          oldValue: null,
          newValue: change.is_ise_champion ? 'Yes' : 'No',
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
    }
    
    // Sort by most recent and limit
    return fieldChanges
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
      .slice(0, limit);
  } catch (error) {
    log.error('Error in getFieldChanges:', error);
    return [];
  }
}

export async function getAllFieldChanges(): Promise<FieldChange[]> {
  try {
    const history = await getProfileHistory();
    const profiles = await getProfiles();
    
    // Include all profiles (including staff) for dashboard display
    const eligibleProfiles = profiles;
    
    // Map history to field changes with user details
    const fieldChanges: FieldChange[] = [];
    
    for (const change of history) {
      const profile = eligibleProfiles.find(p => p.id === change.profile_id);
      if (!profile) continue;
      
      // Add changes for each field that has a value
      if (change.job_title) {
        fieldChanges.push({
          id: `${change.id}_job_title`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Job Title',
          oldValue: null,
          newValue: change.job_title,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.company) {
        fieldChanges.push({
          id: `${change.id}_company`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Company',
          oldValue: null,
          newValue: change.company,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.city) {
        fieldChanges.push({
          id: `${change.id}_city`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'City',
          oldValue: null,
          newValue: change.city,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.country) {
        fieldChanges.push({
          id: `${change.id}_country`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Country',
          oldValue: null,
          newValue: change.country,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.professional_status) {
        fieldChanges.push({
          id: `${change.id}_professional_status`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Professional Status',
          oldValue: null,
          newValue: change.professional_status,
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.is_remote !== null) {
        fieldChanges.push({
          id: `${change.id}_is_remote`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'Remote Work',
          oldValue: null,
          newValue: change.is_remote ? 'Yes' : 'No',
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
      
      if (change.is_ise_champion !== null) {
        fieldChanges.push({
          id: `${change.id}_is_ise_champion`,
          userName: profile.full_name || 'Unknown',
          userEmail: profile.email || 'Unknown',
          fieldName: 'ISE Champion',
          oldValue: null,
          newValue: change.is_ise_champion ? 'Yes' : 'No',
          changedAt: change.changed_at,
          changeType: change.change_type
        });
      }
    }
    
    // Sort by most recent (no limit)
    return fieldChanges
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  } catch (error) {
    log.error('Error in getAllFieldChanges:', error);
    return [];
  }
}

export async function getRecentFieldChanges(days: number = 7, limit: number = 10): Promise<FieldChange[]> {
  try {
    const allChanges = await getAllFieldChanges();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return allChanges
      .filter(change => new Date(change.changedAt) >= cutoffDate)
      .slice(0, limit);
  } catch (error) {
    log.error('Error in getRecentFieldChanges:', error);
    return [];
  }
}