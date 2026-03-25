import { api } from '@/lib/api';
import { type Profile, type ProfileFormData } from '@/lib/types';
import { log } from '@/lib/utils/logger';

function boolToYesNo(value: boolean | null): string | null {
  if (value === null) return null;
  return value ? 'Yes' : 'No';
}

export async function uploadAvatar(_userId: string, _file: File): Promise<string | null> {
  log.warn('Avatar upload not yet implemented with local storage');
  return null;
}

export async function getProfiles(): Promise<Profile[]> {
  try {
    return await api.get<Profile[]>('/api/profiles');
  } catch (error) {
    log.error('Error fetching profiles:', error);
    return [];
  }
}

export async function getAlumniProfiles(): Promise<Profile[]> {
  try {
    return await api.get<Profile[]>('/api/profiles/alumni');
  } catch (error) {
    log.error('Error fetching alumni profiles:', error);
    return [];
  }
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  try {
    return await api.get<Profile>(`/api/profiles/user/${userId}`);
  } catch (error) {
    log.error('Error fetching profile by user ID:', error);
    return null;
  }
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  try {
    return await api.get<Profile>(`/api/profiles/${profileId}`);
  } catch (error) {
    log.error('Error fetching profile by ID:', error);
    return null;
  }
}

export async function getUserProfileType(userId: string): Promise<string | null> {
  try {
    const data = await api.get<{ user_type: string }>(`/api/profiles/type/${userId}`);
    return data?.user_type || null;
  } catch (error) {
    log.error('Error fetching user profile type:', error);
    return null;
  }
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
      company: formData.company || null,
      bio: formData.bio || null,
      github_url: formData.githubUrl || null,
      linkedin_url: formData.linkedinUrl || null,
      twitter_url: formData.twitterUrl || null,
      website_url: formData.websiteUrl || null,
      is_remote: formData.isRemote,
      is_entrepreneur: formData.isEntrepreneur,
      is_ise_champion: formData.isIseChampion,
      professional_status: formData.professionalStatus,
      avatar_url: formData.avatarUrl || undefined,
    };

    return await api.put<Profile>(`/api/profiles/${userId}`, updatePayload);
  } catch (error) {
    log.error('Error updating profile:', error);
    return null;
  }
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  if (!query.trim()) return [];

  try {
    return await api.get<Profile[]>(`/api/profiles/search?q=${encodeURIComponent(query)}`);
  } catch (error) {
    log.error('Error searching profiles:', error);
    return [];
  }
}

export function isProfileComplete(profile: Profile): boolean {
  return !!(
    profile.full_name &&
    profile.bio &&
    profile.company &&
    profile.job_title
  );
}

export function calculateProfileCompletionPercentage(profile: Profile | null): number {
  if (!profile) return 0;

  const requiredFields = [
    profile.full_name,
    profile.bio,
    profile.company,
    profile.job_title
  ];

  const completedFields = requiredFields.filter(field => field && field.trim() !== '').length;
  return Math.round((completedFields / requiredFields.length) * 100);
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
    const data = await getProfiles();

    const userActivity: UserActivity[] = data.map(profile => ({
      id: profile.id,
      userId: profile.user_id,
      email: profile.email || '',
      lastSignInAt: profile.updated_at,
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
    const path = profileId
      ? `/api/profiles/history/${profileId}`
      : '/api/profiles/history';
    return await api.get<ProfileHistory[]>(path);
  } catch (error) {
    log.error('Error fetching profile history:', error);
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
    const profilesList = await getProfiles();

    const eligibleProfileIds = new Set(profilesList.map(p => p.id));
    const filteredHistory = history.filter(change => eligibleProfileIds.has(change.profile_id));

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

    const changesByType = filteredHistory.reduce((acc, change) => {
      const existing = acc.find(item => item.type === change.change_type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: change.change_type, count: 1 });
      }
      return acc;
    }, [] as { type: string; count: number }[]);

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
      changesByMonth: changesByMonth.slice(-12),
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
    const profilesList = await getProfiles();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const map = profilesList.reduce(
      (acc, profile) => {
        const updatedAt = profile.updated_at ? new Date(profile.updated_at) : null;
        if (!updatedAt || updatedAt < cutoffDate) return acc;

        const label = updatedAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        const existing = acc.get(label);
        if (existing) {
          existing.count += 1;
          existing.latest = Math.max(existing.latest, updatedAt.getTime());
        } else {
          acc.set(label, { label, count: 1, latest: updatedAt.getTime() });
        }

        return acc;
      },
      new Map<string, { label: string; count: number; latest: number }>()
    );

    return Array.from(map.values())
      .sort((a, b) => a.latest - b.latest)
      .map((item) => ({ date: item.label, count: item.count }));
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
    const allProfiles = await getProfiles();

    const eligibleProfiles = allProfiles.filter(profile => ['Alum', 'Admin'].includes(profile.user_type));
    const fieldChanges: FieldChange[] = [];

    for (const change of history) {
      const profile = eligibleProfiles.find(p => p.id === change.profile_id);
      if (!profile) continue;

      const fields: Array<[string, string | null]> = [
        ['Job Title', change.job_title],
        ['Company', change.company],
        ['City', change.city],
        ['Country', change.country],
        ['Professional Status', change.professional_status],
        ['Remote Work', boolToYesNo(change.is_remote)],
        ['ISE Champion', boolToYesNo(change.is_ise_champion)],
      ];

      for (const [fieldName, value] of fields) {
        if (value) {
          fieldChanges.push({
            id: `${change.id}_${fieldName.toLowerCase().replace(' ', '_')}`,
            userName: profile.full_name || 'Unknown',
            userEmail: profile.email || 'Unknown',
            fieldName,
            oldValue: null,
            newValue: value,
            changedAt: change.changed_at,
            changeType: change.change_type
          });
        }
      }
    }

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
    const allProfiles = await getProfiles();

    const fieldChanges: FieldChange[] = [];

    for (const change of history) {
      const profile = allProfiles.find(p => p.id === change.profile_id);
      if (!profile) continue;

      const fields: Array<[string, string | null]> = [
        ['Job Title', change.job_title],
        ['Company', change.company],
        ['City', change.city],
        ['Country', change.country],
        ['Professional Status', change.professional_status],
        ['Remote Work', boolToYesNo(change.is_remote)],
        ['ISE Champion', boolToYesNo(change.is_ise_champion)],
      ];

      for (const [fieldName, value] of fields) {
        if (value) {
          fieldChanges.push({
            id: `${change.id}_${fieldName.toLowerCase().replace(' ', '_')}`,
            userName: profile.full_name || 'Unknown',
            userEmail: profile.email || 'Unknown',
            fieldName,
            oldValue: null,
            newValue: value,
            changedAt: change.changed_at,
            changeType: change.change_type
          });
        }
      }
    }

    return fieldChanges.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
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
