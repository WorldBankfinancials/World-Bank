/**
 * server/startup-checks.ts
 * Startup health checks.
 * The atomic_balance_update RPC check is non-fatal — logs a warning
 * instead of aborting startup if the function doesn't exist.
 */
import { supabase } from './supabase-public-storage';

export async function verifyAtomicBalanceFunction(): Promise<boolean> {
  try {
    // Use a valid UUID format for the probe — invalid UUIDs cause a cast error
    // that doesn't contain "does not exist", giving false negatives
    const { error } = await supabase.rpc('atomic_balance_update', {
      p_account_id: '00000000-0000-0000-0000-000000000000',
      p_amount_change: 0,
    });
    // If the function exists, we get either success or a logic error (e.g. account not found)
    // If the function doesn't exist, we get a "does not exist" or "Could not choose a best candidate function" error
    if (error?.message?.includes('does not exist') ||
        error?.message?.includes('Could not choose a best candidate') ||
        error?.message?.includes('function not found')) return false;
    return true;
  } catch {
    return false;
  }
}

export async function runStartupChecks(): Promise<void> {
  const dataSource = process.env.DATA_SOURCE || 'supabase';
  if (dataSource !== 'supabase') return;

  console.info('Running startup checks...');

  const atomicExists = await verifyAtomicBalanceFunction();
  if (!atomicExists) {
    // Non-fatal: log warning, continue startup
    console.warn('[startup] atomic_balance_update RPC not found. Balance updates will use direct SQL instead.');
  } else {
    console.info('[startup] atomic_balance_update RPC: OK');
  }

  console.info('Startup checks complete.');
}
