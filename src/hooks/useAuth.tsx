
import { useEffect, useState, useCallback } from 'react';
import { useNavigation } from './useNavigation';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'public';
  status: string;
  department_name?: string;
  department_id?: number;
  division_name?: string;
  division_id?: number;
  public_id?: string;
  nic?: string;
  mobile?: string;
  address?: string;
}

export const useAuth = (requiredRole?: string) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { navigate } = useNavigation();

  const clearAuth = useCallback(() => {
    console.log('useAuth: Clearing authentication data');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('useAuth: Checking authentication...');
      setLoading(true);
      
      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        const userDataStr = localStorage.getItem('userData');

        console.log('useAuth: Auth data found:', { 
          hasToken: !!token, 
          userRole, 
          hasUserData: !!userDataStr 
        });

        // If any auth data is missing, clear everything and redirect to login
        if (!token || !userRole || !userDataStr) {
          console.log('useAuth: Missing auth data, redirecting to login');
          clearAuth();
          navigate('/login');
          return;
        }

        // Validate token format
        if (typeof token !== 'string' || token.split('.').length !== 3) {
          console.error('useAuth: Invalid token format');
          clearAuth();
          navigate('/login');
          return;
        }

        try {
          const userData = JSON.parse(userDataStr);
          console.log('useAuth: Parsed user data:', userData);
          
          // Validate user data structure
          if (!userData || typeof userData !== 'object' || !userData.id || !userData.role) {
            console.error('useAuth: Invalid user data structure');
            clearAuth();
            navigate('/login');
            return;
          }
          
          // Check if user has required role
          if (requiredRole && userRole !== requiredRole) {
            console.log(`useAuth: User role ${userRole} doesn't match required role ${requiredRole}`);
            clearAuth();
            navigate('/login');
            return;
          }

          // If we have all required data and roles match, set the user
          setUser(userData);
          console.log('useAuth: User authenticated successfully');
        } catch (error) {
          console.error('useAuth: Error parsing user data:', error);
          clearAuth();
          navigate('/login');
        }
      } catch (error) {
        console.error('useAuth: Unexpected error during authentication check:', error);
        clearAuth();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent UI flickering
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [navigate, requiredRole, clearAuth]);

  const logout = useCallback(() => {
    console.log('useAuth: Logging out user');
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  return { 
    user, 
    loading, 
    logout,
    isAuthenticated: !!user && !loading
  };
};
