import { createContext, useContext, ReactNode } from 'react';
import { authClient, useSession } from '@/lib/auth-client';

interface AuthContextType {
  user: { id: string; email: string; name: string } | null;
  session: { token: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data: sessionData, isPending } = useSession();

  const user = sessionData?.user
    ? {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
      }
    : null;

  const session = sessionData?.session
    ? { token: sessionData.session.token }
    : null;

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        return { error: error.message ?? 'Sign in failed' };
      }
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ error?: string }> => {
    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: fullName || email.split('@')[0],
      });
      if (error) {
        return { error: error.message ?? 'Sign up failed' };
      }
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign up failed' };
    }
  };

  const handleSignOut = async (): Promise<void> => {
    await authClient.signOut();
  };

  const resetPassword = async (_email: string): Promise<{ error?: string }> => {
    return { error: 'Password reset not yet configured' };
  };

  const value: AuthContextType = {
    user,
    session,
    loading: isPending,
    signIn,
    signUp,
    signOut: handleSignOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
