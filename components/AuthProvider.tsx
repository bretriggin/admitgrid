"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isBenignAuthError } from "@/lib/auth/errors";
import { fetchCurrentUserProfile } from "@/lib/auth/profileActions";
import { getUserDisplayName } from "@/lib/auth/profile";
import { isApprovedActiveProfile } from "@/types/userProfile";
import type { UserProfile } from "@/types/userProfile";

type AuthContextValue = {
  profile: UserProfile | null;
  displayName: string;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialProfile = null,
}: {
  children: ReactNode;
  initialProfile?: UserProfile | null;
}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(!initialProfile);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setProfile(null);
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (authError && !isBenignAuthError(authError)) {
          console.error("Error loading auth profile:", authError.message);
        }

        setProfile(null);
        return;
      }

      const nextProfile = await fetchCurrentUserProfile();

      if (!nextProfile || !isApprovedActiveProfile(nextProfile)) {
        setProfile(null);
        return;
      }

      setProfile(nextProfile);
    } catch (error) {
      console.error("Error loading auth profile:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!initialProfile) {
      void refreshProfile();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialProfile, refreshProfile, supabase]);

  const displayName = profile ? getUserDisplayName(profile) : "User";

  const value = useMemo(
    () => ({
      profile,
      displayName,
      isLoading,
      refreshProfile,
    }),
    [profile, displayName, isLoading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

export function useActorName(fallback = "User"): string {
  const { displayName, isLoading } = useAuth();
  return isLoading ? fallback : displayName;
}
