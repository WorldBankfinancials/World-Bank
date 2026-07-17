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
      // Fall through to fallback for any RPC error (including function not existing)
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const result = data[0];
      return {
        success: true,
        newBalance: result.new_balance?.toString(),
        previousBalance: result.previous_balance?.toString()
      };
    }

    // RPC returned no data or errored — use fallback
    return await fallbackAtomicUpdate(accountId, amountChange, description);
  } catch {
    return await fallbackAtomicUpdate(accountId, amountChange, description);
  }
}

/**
 * Fallback atomic update using direct SQL (for when RPC is not available)
 * Uses optimistic concurrency: re-reads after update to verify the row changed
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

    const { data: updated, error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance.toFixed(2), updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .eq('balance', (account as Record<string, unknown>).balance)
      .select('balance')
      .single();

    if (updateError) {
      return { success: false, error: 'Balance was modified by another transaction. Please try again.' };
    }

    // CRITICAL: verify the update actually affected a row
    if (!updated) {
      return { success: false, error: 'Balance was modified by another transaction. Please try again.' };
    }

    return { success: true, newBalance: newBalance.toFixed(2) };
  } catch (error: unknown) {
    return { success: false, error: 'Transaction failed' };
  }
}

/**
 * HELPER: Create transaction with balance deduction - ATOMIC
 *
 * Supports TWO transfer modes:
 * 1. Internal transfer: recipientAccountNumber exists in our accounts table → debit sender, credit recipient
 * 2. External transfer: recipientAccountNumber NOT found → debit sender only, record external bank metadata
 *    (simulates SWIFT/ACH — in production this would call an external banking API)
 *
 * Account IDs are UUIDs (text). For transfers to another user, pass either
 * toAccountId (UUID) or recipientAccountNumber (text) — the function will
 * look up the recipient's account UUID by account number.
 */
export async function atomicTransfer(params: {
  fromAccountId: string;
  fromUserId?: string;
  toAccountId?: string;
  recipientAccountNumber?: string;
  amount: number;
  transactionType: string;
  description: string;
  recipientName?: string;
  recipientCountry?: string;
  currency?: string;
  referenceNumber?: string;
  bankName?: string;
  swiftCode?: string;
}): Promise<{ success: boolean; transaction?: Record<string, unknown>; error?: string; isExternal?: boolean }> {

  const tx = new BankingTransaction();
  let createdTransaction: Record<string, unknown> | null = null;

  // Resolve recipient account UUID from account number if needed
  let toAccountId = params.toAccountId;
  let isExternal = false;

  if (!toAccountId && params.recipientAccountNumber) {
    const { data: recipientAccount, error: lookupError } = await supabase
      .from('accounts')
      .select('id, user_id')
      .eq('account_number', params.recipientAccountNumber)
      .eq('status', 'active')
      .maybeSingle();

    if (lookupError || !recipientAccount) {
      // EXTERNAL TRANSFER: recipient account not found in our bank
      // Debit the sender, record the transaction with external bank metadata
      // In production this would initiate a SWIFT/ACH transfer via an external API
      isExternal = true;
      toAccountId = undefined;
    } else {
      toAccountId = (recipientAccount as Record<string, unknown>).id as string;
    }
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
      const insertData: Record<string, unknown> = {
        from_account_id: params.fromAccountId,
        to_account_id: toAccountId || null,
        from_user_id: params.fromUserId || null,
        amount: params.amount,
        currency: params.currency || 'USD',
        transaction_type: params.transactionType,
        description: params.description,
        recipient_name: params.recipientName,
        recipient_country: params.recipientCountry,
        recipient_account_number: params.recipientAccountNumber || null,
        bank_name: params.bankName || null,
        swift_code: params.swiftCode || null,
        reference_number: params.referenceNumber || null,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      // For internal transfers, resolve to_user_id from the recipient account
      if (toAccountId && !isExternal) {
        const { data: recipientAccount } = await supabase
          .from('accounts')
          .select('user_id')
          .eq('id', toAccountId)
          .single();
        if (recipientAccount) {
          insertData.to_user_id = (recipientAccount as Record<string, unknown>).user_id;
        }
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(insertData)
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

  // Step 3: Credit recipient (ONLY for internal transfers — external transfers
  // would credit the recipient via an external banking network, not our DB)
  if (toAccountId && !isExternal) {
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
    return { success: true, transaction: createdTransaction ?? undefined, isExternal };
  } else {
    return { success: false, error: result.error, isExternal };
  }
}
