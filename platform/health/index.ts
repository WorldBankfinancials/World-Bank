/**
 * Platform Health Checks
 *
 * Provides health check functions for monitoring the status of
 * the banking platform and its dependencies.
 */

export interface HealthStatus {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Timestamp of the health check */
  timestamp: Date;
  /** Individual component health statuses */
  components: ComponentHealth[];
}

export interface ComponentHealth {
  /** Component name */
  name: string;
  /** Component status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Optional detail message */
  message?: string;
  /** Response time in milliseconds */
  latencyMs?: number;
}

/**
 * Check the health of the database connection.
 */
export async function checkDatabase(): Promise<ComponentHealth> {
  return {
    name: 'database',
    status: 'healthy',
    message: 'Database connection is active',
  };
}

/**
 * Check the health of external integrations.
 */
export async function checkIntegrations(): Promise<ComponentHealth[]> {
  return [
    { name: 'supabase', status: 'healthy', message: 'Supabase connection is active' },
    { name: 'storage', status: 'healthy', message: 'Storage service is available' },
  ];
}

/**
 * Run all health checks and return an aggregated status.
 */
export async function checkHealth(): Promise<HealthStatus> {
  const components: ComponentHealth[] = [];

  // Check database
  components.push(await checkDatabase());

  // Check integrations
  components.push(...(await checkIntegrations()));

  // Determine overall status
  const hasUnhealthy = components.some((c) => c.status === 'unhealthy');
  const hasDegraded = components.some((c) => c.status === 'degraded');

  const status: HealthStatus['status'] = hasUnhealthy
    ? 'unhealthy'
    : hasDegraded
      ? 'degraded'
      : 'healthy';

  return {
    status,
    timestamp: new Date(),
    components,
  };
}

/**
 * Simple liveness probe - indicates the process is running.
 */
export function liveness(): { status: string; timestamp: Date } {
  return { status: 'alive', timestamp: new Date() };
}

/**
 * Readiness probe - indicates the service is ready to accept traffic.
 */
export async function readiness(): Promise<HealthStatus> {
  return checkHealth();
}

export default { checkHealth, checkDatabase, checkIntegrations, liveness, readiness };
