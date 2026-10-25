import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { errorMessage } from '../api/axios';
import { User, ActionResult } from '../types';

export interface SetupInput {
  companyName: string;
  adminName: string;
  email: string;
  password: string;
  officeStart?: string;
  graceMinutes?: number;
  halfDayHours?: number;
  weekend?: number[];
  office?: {
    address?: string;
    lat?: number | null;
    lng?: number | null;
    radiusMeters?: number;
  };
}

interface AuthContextType {
  user: User | null;
  companyName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** null while still checking with the server */
  setupComplete: boolean | null;
  login: (email: string, password: string) => Promise<ActionResult>;
  setup: (input: SetupInput) => Promise<ActionResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<ActionResult>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshProfile = useCallback(async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.user);
    setCompanyName(res.data.companyName);
  }, []);

  // Restore session + learn whether first-run setup is still needed
  useEffect(() => {
    (async () => {
      try {
        const status = await api.get('/auth/setup-status');
        setSetupComplete(status.data.setupComplete);
      } catch {
        setSetupComplete(true); // backend unreachable: fall back to the login screen, which shows the error
      }
      if (localStorage.getItem('token')) {
        try {
          await refreshProfile();
        } catch {
          clearSession();
        }
      }
      setIsLoading(false);
    })();
  }, [refreshProfile]);

  const startSession = async (token: string) => {
    localStorage.setItem('token', token);
    await refreshProfile();
  };

  const login = async (email: string, password: string): Promise<ActionResult> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      await startSession(res.data.token);
      return { success: true };
    } catch (error) {
      return { success: false, message: errorMessage(error, 'Invalid email or password') };
    }
  };

  const setup = async (input: SetupInput): Promise<ActionResult> => {
    try {
      const res = await api.post('/auth/setup', input);
      setSetupComplete(true);
      return { success: true, message: res.data?.message };
    } catch (error) {
      return { success: false, message: errorMessage(error) };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<ActionResult> => {
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      await startSession(res.data.token);
      return { success: true };
    } catch (error) {
      return { success: false, message: errorMessage(error) };
    }
  };

  const logout = () => clearSession();

  return (
    <AuthContext.Provider
      value={{
        user,
        companyName,
        isAuthenticated: !!user,
        isLoading,
        setupComplete,
        login,
        setup,
        changePassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
