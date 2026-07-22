import { getAdminClient } from './auth-middleware';

/**
 * ATOMIC TRANSACTION WRAPPER FOR BANKING OPERATIONS
 * Ensures all money operations are either fully completed or fully rolled back.
 * Uses compensating transactions with rollback on failure.
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
            console.error(`[CRITICAL] Transaction failed at step "${step.name}": ${stepErrorMsg}. Rollback failures:`, rollbackFailures);
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
        console.error(`[CRITICAL] Transaction failed: ${errorMsg}. Rollback failures:`, rollbackFailures);
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

export async function atomicBalanceUpdate(
  accountId: string,
  amountChange: number,
  _description: string
): Promise<{ success: boolean; newBalance?: string; error?: string; previousBalance?: string }> {
  try {
    const { data, error } = await getAdminClient().rpc('atomic_balance_update', {
      p_account_id: accountId,
      p_amount_change: amountChange
    });

    if (error) {
      if ((error as Error).message?.includes('insufficient') || (error as Error).message?.includes('negative')) {
        return { success: false, error: 'Insufficient funds' };
      }
      return { success: false, error: 'Balance update failed' };
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const result = data[0];
      return {
        success: true,
        newBalance: result.new_balance?.toString(),
        previousBalance: result.previous_balance?.toString()
      };
    }

    return { success: false, error: 'Balance update returned no data' };
  } catch {
    return { success: false, error: 'Balance update failed' };
  }
}

async function verifyAccountOwnership(accountId: string, userId?: string): Promise<boolean> {
  if (!userId) return true;
  try {
    const { data, error } = await getAdminClient()
      .from('accounts')
      .select('user_id')
      .eq('id', accountId)
      .maybeSingle();
    if (error || !data) return false;
    return String((data as Record<string, unknown>).user_id) === String(userId);
  } catch {
    return false;
  }
}

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

  if (params.fromUserId) {
    const isOwner = await verifyAccountOwnership(params.fromAccountId, params.fromUserId);
    if (!isOwner) {
      return { success: false, error: 'Account ownership verification failed' };
    }
  }

  const tx = new BankingTransaction();
  const txState: { createdTransaction: Record<string, unknown> | null } = { createdTransaction: null };

  let toAccountId = params.toAccountId;
  let isExternal = false;

  if (!toAccountId && params.recipientAccountNumber) {
    const { data: recipientAccount, error: lookupError } = await getAdminClient()
      .from('accounts')
      .select('id, user_id')
      .eq('account_number', params.recipientAccountNumber)
      .eq('status', 'active')
      .maybeSingle();

    if (lookupError) {
      console.error('[atomicTransfer] Recipient lookup error:', lookupError.message);
      return { success: false, error: 'Unable to verify recipient account. Please try again.' };
    }

    if (!recipientAccount) {
      isExternal = true;
      toAccountId = undefined;
    } else {
      toAccountId = (recipientAccount as Record<string, unknown>).id as string;
      if (toAccountId === params.fromAccountId) {
        return { success: false, error: 'Cannot transfer to your own account' };
      }
    }
  }

  tx.addStep({
    name: 'Deduct from sender account',
    execute: async () => {
      const result = await atomicBalanceUpdate(params.fromAccountId, -params.amount, `Debit: ${params.description}`);
      if (!result.success) throw new Error(result.error || 'Failed to deduct balance');
      return result;
    },
    rollback: async () => {
      await atomicBalanceUpdate(params.fromAccountId, params.amount, `Rollback: ${params.description}`);
    }
  });

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

      if (toAccountId && !isExternal) {
        const { data: recipientAccount, error: recipientError } = await getAdminClient()
          .from('accounts').select('user_id').eq('id', toAccountId).maybeSingle();
        if (recipientError) {
          console.error('[atomicTransfer] Recipient user lookup error:', recipientError.message);
        }
        if (recipientAccount) {
          insertData.to_user_id = (recipientAccount as Record<string, unknown>).user_id;
        }
      }

      const { data, error } = await getAdminClient()
        .from('transactions').insert(insertData).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Failed to create transaction record');
      txState.createdTransaction = data;
      return data;
    },
    rollback: async () => {
      if (txState.createdTransaction) {
        await getAdminClient().from('transactions').delete().eq('id', txState.createdTransaction.id);
      }
    }
  });

  if (toAccountId && !isExternal) {
    tx.addStep({
      name: 'Credit recipient account',
      execute: async () => {
        const result = await atomicBalanceUpdate(toAccountId!, params.amount, `Credit: ${params.description}`);
        if (!result.success) throw new Error(result.error || 'Failed to credit balance');
        return result;
      },
      rollback: async () => {
        await atomicBalanceUpdate(toAccountId!, -params.amount, `Rollback: ${params.description}`);
      }
    });
  }

  const result = await tx.execute();
  if (result.success) {
    return { success: true, transaction: txState.createdTransaction ?? undefined, isExternal };
  } else {
    return { success: false, error: result.error || 'Transfer failed', isExternal };
  }
}
