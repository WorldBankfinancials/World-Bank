/**
 * server/startup-checks.ts
 * Non-fatal startup health checks.
 */
import { supabase } from './supabase-public-storage';

export async function verifyAtomicBalanceFunction(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('atomic_balance_update', {
      p_account_id: '-1',
      p_amount_change: 0,
    });
    if (error?.message?.includes('does not exist')) return false;
    return true;
  } catch {
    return false;
  }
}

export async function runStartupChecks(): Promise<void> {
  const dataSource = process.env.DATA_SOURCE || 'supabase';
  if (dataSource !== 'supabase') return;

  console.log('Running startup checks...');
  const atomicExists = await verifyAtomicBalanceFunction();
  if (!atomicExists) {
    console.warn('[startup] atomic_balance_update RPC not found. Balance updates will use direct SQL instead.');
  } else {
    console.log('[startup] atomic_balance_update RPC: OK');
  }
  console.log('Startup checks complete.');
}
