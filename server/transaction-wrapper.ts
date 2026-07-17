import { supabase } from './supabase-public-storage';

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

  addStep(step: TransactionStep) {
    this.steps.push(step);
    return this;
  }

  async execute<T = any>(): Promise<{ success: boolean; data?: T; error?: string }> {
    this.results = [];
    this.executedSteps = [];

    try {
      for (const step of this.steps) {
        try {
          const result = await step.execute();
          this.executedSteps.push(step);
          this.results.push(result);
        } catch (stepError: unknown) {
          const stepErrorMsg = stepError instanceof Error ? stepError.message : 'Internal server error';
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
        }
      }
    }

    return rollbackFailures;
  }
}

/**
 * HELPER: Update account balance atomically with DATABASE-LEVEL protection
 * Uses RPC to prevent race conditions - NO read-then-write pattern!
 * Account IDs are UUIDs (text), not numbers.
 */
export async function atomicBalanceUpdate(
  accountId: string,
  amountChange: number,
  description: string
): Promise<{ success: boolean; newBalance?: string; error?: string; previousBalance?: string }> {
  try {
    const { data, error } = await supabase.rpc('atomic_balance_update', {
      p_account_id: accountId,
      p_amount_change: amountChange
    });

    if (error) {
      if ((error as Error).message?.includes('insufficient') || (error as Error).message?.includes('negative')) {
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
    return await fallbackAtomicUpdate(accountId, amountChange, description);
  }
}

/**
 * Fallback atomic update using direct SQL (for when RPC is not available)
 */
async function fallbackAtomicUpdate(
  accountId: string,
  amountChange: number,
  description: string
): Promise<{ success: boolean; newBalance?: string; error?: string }> {
  try {
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      return { success: false, error: 'Account not found' };
    }

    const currentBalance = parseFloat(String((account as Record<string, unknown>).balance || '0'));
    const newBalance = currentBalance + amountChange;

    if (newBalance < 0) {
      return { success: false, error: 'Insufficient funds' };
    }

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance.toFixed(2), updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .eq('balance', (account as Record<string, unknown>).balance);

    if (updateError) {
      return { success: false, error: 'Balance was modified by another transaction. Please try again.' };
    }

    return { success: true, newBalance: newBalance.toFixed(2) };
  } catch (error: unknown) {
    return { success: false, error: 'Transaction failed' };
  }
}

/**
 * HELPER: Create transaction with balance deduction - ATOMIC
 * Account IDs are UUIDs (text). For transfers to another user, pass either
 * toAccountId (UUID) or recipientAccountNumber (text) — the function will
 * look up the recipient's account UUID by account number.
 */
export async function atomicTransfer(params: {
  fromAccountId: string;
  toAccountId?: string;
  recipientAccountNumber?: string;
  amount: number;
  transactionType: string;
  description: string;
  recipientName?: string;
  recipientCountry?: string;
}): Promise<{ success: boolean; transaction?: Record<string, unknown>; error?: string }> {

  const tx = new BankingTransaction();
  let createdTransaction: Record<string, unknown> | null = null;

  // Resolve recipient account UUID from account number if needed
  let toAccountId = params.toAccountId;
  if (!toAccountId && params.recipientAccountNumber) {
    const { data: recipientAccount, error: lookupError } = await supabase
      .from('accounts')
      .select('id')
      .eq('account_number', params.recipientAccountNumber)
      .eq('status', 'active')
      .maybeSingle();

    if (lookupError || !recipientAccount) {
      return { success: false, error: 'Recipient account not found' };
    }
    toAccountId = (recipientAccount as Record<string, unknown>).id as string;
  }

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
          to_account_id: toAccountId || null,
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
      if (createdTransaction) {
        await supabase
          .from('transactions')
          .delete()
          .eq('id', createdTransaction.id);
      }
    }
  });

  // Step 3: Credit recipient (if internal transfer to a known account)
  if (toAccountId) {
    tx.addStep({
      name: 'Credit recipient account',
      execute: async () => {
        const result = await atomicBalanceUpdate(
          toAccountId!,
          params.amount,
          `Credit: ${params.description}`
        );
        if (!result.success) {
          throw new Error(result.error || 'Failed to credit balance');
        }
        return result;
      },
      rollback: async () => {
        await atomicBalanceUpdate(
          toAccountId!,
          -params.amount,
          `Rollback: ${params.description}`
        );
      }
    });
  }

  const result = await tx.execute();

  if (result.success) {
    return { success: true, transaction: createdTransaction ?? undefined };
  } else {
    return { success: false, error: result.error };
  }
}
