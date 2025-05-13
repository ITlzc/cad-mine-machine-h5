'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { get_access_token, supabase, updateUserReferralId, updateUserInviterCode } from '../../utils/supabase_lib';
import { useNavigateWithParams } from '../../hooks/useNavigateWithParams';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const navigateWithParams = useNavigateWithParams()
  const fetchUserData = async (user) => {
    try {
        // setUser(user);
        // Fetch user data from backend API
        const access_token = await get_access_token();
        if (!access_token) {
            navigateWithParams('/login', 'push');
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
        // const userData = responseData && responseData.data && responseData.data.user;
        // userData.avatar_url = user.user_metadata?.avatar_url || "/images/avatar.png";
        // userData.full_name = user.user_metadata?.full_name || user.name || "User Name";
        // userData.username = user.user_metadata?.preferred_username || "username";
        // console.log(userData);
        // Transform API data to match UI requirements
          // setBoosterEnabled(userData.booster_enabled);

        // Set the earnings address
        // setEarningsAddress(userData.wallet_address);

    } catch (error) {
        console.error('Error fetching user data:', error);
    } finally {
    }
};

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }

        if (user) {
          // Check for referral_id in URL
          const urlParams = new URLSearchParams(window.location.search);
          console.log('urlParams = ',urlParams)
          const referralId = urlParams.get('referral_id');
          const inviterCode = urlParams.get('inviter_code');


          // If referral_id exists, try to update it
          if (referralId) {
            await updateUserReferralId(user.id, referralId);
          }

          // If inviter_code exists, try to update it
          if (inviterCode) {
            await updateUserInviterCode(user.id, inviterCode);
          }

          // Get user's activation status from metadata or database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('status')
            .eq('id', user.id)
            .single();

          if (userError) {
            console.error('Error fetching user status:', userError);
          }

          // Transform Supabase user to your app's user format
          const appUser = {
            id: user.id,
            name: user.user_metadata?.full_name,
            username: user.user_metadata?.preferred_username,
            avatar: user.user_metadata?.avatar_url,
            email: user.email,
            is_activated: userData?.status !== 0, // status = 0 means not activated
          };

          // Login using your AuthProvider
          login(appUser);
          
          // Redirect based on activation status
          // if (!appUser.is_activated) {
          //   console.log('appUser.is_activated 1111',appUser.is_activated);
          //   router.push('/login');
          // } else {
          //   console.log('appUser.is_activated 2222',appUser.is_activated);
          //   router.push('/');
          // }
          navigateWithParams('/', 'push');
        } else {
          console.log('appUser.is_activated 3333');
          navigateWithParams('/login', 'push');
        }
      } catch (error) {
        console.log('appUser.is_activated 4444',error);
        console.error('Error in auth callback:', error);
        navigateWithParams('/login', 'push');
      }
    };

    handleAuthCallback();
  }, [login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
} 