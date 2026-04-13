import React, { useState, useEffect } from "react";
import { type User } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { AuthError, User as SupabaseUser } from "@supabase/supabase-js";
import { AuthContext, type AuthContextType } from "./AuthContextType";
import { logUserActivity } from "@/services/activity";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simulatedUserId, setSimulatedUserId] = useState<string | null>(null);
  const [simulatedUserRole, setSimulatedUserRole] = useState<'USER' | 'ADMIN' | null>(null);

  const setSimulatedUser = (id: string | null, role: 'USER' | 'ADMIN' | null) => {
    setSimulatedUserId(id);
    setSimulatedUserRole(role);
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (mounted) setIsLoading(false);
          return;
        }

        const currentUser = session?.user;
        if (currentUser) {
          const initialUser = mapSupabaseUser(currentUser);
          if (mounted) {
            setUser(initialUser);
          }
          fetchUserProfile(currentUser);
        } else {
          if (mounted) setIsLoading(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) setIsLoading(false);
      }
    };

    checkSession();

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const initialUser = mapSupabaseUser(session.user);
        if (mounted) {
          setUser(initialUser);
          setIsLoading(false);
        }
        fetchUserProfile(session.user);
      } else {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    });

    // 3. Profile changes listener (REALTIME)
    let profileChannel: any = null;
    
    const setupProfileListener = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      if (currentUser && mounted) {
        profileChannel = supabase
          .channel(`profile-updates-${currentUser.id}`)
          .on(
            'postgres_changes',
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'profiles', 
              filter: `id=eq.${currentUser.id}` 
            },
            (payload) => {
              const profile = payload.new as any;
              if (mounted) {
                setUser(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    name: profile.name || prev.name,
                    role: profile.role || prev.role,
                    phone: profile.phone || prev.phone,
                    location: profile.location || prev.location,
                    avatar: profile.avatar_url || profile.avatar || prev.avatar,
                    about: profile.about || prev.about,
                  };
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // Double check if still mounted
              if (!mounted && profileChannel) {
                supabase.removeChannel(profileChannel);
              }
            }
          });
      }
    };

    setupProfileListener();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, []);

  const fetchUserProfile = async (supabaseUser?: SupabaseUser) => {
    // If no user provided, get current user from Supabase
    let targetUser = supabaseUser;
    if (!targetUser) {
      const { data: { session } } = await supabase.auth.getSession();
      targetUser = session?.user || undefined;
    }
    
    if (!targetUser) return;
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUser.id)
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
            avatar: profile.avatar_url || profile.avatar || prev.avatar,
            about: profile.about || prev.about,
          };
        });
      } else if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it from metadata
        const metadata = targetUser.user_metadata;
        const newProfile = {
          id: targetUser.id,
          email: targetUser.email,
          name: metadata?.name || "User",
          role: metadata?.role || "user",
          phone: metadata?.phone || "",
          avatar_url: metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}`,
          location: metadata?.location || "",
          about: metadata?.about || "",
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        if (!createError && createdProfile) {
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              name: createdProfile.name,
              role: createdProfile.role,
              phone: createdProfile.phone,
              location: createdProfile.location,
              avatar: createdProfile.avatar_url,
              about: createdProfile.about,
            };
          });
        }
      }
    } catch (err) {
      console.warn("Background profile fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.name || "User",
      role: supabaseUser.user_metadata?.role || "user",
      phone: supabaseUser.user_metadata?.phone || "",
      avatar: supabaseUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
      location: supabaseUser.user_metadata?.location || "",
      about: supabaseUser.user_metadata?.about || "",
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
        // Log activity
        await logUserActivity(data.user.id, 'Masuk ke akun (Login)');
        // Set simulated user for backend calls
        setSimulatedUser(data.user.id, (data.user.user_metadata?.role || 'USER') as 'USER' | 'ADMIN');
        // The onAuthStateChange listener will handle setting the user state.
        return { success: true };
      }
      return { success: false, error: "Login failed" };
    } catch (error) {
      console.error("Login error:", (error as AuthError).message);
      return { success: false, error: (error as AuthError).message };
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
        // Log activity
        await logUserActivity(data.user.id, 'Mendaftar akun baru');
        // Set simulated user for backend calls
        setSimulatedUser(data.user.id, (metadata.role || 'USER') as 'USER' | 'ADMIN');
        // Immediately try to log in after successful signup
        const loginResponse = await login(email, password);
        return loginResponse;
      }
      return { success: false, error: "Signup failed" };
    } catch (error) {
      console.error("Signup error:", (error as AuthError).message);
      return { success: false, error: (error as AuthError).message };
    }
  };

  const logout = async () => {
    if (user) {
      await logUserActivity(user.id, 'Keluar dari akun (Logout)');
    }
    await supabase.auth.signOut();
    setUser(null);
    setSimulatedUser(null, null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, fetchUserProfile, simulatedUserId, simulatedUserRole, setSimulatedUser }}>
      {children}
    </AuthContext.Provider>
  );
}