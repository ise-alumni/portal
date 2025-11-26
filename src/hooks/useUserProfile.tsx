import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getProfileByUserId, updateProfile } from '@/lib/domain/profiles';
import type { Profile, ProfileFormData } from '@/lib/types';
import { log } from '@/lib/utils/logger';

interface UseUserProfileOptions {
  autoFetch?: boolean;
}

interface UseUserProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfileData: (data: ProfileFormData) => Promise<boolean>;
  refetch: () => Promise<void>;
  clearProfile: () => void;
}

export function useUserProfile(
  userId?: string,
  options: UseUserProfileOptions = {}
): UseUserProfileReturn {
  const { autoFetch = true } = options;
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const profileData = await getProfileByUserId(targetUserId);
      setProfile(profileData);
      
      log.debug('Profile fetched successfully:', profileData?.full_name);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch profile');
      setError(error);
      log.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const updateProfileData = useCallback(async (data: ProfileFormData): Promise<boolean> => {
    if (!targetUserId || !profile) {
      log.error('Cannot update profile: missing user ID or profile data');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const updatedProfile = await updateProfile(targetUserId, data);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        log.info('Profile updated successfully:', updatedProfile.full_name);
        return true;
      }
      
      return false;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      log.error('Error updating profile:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [targetUserId, profile]);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setError(null);
    setLoading(false);
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && targetUserId) {
      fetchProfile();
    }
  }, [autoFetch, targetUserId, fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfileData,
    refetch: fetchProfile,
    clearProfile
  };
}