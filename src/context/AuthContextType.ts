import { createContext } from "react";
import { type User } from "@/data/mockData";

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, metadata: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  fetchUserProfile: () => Promise<void>;
  simulatedUserId: string | null;
  simulatedUserRole: 'USER' | 'ADMIN' | null;
  setSimulatedUser: (id: string | null, role: 'USER' | 'ADMIN' | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);