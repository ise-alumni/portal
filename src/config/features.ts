/**
 * Feature flags configuration
 * Control which features are enabled or disabled in the application
 */

export const FEATURE_FLAGS = {
  // Authentication features
  SIGNUP_ENABLED: false, // Set to false to disable signup functionality

  // Add more feature flags here as needed
  // PROFILE_EDITING: true,
  // MESSAGING: true,
  // etc.
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
};
