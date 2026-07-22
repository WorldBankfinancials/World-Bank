/**
 * server/startup-checks.ts
 * Startup health checks for banking infrastructure.
 */
import { supabase } from './supabase-public-storage';

export async function verifyAtomicBalanceFunction(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('atomic_balance_update', {
      p_account_id: '00000000-0000-0000-0000-000000000000',
      p_amount_change: 0,
    });
    if (error && (error.message?.includes('does not exist') || error.message?.includes('Could not find'))) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function runStartupChecks(): Promise<void> {
  console.info('Running startup checks...');

  const atomicExists = await verifyAtomicBalanceFunction();
  if (!atomicExists) {
    console.warn('[startup] atomic_balance_update RPC not found. Balance updates will use direct SQL fallback.');
  } else {
    console.info('[startup] atomic_balance_update RPC: OK');
  }

  console.info('Startup checks complete.');
}
