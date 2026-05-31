import React, { createContext, useContext, useState, ReactNode } from "react";
import { User } from "../types";
import { MOCK_USERS } from "../data";

interface AuthContextType {
  currentUser: User | null;
  loginAs: (uid: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Start logged out
  const [isLoading, setIsLoading] = useState(false);

  const loginAs = (uid: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.uid === uid) || null;
      setCurrentUser(user);
      setIsLoading(false);
    }, 400); // Simulate network
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loginAs, logout, isLoading }}>
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
