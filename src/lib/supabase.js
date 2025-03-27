import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Default values as a fallback to prevent crashes
const defaultUrl = 'https://qlcyqesejshuwtttpnfe.supabase.co';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in environment variables.');
  console.warn('Using fallback values, authentication may not work properly.');
}

const supabase = createClient(supabaseUrl || defaultUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Add connection test with retry
const testConnection = async (retryCount = 0) => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('vehicles').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${delay / 1000} seconds (attempt ${retryCount + 1}/3)...`);
        
        setTimeout(() => {
          testConnection(retryCount + 1);
        }, delay);
      }
      
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test exception:', error);
    
    // Retry logic with exponential backoff
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying in ${delay / 1000} seconds (attempt ${retryCount + 1}/3)...`);
      
      setTimeout(() => {
        testConnection(retryCount + 1);
      }, delay);
    }
    
    return false;
  }
};

// Run the connection test (don't wait for it)
testConnection();

// Log authentication status for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state change:', event, session ? 'User logged in' : 'No session');
  
  if (event === 'SIGNED_IN') {
    console.log('User signed in with ID:', session.user.id);
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});

// Enhanced error handling wrapper for Supabase functions
const enhancedFetch = async (fetchFunction) => {
  try {
    const result = await fetchFunction();
    
    if (result.error) {
      console.error('Supabase operation error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Supabase operation exception:', error);
    return { data: null, error };
  }
};

// Add a wrapper for RPC calls to handle errors consistently
const rpcWithErrorHandling = async (functionName, params = {}) => {
  console.log(`Calling RPC function: ${functionName}`, params);
  
  return enhancedFetch(() => supabase.rpc(functionName, params));
};

// Helper function to check if the connection is working
const isConnectionWorking = async () => {
  try {
    const { error } = await supabase.from('vehicles').select('count').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
};

// Attach enhanced methods to the supabase client
supabase.rpcSafe = rpcWithErrorHandling;
supabase.enhancedFetch = enhancedFetch;
supabase.isConnectionWorking = isConnectionWorking;

export default supabase;