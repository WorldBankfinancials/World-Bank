import { useState } from "react";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Account {
  id: number;
  userId: number;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'investment';
  accountName: string;
  balance: string;
  currency: string;
  isActive: boolean;
}

interface AccountManagementProps {
  onBack: () => void;
}

export default function AdminAccountManagement({ onBack }: AccountManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/accounts');
      return response.ok ? response.json() : [];
    }
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    userId: 1,
    accountType: 'checking' as 'checking' | 'savings' | 'investment',
    accountName: '',
    balance: '0.00',
    currency: 'USD'
  });

  const generateAccountNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `4789-6523-${timestamp.slice(0, 4)}-${random}`;
  };

  const handleCreateAccount = async () => {
    try {
      const accountData = {
        ...formData,
        accountNumber: generateAccountNumber(),
        isActive: true
      };

      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
        setShowCreateForm(false);
        setFormData({
          userId: 1,
          accountType: 'checking',
          accountName: '',
          balance: '0.00',
          currency: 'USD'
        });
        toast({
          title: 'Account Created',
          description: 'New account has been created successfully.',
        });
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;

    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/accounts/${editingAccount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: editingAccount.accountName,
          balance: editingAccount.balance,
          isActive: editingAccount.isActive
        })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
        setEditingAccount(null);
        toast({
          title: 'Account Updated',
          description: 'Account information has been updated successfully.',
        });
      } else {
        throw new Error('Failed to update account');
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
        toast({
          title: 'Account Deleted',
          description: 'Account has been deleted successfully.',
        });
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Show loading state
  if (accountsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Account Management</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Customer Accounts</h2>
        <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Account
        </Button>
      </div>

      <div className="grid gap-4 mb-6">
        {(accounts as Account[]).map((account: Account) => (
          <Card key={account.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{account.accountName}</h3>
                  <p className="text-sm text-gray-600">
                    {account.accountNumber} • {account.accountType.toUpperCase()}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {account.currency} {parseFloat(account.balance).toLocaleString()}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {account.isActive ? t('account_active') : t('account_inactive')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingAccount(account)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteAccount(account.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Account Type</Label>
                <Select value={formData.accountType} onValueChange={(value: any) =>
                  setFormData(prev => ({ ...prev, accountType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Account Name</Label>
                <Input
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="e.g., Primary Checking"
                />
              </div>

              <div>
                <Label>Initial Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateAccount} className="flex-1 bg-blue-600">
                  Create
                </Button>
                <Button onClick={() => setShowCreateForm(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Account Name</Label>
                <Input
                  value={editingAccount.accountName}
                  onChange={(e) => setEditingAccount({ ...editingAccount, accountName: e.target.value })}
                />
              </div>

              <div>
                <Label>Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingAccount.balance}
                  onChange={(e) => setEditingAccount({ ...editingAccount, balance: e.target.value })}
                />
              </div>

              <div>
                <Label>{t('account_active')}</Label>
                <Select value={editingAccount.isActive ? "true" : "false"} onValueChange={(value) =>
                  setEditingAccount({ ...editingAccount, isActive: value === "true" })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t('account_active')}</SelectItem>
                    <SelectItem value="false">{t('account_inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleEditAccount} className="flex-1 bg-blue-600">
                  Update
                </Button>
                <Button onClick={() => setEditingAccount(null)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
