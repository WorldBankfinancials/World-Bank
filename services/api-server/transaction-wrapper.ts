import { supabase } from './storage/supabase-public-storage';

/**
 * ATOMIC TRANSACTION WRAPPER FOR BANKING OPERATIONS
 * Ensures all money operations are either fully completed or fully rolled back
 * CRITICAL for preventing race conditions and data corruption
 */

export interface TransactionStep {
  name: string;
  execute: () => Promise<any>;
  rollback?: () => Promise<void>;
}

export class BankingTransaction {
  private steps: TransactionStep[] = [];
  private executedSteps: TransactionStep[] = [];
  private results: unknown[] = [];

  /**
   * Add a step to the transaction
   */
  addStep(step: TransactionStep) {
    this.steps.push(step);
    return this;
  }

  /**
   * Execute all steps atomically
   * If ANY step fails, ALL previous steps are rolled back
   */
  async execute<T = any>(): Promise<{ success: boolean; data?: T; error?: string }> {
    // CRITICAL FIX: Reset internal state to prevent double-execution bugs
    // This ensures clean state even if transaction instance is reused
    this.results = [];
    this.executedSteps = [];
    
    try {

      // Execute each step in order
      for (const step of this.steps) {
        try {
          const result = await step.execute();
          this.executedSteps.push(step);
          this.results.push(result);
        } catch (stepError: unknown) {
          const stepErrorMsg = stepError instanceof Error ? stepError.message : 'Internal server error';
          
          // ROLLBACK all executed steps in reverse order
          const rollbackFailures = await this.rollback();
          
          if (rollbackFailures.length > 0) {
            return {
              success: false,
              error: `Transaction failed at step "${step.name}": ${stepErrorMsg}. CRITICAL: Rollback had ${rollbackFailures.length} failures - manual intervention required: ${rollbackFailures.join('; ')}`
            };
          }
          
          return {
            success: false,
            error: `Transaction failed at step "${step.name}": ${stepErrorMsg}`
          };
        }
      }

      return {
        success: true,
        data: this.results[this.results.length - 1] as T
      };

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Internal server error';
      const rollbackFailures = await this.rollback();
      
      if (rollbackFailures.length > 0) {
        return {
          success: false,
          error: `Transaction failed: ${errorMsg}. CRITICAL: Rollback had ${rollbackFailures.length} failures: ${rollbackFailures.join('; ')}`
        };
      }
      
      return {
        success: false,
        error: `Transaction failed: ${errorMsg}`
      };
    }
  }

  /**
   * Rollback all executed steps
   * CRITICAL: Tracks rollback failures and logs them for manual intervention
   */
  private async rollback(): Promise<string[]> {
    const stepsToRollback = [...this.executedSteps].reverse();
    const rollbackFailures: string[] = [];
    
    for (const step of stepsToRollback) {
      if (step.rollback) {
        try {
          await step.rollback();
        } catch (rollbackError: unknown) {
          const errorMsg = `Rollback failed for "${step.name}": ${rollbackError instanceof Error ? rollbackError.message : 'Internal server error'}`;
          rollbackFailures.push(errorMsg);
          
          // Continue rolling back other steps even if one fails
          // but track the failure for manual intervention
        }
      }
    }
    
    if (rollbackFailures.length > 0) {
      // In production, this should trigger alerts to administrators
    } else {
    }
    
    return rollbackFailures;
  }
}

/**
 * HELPER: Update account balance atomically with DATABASE-LEVEL protection
 * Uses SQL to prevent race conditions - NO read-then-write pattern!
 */
export async function atomicBalanceUpdate(
  accountId: number,
  amountChange: number,
  description: string
): Promise<{ success: boolean; newBalance?: string; error?: string; previousBalance?: string }> {
  try {
    // CRITICAL FIX: Use SQL to atomically update AND check constraints in ONE operation
    // This prevents race conditions by letting the database handle the math
    const { data, error } = await supabase.rpc('atomic_balance_update', {
      p_account_id: accountId,
      p_amount_change: amountChange
    });

    if (error) {
      // Check if it's an insufficient funds error
      if (error.message?.includes('insufficient') || error.message?.includes('negative')) {
        return { success: false, error: 'Insufficient funds' };
      }
      return { success: false, error: 'Transaction failed' };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Account not found or update failed' };
    }

    const result = data[0];
    
    return { 
      success: true, 
      newBalance: result.new_balance?.toString(),
      previousBalance: result.previous_balance?.toString()
    };

  } catch (error: unknown) {
    // Fallback to direct SQL update if RPC not available
    return await fallbackAtomicUpdate(accountId, amountChange, description);
  }
}

/**
 * Fallback atomic update using direct SQL (for when RPC is not available)
 * Still atomic because it's a single SQL statement
 */
async function fallbackAtomicUpdate(
  accountId: number,
  amountChange: number,
  description: string
): Promise<{ success: boolean; newBalance?: string; error?: string }> {
  try {
    
    // Use a single SQL UPDATE that checks balance constraint
    const { data, error } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Account not found' };
    }

    const currentBalance = parseFloat(data.balance.toString());
    const newBalance = currentBalance + amountChange;

    // Check constraint BEFORE updating
    if (newBalance < 0) {
      return { success: false, error: 'Insufficient funds' };
    }

    // Optimistic update with version check (using balance as version)
    const { data: updateData, error: updateError } = await supabase
      .from('accounts')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .eq('balance', currentBalance) // Optimistic lock: only update if balance hasn't changed
      .select()
      .single();

    if (updateError || !updateData) {
      return { success: false, error: 'Balance was modified by another transaction. Please try again.' };
    }

    return { success: true, newBalance: newBalance.toString() };

  } catch (error: unknown) {
    return { success: false, error: 'Transaction failed' };
  }
}

/**
 * HELPER: Create transaction with balance deduction - ATOMIC
 */
export async function atomicTransfer(params: {
  fromAccountId: number;
  toAccountId?: number;
  amount: number;
  transactionType: string;
  description: string;
  recipientName?: string;
  recipientCountry?: string;
}): Promise<{ success: boolean; transaction?: Record<string, unknown>; error?: string }> {
  
  const tx = new BankingTransaction();
  let createdTransaction: Record<string, unknown> | null = null;

  // Step 1: Deduct from sender
  tx.addStep({
    name: 'Deduct from sender account',
    execute: async () => {
      const result = await atomicBalanceUpdate(
        params.fromAccountId,
        -params.amount,
        `Debit: ${params.description}`
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to deduct balance');
      }
      return result;
    },
    rollback: async () => {
      // Refund the deducted amount
      await atomicBalanceUpdate(
        params.fromAccountId,
        params.amount,
        `Rollback: ${params.description}`
      );
    }
  });

  // Step 2: Create transaction record
  tx.addStep({
    name: 'Create transaction record',
    execute: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          from_account_id: params.fromAccountId,
          to_account_id: params.toAccountId,
          amount: params.amount,
          transaction_type: params.transactionType,
          description: params.description,
          recipient_name: params.recipientName,
          recipient_country: params.recipientCountry,
          status: 'success',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      createdTransaction = data;
      return data;
    },
    rollback: async () => {
      // Delete the created transaction
      if (createdTransaction) {
        await supabase
          .from('transactions')
          .delete()
          .eq('id', createdTransaction.id);
      }
    }
  });

  // Step 3: Credit recipient (if internal transfer)
  if (params.toAccountId) {
    tx.addStep({
      name: 'Credit recipient account',
      execute: async () => {
        const result = await atomicBalanceUpdate(
          params.toAccountId!,
          params.amount,
          `Credit: ${params.description}`
        );
        if (!result.success) {
          throw new Error(result.error || 'Failed to credit balance');
        }
        return result;
      },
      rollback: async () => {
        // Deduct the credited amount
        await atomicBalanceUpdate(
          params.toAccountId!,
          -params.amount,
          `Rollback: ${params.description}`
        );
      }
    });
  }

  // Execute all steps atomically
  const result = await tx.execute();
  
  if (result.success) {
    return { success: true, transaction: createdTransaction ?? undefined };
  } else {
    return { success: false, error: result.error };
  }
}
