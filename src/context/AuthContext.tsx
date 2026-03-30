import React, { createContext, useContext, useState, useEffect } from "react";
import { type User } from "@/data/mockData";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, metadata: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check active sessions and sets the user
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          // OPTIMISTIC: Set user immediately from metadata and hide loading
          const initialUser = mapSupabaseUser(session.user);
          if (mounted) {
            setUser(initialUser);
            setIsLoading(false);
          }
          // Then fetch full profile in background
          fetchUserProfile(session.user);
        } else {
          if (mounted) setIsLoading(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) setIsLoading(false);
      }
    };

    checkSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // OPTIMISTIC: Set user immediately from metadata
        const initialUser = mapSupabaseUser(session.user);
        if (mounted) {
          setUser(initialUser);
          setIsLoading(false);
        }
        // Then fetch full profile in background
        fetchUserProfile(session.user);
      } else {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: any) => {
    if (!supabaseUser) return;
    
    try {
      // Fetch full profile from DB
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      if (!error && profile) {
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            name: profile.name || prev.name,
            role: profile.role || prev.role,
            phone: profile.phone || prev.phone,
            location: profile.location || prev.location,
            avatar: profile.avatar || prev.avatar,
          };
        });
      }
    } catch (err) {
      console.warn("Background profile fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const mapSupabaseUser = (supabaseUser: any): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.name || "User",
      role: supabaseUser.user_metadata?.role || "student",
      phone: supabaseUser.user_metadata?.phone || "",
      avatar: supabaseUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
      location: supabaseUser.user_metadata?.location || "",
      createdAt: supabaseUser.created_at,
    };
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        await fetchUserProfile(data.user);
        return { success: true };
      }
      return { success: false, error: "Login failed" };
    } catch (error: any) {
      console.error("Login error:", error.message);
      return { success: false, error: error.message };
    }
  };

  const signup = async (email: string, password: string, metadata: Partial<User>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata.name,
            role: metadata.role,
            phone: metadata.phone,
            location: metadata.location,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        await fetchUserProfile(data.user);
        return { success: true };
      }
      return { success: false, error: "Signup failed" };
    } catch (error: any) {
      console.error("Signup error:", error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
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
