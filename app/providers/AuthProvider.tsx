'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { get_access_token, getCurrentUser } from '../utils/supabase_lib';
import { supabase } from '../utils/supabase_lib';
import { useNavigateWithParams } from '../hooks/useNavigateWithParams';
interface User {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  username?: string;
  is_activated?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // console.log('AuthProvider 1111');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const navigateWithParams = useNavigateWithParams()

  useEffect(() => {
    // Check for stored user data in localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const fetchUserData = async (user) => {
    try {
      // setUser(user);
      // Fetch user data from backend API
      const access_token = await get_access_token();
      if (!access_token) {
        navigateWithParams('/login/', 'push');
        return;
      }
      const response = await fetch(`/api/v1/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const responseData = await response.json();
      console.log(responseData);
      return responseData

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
    }
  };

  useEffect(() => {
    // Redirect to login if accessing protected route without authentication
    // console.log('=== Auth Debug Info ===');
    // console.log('Current pathname:', pathname);
    // console.log('Previous page:', document.referrer || 'No referrer');
    // console.log('User state:', user);
    // console.log('Is loading:', isLoading);
    // console.log('Is public route:', publicRoutes.includes(pathname));
    // console.log('Should redirect:', !isLoading && !user && !publicRoutes.includes(pathname));
    // console.log('=====================');

    const checkAuthAndRedirect = async () => {
      const access_token = await get_access_token();
      if (!access_token) {
        navigateWithParams('/login/', 'push');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const referralId = urlParams.get('referral_id');

      let user_string = localStorage.getItem('user');
      let currentUser = null;

      if (user_string) {
        currentUser = JSON.parse(user_string);
      }
      if (!currentUser) {
        const { user: user_data, error } = await getCurrentUser();
        // if (error || !user_data) {
        //     if (referralId) {
        //     //   console.log('referralId 1111',referralId);
        //         router.push(`/login?referral_id=${referralId}`);
        //     } else {
        //     //   console.log('referralId 2222');
        //         router.push('/login');
        //     }
        //     return
        // }
        currentUser = user_data;
      }
      //   const { user: currentUser, error } = await getCurrentUser();
      console.log('currentUser', currentUser);

      if (!currentUser && !publicRoutes.includes(pathname)) {
        console.log('Attempting to redirect to login page...');
        // Get referral_id from current URL if it exists
        // Redirect to login with referral_id if it exists
        if (referralId) {
          //   console.log('referralId 1111',referralId);
          navigateWithParams(`/login?referral_id=${referralId}`, 'push');
        } else {
          //   console.log('referralId 2222');
          navigateWithParams('/login/', 'push');
        }
      } else if (currentUser) {
        // Check user's status
        // console.log('currentUser 1111',currentUser);
        const responseData = await fetchUserData(currentUser);
        const userData = responseData && responseData.data && responseData.data.user;
        const active_record = responseData && responseData.data && responseData.data.active_record;

        // If user is not activated (status = 0) and trying to access any page other than login, redirect to login
        if (userData?.status === 0 && pathname !== '/login') {
          //   console.log('userData 1111',userData);
          // if (!active_record) {
          //   router.push('/login');
          // }
        }
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigateWithParams('/login/', 'push');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
