import { supabase } from '@/integrations/supabase/client';
import { type Profile, type ProfileFormData } from '@/lib/types';
import { log } from '@/lib/utils/logger';

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_public', true)
    .order('full_name', { ascending: true });

  if (error) {
    log.error('Error fetching profiles:', error);
    return [];
  }

  return data || [];
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    log.error('Error fetching profile:', error);
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
      company: formData.company || null,
      bio: formData.bio || null,
      github_url: formData.githubUrl || null,
      linkedin_url: formData.linkedinUrl || null,
      twitter_url: formData.twitterUrl || null,
      website_url: formData.websiteUrl || null,
      email_visible: formData.emailVisible,
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