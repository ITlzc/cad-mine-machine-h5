'use client';
import Image from 'next/image';
import Link from 'next/link'
import { ChevronDownIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, signOut } from '../utils/supabase_lib';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const navigateWithParams = useNavigateWithParams()
  // 判断是否是登录相关页面
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(pathname)

  useEffect(() => {
    const fetchUserData = async () => {
      let user_string = localStorage.getItem('user');
      let user = null;
      if (user_string) {
        user = JSON.parse(user_string);
      }
      if (!user) {
        const { user: user_data, error } = await getCurrentUser();
        if (error || !user_data) {
          navigateWithParams('/login', 'push');
          return
        }
        user = user_data;
      }
      //   console.log('header user', user);
      let tamp = {
        id: user?.id,
        avatar_url: user?.user_metadata?.avatar_url,
        full_name: user?.user_metadata?.full_name,
        name: user?.user_metadata?.name,
        preferred_username: user?.user_metadata?.preferred_username,
      }
      //   console.log('tamp', tamp);
      setUser(tamp);
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      // Call Supabase signOut
      const { error } = await signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }

      // Clear local storage
      localStorage.removeItem('user');

      // Update local state
      // setIsLoggedIn(false);
      setIsDropdownOpen(false);

      // Redirect to login page
      console.log('logout 1111');
      navigateWithParams('/login', 'push');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-3 py-4">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center">
              <Image
                src="/images/logo.jpeg"
                alt="EpochMine"
                width={42}
                height={42}
                // className="h-8 w-auto"
              />
              <span className="ml-1 text-base font-semibold">EpochMine</span>
            </div>
          </Link>
        </div>
        {!isAuthPage && (
          <div className="flex items-center space-x-4">

            <ConnectButton label='连接钱包' />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 