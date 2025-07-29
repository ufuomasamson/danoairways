import { createClient } from '@supabase/supabase-js';

// Use environment variables from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vftrdqfciqacxanhzvvz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdHJkcWZjaXFhY3hhbmh6dnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzczNTAsImV4cCI6MjA2OTM1MzM1MH0.x3k3-_FQEPKGSOTREDrzGFoRknVXsnzGvsWA9j133-s';

console.log('Initializing Supabase with URL:', supabaseUrl);
console.log('Supabase key available:', !!supabaseAnonKey);

// Create client for client-side usage (using anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit', // Try implicit flow which may work better in some browsers
    debug: false // Disable debug logs
  },
  global: {
    headers: {
      'x-client-info': 'united-air-next-app' // Add custom identifier
    }
  }
});

// Create a server-side client (for use in API routes)
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon key for server operations.');
    return supabase;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Table names constants (replacing Appwrite collections)
export const TABLES = {
  FLIGHTS: 'flights',
  LOCATIONS: 'locations',
  AIRLINES: 'airlines',
  USERS: 'users',     // Changed from PROFILES to USERS
  BOOKINGS: 'bookings',
  CURRENCIES: 'currencies',
  PAYMENT_GATEWAYS: 'payment_gateways',
  USER_PREFERENCES: 'user_preferences',
  CRYPTO_WALLETS: 'crypto_wallets',
  PAYMENTS: 'payments',
  USER_ROLES: 'user_roles'
};

// Storage bucket constants
export const STORAGE_BUCKETS = {
  MAIN_BUCKET: 'unit-bucket',
  AIRLINE_LOGOS: 'unit-bucket/airline_logos',
  PAYMENT_PROOFS: 'unit-bucket/payment_proofs',
  TICKETS: 'unit-bucket/tickets',
  QR_CODES: 'unit-bucket/qr_codes',
  CRYPTO_WALLETS: 'unit-bucket/crypto_wallets'
};

// Helper function to check if user is an admin
export const isAdmin = async (): Promise<boolean> => {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    
    // Check user_roles table first
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
      
    if (roleData?.role === 'admin') return true;
    
    // Check user metadata as fallback
    return session.user.user_metadata?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Helper function for database CRUD operations
export const dbHelpers = {
  // Create a new record
  create: async (table: string, data: any) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
      
    if (error) throw error;
    return result;
  },
  
  // Get a record by ID
  get: async (table: string, id: string) => {
    const { data, error } = await supabase
      .from(table)
      .select()
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Update a record
  update: async (table: string, id: string, data: any) => {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return result;
  },
  
  // Delete a record
  delete: async (table: string, id: string) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  },
  
  // List records with pagination and filters
  list: async (table: string, {
    page = 1,
    limit = 10,
    orderBy = 'created_at',
    orderDirection = 'desc',
    filters = []
  }: any) => {
    let query = supabase
      .from(table)
      .select('*', { count: 'exact' });
    
    // Apply any filters
    filters.forEach((filter: any) => {
      if (filter.type === 'eq') {
        query = query.eq(filter.field, filter.value);
      } else if (filter.type === 'neq') {
        query = query.neq(filter.field, filter.value);
      } else if (filter.type === 'gt') {
        query = query.gt(filter.field, filter.value);
      } else if (filter.type === 'lt') {
        query = query.lt(filter.field, filter.value);
      } else if (filter.type === 'gte') {
        query = query.gte(filter.field, filter.value);
      } else if (filter.type === 'lte') {
        query = query.lte(filter.field, filter.value);
      } else if (filter.type === 'like') {
        query = query.ilike(filter.field, `%${filter.value}%`);
      }
    });
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Execute query with pagination and ordering
    const { data, error, count } = await query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(from, to);
      
    if (error) throw error;
    
    return {
      data,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    };
  }
};

// Storage helpers
export const storageHelpers = {
  // Upload a file
  upload: async (bucket: string, file: File, options?: { path?: string }) => {
    const path = options?.path || `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) throw error;
    return data;
  },
  
  // Get public URL for a file
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    return data.publicUrl;
  },
  
  // Delete a file
  delete: async (bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
      
    if (error) throw error;
    return true;
  }
};
