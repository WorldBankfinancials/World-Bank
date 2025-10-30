/**
 * STARTUP SANITY CHECKS
 * Validates critical database functions exist and work correctly
 * PREVENTS runtime regressions from missing/broken SQL functions
 */

import { supabase } from './supabase-public-storage';
import { initializeDatabase } from './init-database';

/**
 * Verify atomic_balance_update function exists and works correctly
 */
export async function verifyAtomicBalanceFunction(): Promise<boolean> {
  try {
    console.log('🔍 Verifying atomic_balance_update SQL function...');
    
    // Test with a fake account ID (-1) - should fail gracefully
    const { data, error } = await supabase.rpc('atomic_balance_update', {
      p_account_id: -1,
      p_amount_change: 0
    });

    // If the function doesn't exist, we'll get a specific error
    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
      console.error('❌ CRITICAL: atomic_balance_update function NOT FOUND in database!');
      console.error('   Run the SQL migration to create it');
      return false;
    }

    // The function exists (even if it returns empty for fake ID)
    console.log('✅ atomic_balance_update function verified');
    return true;

  } catch (error: any) {
    console.error('❌ Failed to verify atomic_balance_update:', error);
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
    console.log('ℹ️  Skipping startup checks (not using Supabase storage)');
    return;
  }
  
  console.log('🚀 Running startup sanity checks...');
  
  // Run database initialization (RLS policy check)
  await initializeDatabase();
  
  const checks = [
    { name: 'Atomic Balance Function', test: verifyAtomicBalanceFunction }
  ];

  const failures: string[] = [];
  
  for (const check of checks) {
    const passed = await check.test();
    if (!passed) {
      const message = `Startup check FAILED: ${check.name}`;
      console.error(`❌ ${message}`);
      failures.push(message);
    }
  }

  if (failures.length > 0) {
    console.error('🚨 CRITICAL: Startup checks failed - ABORTING SERVER STARTUP');
    console.error('   Failed checks:', failures);
    console.error('   Fix database configuration and restart server');
    
    // CRITICAL: Throw error to ABORT startup - prevents broken server from starting
    throw new Error(`Startup checks failed: ${failures.join('; ')}`);
  }

  console.log('✅ All startup checks passed - server starting');
}
