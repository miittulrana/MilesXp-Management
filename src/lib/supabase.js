import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in environment variables.');
  console.error('Make sure your .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Debug function to test connection
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

// Test connection on load (won't block execution)
testConnection();

// Debug auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state change:', event, session ? 'User logged in' : 'No session');
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
supabase.enhancedFetch = enhancedFetch;
supabase.isConnectionWorking = isConnectionWorking;

export default supabase;