export const config = {
  USE_SUPABASE: process.env.USE_SUPABASE === 'true',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'test',
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ENABLE_MOCK_DATA: process.env.ENABLE_MOCK_DATA === 'true',
  SIMULATE_API_ERRORS: process.env.SIMULATE_API_ERRORS === 'true',
  getDataSource(): 'supabase' | 'memory' | 'mock' {
    if (this.SUPABASE_URL && this.SUPABASE_SERVICE_ROLE_KEY) return 'supabase';
    if (this.isProduction) return 'supabase';
    if (this.isDevelopment) {
      if (this.USE_SUPABASE) return 'supabase';
      if (this.ENABLE_MOCK_DATA) return 'mock';
      return 'memory';
    }
    if (this.isTesting) return 'mock';
    return 'memory';
  },
  getAuthSource(): 'supabase' | 'backend' { return 'supabase'; }
};

export function logConfiguration() {}
