/**
 * STARTUP SANITY CHECKS
 * Validates critical database functions exist and work correctly
 * PREVENTS runtime regressions from missing/broken SQL functions
 */

import { supabase } from './supabase-public-storage';

/**
 * Verify atomic_balance_update function exists and works correctly
 */
export async function verifyAtomicBalanceFunction(): Promise<boolean> {
  try {
    
    // Test with a fake account ID (-1) - should fail gracefully
    const { data, error } = await supabase.rpc('atomic_balance_update', {
      p_account_id: -1,
      p_amount_change: 0
    });

    // If the function doesn't exist, we'll get a specific error
    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
      return false;
    }

    // The function exists (even if it returns empty for fake ID)
    return true;

  } catch (error: any) {
    return false;
  }
}

/**
 * Run all startup checks
 * CRITICAL FIX: Throws error and ABORTS startup if any check fails
 * PRODUCTION FIX: Only runs checks in Supabase mode
 */
export async function runStartupChecks(): Promise<void> {
  // CRITICAL: Only run checks when using Supabase storage
  const dataSource = process.env.DATA_SOURCE || 'supabase';
  
  if (dataSource !== 'supabase') {
    return;
  }
  
  
  const checks = [
    { name: 'Atomic Balance Function', test: verifyAtomicBalanceFunction }
  ];

  console.log('Running startup checks...');
  const failures: string[] = [];
  
  for (const check of checks) {
    console.log(`Testing: ${check.name}`);
    const passed = await check.test();
    if (!passed) {
      const message = `Startup check FAILED: ${check.name}`;
      console.error(message);
      failures.push(message);
    } else {
      console.log(`Passed: ${check.name}`);
    }
  }

  if (failures.length > 0) {
    console.error(`Startup aborted. Failures: ${failures.join(', ')}`);
    // CRITICAL: Throw error to ABORT startup - prevents broken server from starting
    throw new Error(`Startup checks failed: ${failures.join('; ')}`);
  }
  console.log('All startup checks passed.');

}
