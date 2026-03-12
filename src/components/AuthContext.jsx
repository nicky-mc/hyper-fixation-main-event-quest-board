import { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await base44.auth.isAuthenticated();
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          // Add 2-second delay for Google callback sync
          await new Promise(r => setTimeout(r, 2000));
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (error) {
        if (error.type === 'user_not_registered') {
          setAuthError(error);
        } else {
          console.error('Auth check error:', error);
        }
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
      }
    };

    checkAuth();
  }, []);

  const value = {
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};