import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: ('Admin' | 'Auctioneer' | 'Volunteer')[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(authService.getUser());
  const [token, setToken] = useState<string | null>(authService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = authService.getToken();
      if (storedToken) {
        const verifiedUser = await authService.getMe();
        if (verifiedUser) {
          setUser(verifiedUser);
          setToken(storedToken);
        } else {
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }

    verifyAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const result = await authService.login(username, password);
    setUser(result.user);
    setToken(result.token);
  };

  const logout = () => {
    authService.clearSession();
    setUser(null);
    setToken(null);
  };

  const hasRole = (...roles: ('Admin' | 'Auctioneer' | 'Volunteer')[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
