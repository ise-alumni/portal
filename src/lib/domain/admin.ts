import { api } from '@/lib/api';
import { log } from '@/lib/utils/logger';
import { signUp } from '@/lib/auth-client';
import { getProfiles, getUserActivity } from './profiles';

export interface CreateUserProfileData {
  email: string;
  fullName: string;
  graduationYear?: string;
  userType: 'Alum' | 'Admin' | 'Staff';
  msc: boolean;
}

export interface CreateUserResult {
  success: boolean;
  error?: string;
}

export async function createUserWithProfile(
  profileData: CreateUserProfileData
): Promise<CreateUserResult> {
  try {
    const { error: signUpError } = await signUp.email({
      email: profileData.email,
      password: crypto.randomUUID(),
      name: profileData.fullName,
    });

    if (signUpError) {
      log.error('Error creating auth user:', signUpError);
      return {
        success: false,
        error: signUpError.message,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const profiles = await getProfiles();
    const createdProfile = profiles.find(p => p.email === profileData.email);

    if (!createdProfile) {
      return {
        success: false,
        error: 'User created but profile not found. Please try again.',
      };
    }

    try {
      await api.put(`/api/profiles/${createdProfile.user_id}`, {
        user_type: profileData.userType,
        graduation_year: profileData.graduationYear
          ? parseInt(profileData.graduationYear)
          : null,
        msc: profileData.msc,
        is_public: true,
      });
    } catch (profileError) {
      log.error('Profile update error:', profileError);
      return {
        success: false,
        error: `Profile update failed: ${profileError instanceof Error ? profileError.message : 'Unknown error'}`,
      };
    }

    return { success: true };
  } catch (error) {
    log.error('Error in createUserWithProfile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function removeUser(profileId: string): Promise<boolean> {
  try {
    await api.put(`/api/profiles/remove/${profileId}`, {});
    return true;
  } catch (error) {
    log.error('Error removing user:', error);
    return false;
  }
}

export async function refreshUserData(): Promise<{
  profiles: Awaited<ReturnType<typeof getProfiles>>;
  userActivity: Awaited<ReturnType<typeof getUserActivity>>;
}> {
  try {
    const [profiles, userActivity] = await Promise.all([
      getProfiles(),
      getUserActivity(),
    ]);

    return { profiles, userActivity };
  } catch (error) {
    log.error('Error refreshing user data:', error);
    return { profiles: [], userActivity: [] };
  }
}
