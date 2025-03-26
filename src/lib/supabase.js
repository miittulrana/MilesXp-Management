import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Check your environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Add connection test
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('vehicles').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test exception:', error);
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
  }
});

// Add a wrapper for RPC calls to handle errors consistently
const rpcWithErrorHandling = async (functionName, params = {}) => {
  console.log(`Calling RPC function: ${functionName}`, params);
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`RPC error in ${functionName}:`, error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in RPC ${functionName}:`, error);
    throw error;
  }
};

// Attach the RPC wrapper to the supabase client
supabase.rpcSafe = rpcWithErrorHandling;

export default supabase;