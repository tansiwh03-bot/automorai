import { createContext, useState, useContext, ReactNode } from 'react';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('automorai_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email: string, password: string): boolean => {
    if (email && password.length >= 6) {
      const userData = { email };
      localStorage.setItem('automorai_user', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  };

  const signup = (email: string, password: string): boolean => {
    return login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('automorai_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
