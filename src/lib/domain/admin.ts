import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/utils/logger';
import { getProfiles, getUserActivity } from './profiles';

export interface CreateUserProfileData {
  email: string;
  password: string;
  fullName: string;
  graduationYear?: string;
  userType: 'Alum' | 'Admin' | 'Staff';
  msc: boolean;
}

export interface CreateUserResult {
  success: boolean;
  error?: string;
}

/**
 * Creates a new user account and profile
 * Handles the full flow: auth signup -> wait for profile trigger -> update profile fields
 */
export async function createUserWithProfile(
  profileData: CreateUserProfileData
): Promise<CreateUserResult> {
  try {
    // Create auth user
    const { error: signUpError } = await supabase.auth.signUp({
      email: profileData.email,
      password: profileData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: profileData.fullName,
        },
      },
    });

    if (signUpError) {
      log.error('Error creating auth user:', signUpError);
      return {
        success: false,
        error: signUpError.message,
      };
    }

    // Wait a moment for the profile to be created by the trigger
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get created user's profile and update it
    const { data: profileDataResult, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', profileData.email)
      .single();

    if (profileFetchError || !profileDataResult) {
      log.error('Profile fetch error:', profileFetchError);
      return {
        success: false,
        error: 'User created but profile not found. Please try again.',
      };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        user_type: profileData.userType,
        graduation_year: profileData.graduationYear
          ? parseInt(profileData.graduationYear)
          : null,
        msc: profileData.msc,
        is_public: true,
      })
      .eq('id', profileDataResult.id);

    if (profileError) {
      log.error('Profile update error:', profileError);
      return {
        success: false,
        error: `Profile update failed: ${profileError.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    log.error('Error in createUserWithProfile:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Soft deletes a user by marking their profile as removed
 */
export async function removeUser(profileId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ removed: true })
      .eq('id', profileId);

    if (error) {
      log.error('Error removing user:', error);
      return false;
    }

    return true;
  } catch (error) {
    log.error('Error in removeUser:', error);
    return false;
  }
}

/**
 * Refreshes user-related data after user management operations
 * Returns updated profiles and user activity
 */
export async function refreshUserData(): Promise<{
  profiles: Awaited<ReturnType<typeof getProfiles>>;
  userActivity: Awaited<ReturnType<typeof getUserActivity>>;
}> {
  try {
    const [profiles, userActivity] = await Promise.all([
      getProfiles(),
      getUserActivity(),
    ]);

    return {
      profiles,
      userActivity,
    };
  } catch (error) {
    log.error('Error refreshing user data:', error);
    return {
      profiles: [],
      userActivity: [],
    };
  }
}

