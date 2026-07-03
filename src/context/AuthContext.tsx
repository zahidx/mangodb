"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  isAdmin: boolean;
  demoUser: { name: string; phone: string; role: "user" | "admin" } | null;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demoUser, setDemoUser] = useState<AuthContextType["demoUser"]>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      // 1. Check local storage demo user
      const stored = localStorage.getItem("mangodb-user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setDemoUser(parsed);
          setProfile({
            id: "demo-id-123",
            full_name: parsed.name || "Demo User",
            phone: parsed.phone || "01754309016",
            email: parsed.email || "demo@mangodb.com",
            avatar_url: null,
            dob: parsed.dob || null,
            gender: parsed.gender || null,
            country: parsed.country || null,
            city: parsed.city || null,
            role: parsed.role || "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setUser(null);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem("mangodb-user");
        }
      }

      // 2. Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setDemoUser(null);
        
        // Fetch profile
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!error && data) {
            setProfile(data);
          } else {
            // Profile table might not exist yet, fallback to user metadata
            setProfile({
              id: session.user.id,
              full_name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "Premium Customer",
              email: session.user.email || "",
              phone: session.user.phone || null,
              avatar_url: session.user.user_metadata?.avatar_url || null,
              dob: null,
              gender: null,
              country: null,
              city: null,
              role: (session.user.user_metadata?.role as any) || "user",
              created_at: session.user.created_at,
              updated_at: session.user.created_at,
            });
          }
        } catch (dbErr) {
          // Fallback if profiles table is missing
          setProfile({
            id: session.user.id,
            full_name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "Premium Customer",
            email: session.user.email || "",
            phone: session.user.phone || null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            dob: null,
            gender: null,
            country: null,
            city: null,
            role: "user",
            created_at: session.user.created_at,
            updated_at: session.user.created_at,
          });
        }
      } else {
        setUser(null);
        setProfile(null);
        setDemoUser(null);
      }
    } catch (err) {
      console.error("Auth session check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          refreshSession();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setDemoUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("mangodb-user");
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setDemoUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const isDemo = !!demoUser;
  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemo,
        isAdmin,
        demoUser,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
