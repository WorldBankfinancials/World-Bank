export const config = {
  USE_SUPABASE: process.env.USE_SUPABASE === 'true',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'test',
  get supabaseUrl() { return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''; },
  get supabaseAnonKey() { return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''; },
  get supabaseServiceRoleKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY || ''; },
  ENABLE_MOCK_DATA: process.env.ENABLE_MOCK_DATA === 'true',
  getDataSource(): 'supabase' | 'memory' | 'mock' {
    if (this.supabaseUrl && this.supabaseServiceRoleKey) return 'supabase';
    if (this.isProduction) {
      if (!this.supabaseUrl || !this.supabaseServiceRoleKey) {
        console.error('[config] Production mode without Supabase credentials');
      }
      return 'supabase';
    }
    if (this.isDevelopment) {
      if (this.USE_SUPABASE) return 'supabase';
      if (this.ENABLE_MOCK_DATA) return 'mock';
      return 'memory';
    }
    if (this.isTesting) return 'mock';
    return 'memory';
  },
  getAuthSource(): 'supabase' { return 'supabase'; }
};

export function logConfiguration() {
  const safe = {
    NODE_ENV: config.NODE_ENV,
    dataSource: config.getDataSource(),
    authSource: config.getAuthSource(),
    hasSupabaseUrl: !!config.supabaseUrl,
    hasServiceKey: !!config.supabaseServiceRoleKey,
    hasAnonKey: !!config.supabaseAnonKey,
  };
  console.info('[config] Configuration:', JSON.stringify(safe, null, 2));
}
