import { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Account {
  id: number;
  user_id: number;
  account_number: string;
  account_type: 'checking' | 'savings' | 'investment';
  account_name: string;
  balance: string;
  currency: string;
  is_active: boolean;
}

interface AccountManagementProps {
  onBack: () => void;
}

export default function AdminAccountManagement({ onBack }: AccountManagementProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    user_id: 1, // Example user ID
    account_type: 'checking' as 'checking' | 'savings' | 'investment',
    account_name: '',
    balance: '0.00',
    currency: 'USD'
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from<Account>('accounts')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      alert('Failed to fetch accounts');
      return;
    }
    setAccounts(data || []);
  };

  const generateAccountNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `4789-6523-${timestamp.slice(0, 4)}-${random}`;
  };

  const handleCreateAccount = async () => {
    const accountData = {
      ...formData,
      account_number: generateAccountNumber(),
      is_active: true
    };

    const { data, error } = await supabase
      .from('accounts')
      .insert([accountData])
      .select()
      .single();

    if (error) {
      alert('Failed to create account');
      return;
    }

    setAccounts(prev => [...prev, data]);
    setShowCreateForm(false);
    setFormData({
      user_id: 1,
      account_type: 'checking',
      account_name: '',
      balance: '0.00',
      currency: 'USD'
    });
    alert('Account created successfully!');
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;

    const { data, error } = await supabase
      .from('accounts')
      .update({
        account_name: editingAccount.account_name,
        balance: editingAccount.balance,
        is_active: editingAccount.is_active
      })
      .eq('id', editingAccount.id)
      .select()
      .single();

    if (error) {
      alert('Failed to update account');
      return;
    }

    setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? data : acc));
    setEditingAccount(null);
    alert('Account updated successfully!');
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      alert('Failed to delete account');
      return;
    }

    setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    alert('Account deleted successfully!');
  };

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

      {/* Account List */}
      <div className="grid gap-4 mb-6">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{account.account_name}</h3>
                  <p className="text-sm text-gray-600">
                    {account.account_number} • {account.account_type.toUpperCase()}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {account.currency} {parseFloat(account.balance).toLocaleString()}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {account.is_active ? 'Active' : 'Inactive'}
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

      {/* Create Account Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Account Type</Label>
                <Select value={formData.account_type} onValueChange={(value: any) => 
                  setFormData(prev => ({ ...prev, account_type: value }))
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
                  value={formData.account_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
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
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowCreateForm(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateAccount} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Account Modal */}
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
                  value={editingAccount.account_name}
                  onChange={(e) => setEditingAccount(prev => prev ? 
                    { ...prev, account_name: e.target.value } : null
                  )}
                />
              </div>
              
              <div>
                <Label>Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingAccount.balance}
                  onChange={(e) => setEditingAccount(prev => prev ? 
                    { ...prev, balance: e.target.value } : null
                  )}
                />
              </div>
              
              <div>
                <Label>Status</Label>
                <Select 
                  value={editingAccount.is_active ? 'active' : 'inactive'} 
                  onValueChange={(value) => setEditingAccount(prev => prev ? 
                    { ...prev, is_active: value === 'active' } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setEditingAccount(null)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleEditAccount} className="flex-1 bg-green-600 hover:bg-green-700">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
