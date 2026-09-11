/**
 * Platform Configuration
 *
 * Centralized configuration management for the banking platform.
 * Loads configuration from environment variables with sensible defaults.
 */

export interface PlatformConfig {
  /** Application environment */
  environment: 'development' | 'staging' | 'production' | 'test';
  /** Port for the API server */
  port: number;
  /** Supabase URL */
  supabaseUrl: string;
  /** Supabase anon key */
  supabaseAnonKey: string;
  /** Supabase service role key */
  supabaseServiceRoleKey: string;
  /** JWT secret */
  jwtSecret: string;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Whether to enable rate limiting */
  rateLimitingEnabled: boolean;
  /** Whether to enable fraud detection */
  fraudDetectionEnabled: boolean;
  /** Whether to enable audit logging */
  auditLoggingEnabled: boolean;
}

/**
 * Load configuration from environment variables.
 */
export function loadConfig(): PlatformConfig {
  return {
    environment: (process.env.NODE_ENV as PlatformConfig['environment']) || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    supabaseUrl: process.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
    logLevel: (process.env.LOG_LEVEL as PlatformConfig['logLevel']) || 'info',
    rateLimitingEnabled: process.env.RATE_LIMITING_ENABLED !== 'false',
    fraudDetectionEnabled: process.env.FRAUD_DETECTION_ENABLED !== 'false',
    auditLoggingEnabled: process.env.AUDIT_LOGGING_ENABLED !== 'false',
  };
}

/**
 * Validate that required configuration values are present.
 */
export function validateConfig(config: PlatformConfig): string[] {
  const errors: string[] = [];

  if (!config.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not set');
  }
  if (!config.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not set');
  }
  if (config.environment === 'production') {
    if (!config.supabaseServiceRoleKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is not set (required in production)');
    }
    if (config.jwtSecret === 'default-secret-change-me') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    }
  }

  return errors;
}

/**
 * Log the current configuration (redacting sensitive values).
 */
export function logConfiguration(config: PlatformConfig): void {
  console.log('Configuration:');
  console.log(`  Environment: ${config.environment}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Supabase URL: ${config.supabaseUrl ? '***configured***' : 'NOT SET'}`);
  console.log(`  Supabase Anon Key: ${config.supabaseAnonKey ? '***configured***' : 'NOT SET'}`);
  console.log(`  Service Role Key: ${config.supabaseServiceRoleKey ? '***configured***' : 'NOT SET'}`);
  console.log(`  Log Level: ${config.logLevel}`);
  console.log(`  Rate Limiting: ${config.rateLimitingEnabled ? 'enabled' : 'disabled'}`);
  console.log(`  Fraud Detection: ${config.fraudDetectionEnabled ? 'enabled' : 'disabled'}`);
  console.log(`  Audit Logging: ${config.auditLoggingEnabled ? 'enabled' : 'disabled'}`);
}

export const config = loadConfig();

export default { config, loadConfig, validateConfig, logConfiguration };
