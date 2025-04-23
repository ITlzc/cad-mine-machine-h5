import { createClient } from '@supabase/supabase-js';
import { Provider } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TwitterLoginOptions {
  redirectTo?: string;
  scopes?: string;
  referralId?: string | null;
}

/**
 * Updates the user's referral_id in the database
 * @param userId The user's ID
 * @param referralId The referral ID to set
 * @returns Promise with the result of the update operation
 */
export const updateUserReferralId = async (userId: string, referralId: string) => {
  try {
    // First check if user already has a referral_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referrer_id')
      .eq('id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    // If user already has a referral_id, don't update
    if (userData?.referrer_id) {
      return { data: userData, error: null };
    }

    // Update user's referral_id
    const { data, error } = await supabase
      .from('users')
      .update({ referrer_id: referralId })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user referral ID:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error updating user referral ID'),
    };
  }
};

/**
 * Initiates Twitter OAuth login flow
 * @param options Configuration options for Twitter login
 * @returns Promise that resolves when the login flow is initiated
 */
export const loginWithTwitter = async (options: TwitterLoginOptions = {}) => {
  try {
    const redirectUrl = new URL(options.redirectTo || `${window.location.origin}/auth/callback`);
    if (options.referralId) {
      redirectUrl.searchParams.set('referral_id', options.referralId);
    }

    let in_data: { redirectTo: string; scopes: string; queryParams?: { referral_id: string } } = {
        redirectTo: redirectUrl.toString(),
        scopes: options.scopes || 'users.read tweet.read email',
    }

    if (options.referralId) {
        in_data.queryParams = { referral_id: options.referralId };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: in_data,
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error during Twitter login:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error during Twitter login'),
    };
  }
};

/**
 * Gets the current logged in user
 * @returns The current user or null if not logged in
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return { user: null, error: error };
    }
    localStorage.setItem('user', JSON.stringify(user));
    return { user, error: null };
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem('user');
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Unknown error getting current user'),
    };
  }
};

export async function get_access_token() {
	// const { data:temp_user,error:user_error } = await supabase.auth.getUser()
	// if (user_error) {
	// 	throw user_error
	// }
	const { data, error } = await supabase.auth.getSession()
	if (error) {
	  throw error
	}
	// console.log("data.session = ",data.session)
	let access_token =  data && data.session && data.session.access_token
	if (!access_token) {
        localStorage.removeItem('user');
      console.log('user is not login')
      return null
	}
	return access_token
}

/**
 * Signs out the current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error during sign out:', error);
    return {
      error: error instanceof Error ? error : new Error('Unknown error during sign out'),
    };
  }
};

/**
 * Unlinks Twitter account from the current user
 * @returns Promise with the result of the unlink operation
 */
export const unlinkTwitter = async () => {
  try {
    // Since we cannot directly unlink the identity, we'll sign out the user
    // This will effectively remove all linked providers
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error unlinking Twitter account:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error unlinking Twitter account'),
    };
  }
}; 

export async function signInWithEmailOtp(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: true    // 如果用户不存在，则自动注册
    }
  })
  console.log('signInWithEmailOtp = ',data,error)
  if (error) {
      throw error
  }
  return data
}

export async function verifyOtp(email,otp) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email,
    token: otp,
    type: 'email'
  })
  console.log('verifyOtp = ',data,error)
  if (error) {
      throw error
  }
  return data
}