"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("medcred_token");
      const userData = localStorage.getItem("medcred_user");
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error("Auth restore failed", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    localStorage.setItem("medcred_token", userData.token);
    localStorage.setItem("medcred_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("medcred_token");
    localStorage.removeItem("medcred_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
