import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile details on mount to verify session freshness
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axiosClient.get('/auth/me');
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    loadUser();
  }, [token]);

  // Login handler with automated role-based navigation routing
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { token: userToken, user: userData } = response.data;
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(userToken);
      setUser(userData);
      
      // Navigate based on user role
      if (userData.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/resident/dashboard');
      }

      return { success: true };
    } catch (error) {
      console.error('Login action failed:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler immediately logging the user in
  const register = async (formData) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post('/auth/register', formData);
      const { token: userToken, user: userData } = response.data;

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(userToken);
      setUser(userData);

      // Navigate based on role
      if (userData.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/resident/dashboard');
      }

      return { success: true };
    } catch (error) {
      console.error('Registration action failed:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
