// Environment-based configuration for data sources
export const config = {
  // Data source configuration
  USE_SUPABASE: process.env.USE_SUPABASE === 'true',
  
  // Environment detection
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Development settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'test',
  
  // Supabase configuration
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Mock data settings for development/testing
  ENABLE_MOCK_DATA: process.env.ENABLE_MOCK_DATA === 'true',
  SIMULATE_API_ERRORS: process.env.SIMULATE_API_ERRORS === 'true',
  
  // Default data source selection
  getDataSource(): 'supabase' | 'memory' | 'mock' {
    // Force Supabase usage when credentials are available
    if (this.SUPABASE_URL && this.SUPABASE_SERVICE_ROLE_KEY) {
      return 'supabase';
    }
    
    // Production: Always use Supabase
    if (this.isProduction) {
      return 'supabase';
    }
    
    // Development: Use environment variable or default to memory
    if (this.isDevelopment) {
      if (this.USE_SUPABASE) return 'supabase';
      if (this.ENABLE_MOCK_DATA) return 'mock';
      return 'memory';
    }
    
    // Testing: Use mock data by default
    if (this.isTesting) {
      return 'mock';
    }
    
    // Fallback to memory storage
    return 'memory';
  },
  
  // Authentication source selection
  getAuthSource(): 'supabase' | 'backend' {
    // Always use Supabase Auth in production
    if (this.isProduction) {
      return 'supabase';
    }
    
    // Development: Use real Supabase Auth but can fallback to backend
    return 'supabase';
  }
};

// Environment configuration display
export function logConfiguration() {
  console.log('\n🏦 World Bank Application Configuration:');
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`💾 Data Source: ${config.getDataSource()}`);
  console.log(`🔐 Auth Source: ${config.getAuthSource()}`);
  console.log(`🧪 Mock Data: ${config.ENABLE_MOCK_DATA ? 'Enabled' : 'Disabled'}`);
  console.log(`⚠️  API Error Simulation: ${config.SIMULATE_API_ERRORS ? 'Enabled' : 'Disabled'}`);
  console.log('');
}