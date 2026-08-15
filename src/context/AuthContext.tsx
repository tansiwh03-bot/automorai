import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: User = { id: Math.random().toString(36).substr(2, 9), email };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        resolve();
      }, 1000);
    });
  };

  const signup = async (email: string, password: string) => {
    // Mock API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: User = { id: Math.random().toString(36).substr(2, 9), email };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};