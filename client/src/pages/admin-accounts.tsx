import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    userId: 1, // Liu Wei's user ID
    accountType: 'checking' as 'checking' | 'savings' | 'investment',
    accountName: '',
    balance: '0.00',
    currency: 'USD'
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const accountsData = await response.json();
        setAccounts(accountsData);
      }
    } catch (error) {
      // console.error('Error fetching accounts:', error);
    }
  };

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

      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      });

      if (response.ok) {
        const newAccount = await response.json();
        setAccounts(prev => [...prev, newAccount]);
        setShowCreateForm(false);
        setFormData({
          userId: 1,
          accountType: 'checking',
          accountName: '',
          balance: '0.00',
          currency: 'USD'
        });
        alert('Account created successfully!');
      }
    } catch (error) {
      // console.error('Error creating account:', error);
      alert('Failed to create account');
    }
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;

    try {
      const response = await fetch(`/api/admin/accounts/${editingAccount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: editingAccount.accountName,
          balance: editingAccount.balance,
          isActive: editingAccount.isActive
        })
      });

      if (response.ok) {
        setAccounts(prev => prev.map(acc => 
          acc.id === editingAccount.id ? editingAccount : acc
        ));
        setEditingAccount(null);
        alert('Account updated successfully!');
      }
    } catch (error) {
      // console.error('Error updating account:', error);
      alert('Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const response = await fetch(`/api/admin/accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        alert('Account deleted successfully!');
      }
    } catch (error) {
      // console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
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
                    {account.isActive ? 'Active' : 'Inactive'}
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
                  value={editingAccount.accountName}
                  onChange={(e) => setEditingAccount(prev => prev ? 
                    { ...prev, accountName: e.target.value } : null
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
                  value={editingAccount.isActive ? 'active' : 'inactive'} 
                  onValueChange={(value) => setEditingAccount(prev => prev ? 
                    { ...prev, isActive: value === 'active' } : null
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