import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, DollarSign, FileText, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

interface Account {
  id: number;
  accountType: string;
  accountName: string;
  accountNumber: string;
  balance: string;
}

export default function AdminTransactionCreator() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('admin');
  const [recipientName, setRecipientName] = useState('');
  const [bankName, setBankName] = useState('');
  const [reference, setReference] = useState('');
  const [redirectPage, setRedirectPage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      // console.error('Failed to fetch accounts:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateTransaction = async () => {
    if (!selectedAccountId || !amount || !description) {
      // console.warn('Missing required fields for transaction creation');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      // console.warn('Invalid amount for transaction');
      return;
    }

    setIsProcessing(true);

    try {
      // Create transaction using account-specific endpoint
      const response = await fetch(`/api/admin/accounts/${selectedAccountId}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numAmount.toString(),
          description: description,
          type: transactionType
        })
      });

      if (response.ok) {
        const result = await response.json();
        // console.log(`Transaction created successfully: ${transactionType.toUpperCase()} $${numAmount.toLocaleString()}`);
        
        // Reset form
        setSelectedAccountId('');
        setAmount('');
        setDescription('');
        setRecipientName('');
        setBankName('');
        setReference('');
        
        // Navigate to specified page if selected
        if (redirectPage) {
          setTimeout(() => {
            setLocation(redirectPage);
          }, 1500); // Brief delay to show success message
        }
        
        // Refresh accounts to show updated balances
        fetchAccounts();
      } else {
        throw new Error('Failed to create transaction');
      }
    } catch (error) {
      // console.error('Transaction creation error:', error);
      // console.error('Failed to create transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id.toString() === selectedAccountId);
  
  const categories = [
    { value: 'admin', label: 'Admin Adjustment' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'fee', label: 'Fee' },
    { value: 'dividend', label: 'Dividend' },
    { value: 'interest', label: 'Interest' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'refund', label: 'Refund' },
    { value: 'correction', label: 'Correction' }
  ];

  const redirectOptions = [
    { value: '', label: 'Stay on this page' },
    { value: '/dashboard', label: 'Customer Dashboard' },
    { value: '/history', label: 'Transaction History' },
    { value: '/cards', label: 'Cards Page' },
    { value: '/transfer', label: 'Transfer Page' },
    { value: '/simple-admin', label: 'Admin Panel' },
    { value: '/profile-settings', label: 'Profile Settings' },
    { value: '/accounts', label: 'Account Management' },
    { value: '/statements-reports', label: 'Statements & Reports' },
    { value: '/investment-portfolio', label: 'Investment Portfolio' },
    { value: '/banking-services', label: 'Banking Services' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction Creator</h1>
            <p className="text-gray-600 mt-1">Create transactions for specific customer accounts</p>
          </div>
          <Badge variant="outline" className="bg-purple-50">
            Admin Tool
          </Badge>
        </div>

        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map(account => (
            <Card key={account.id} className={`cursor-pointer transition-all ${
              selectedAccountId === account.id.toString() ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
            }`}>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-900">{account.accountName}</div>
                <div className="text-xs text-gray-500 mb-2">****{account.accountNumber.slice(-4)}</div>
                <div className="text-lg font-bold text-green-600">
                  ${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500 capitalize">{account.accountType}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transaction Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="account">Target Account *</Label>
                  <select
                    id="account"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id.toString()}>
                        {account.accountName} - ****{account.accountNumber.slice(-4)} (${parseFloat(account.balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="type">Transaction Type *</Label>
                  <select
                    id="type"
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as 'credit' | 'debit')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1"
                  >
                    <option value="credit">Credit (Add Money)</option>
                    <option value="debit">Debit (Remove Money)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (USD) *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="Transaction description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="recipient">Recipient Name (Optional)</Label>
                  <Input
                    id="recipient"
                    placeholder="Recipient name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bank">Bank Name (Optional)</Label>
                  <Input
                    id="bank"
                    placeholder="Bank name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="reference">Reference Number (Optional)</Label>
                  <Input
                    id="reference"
                    placeholder="REF-"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="redirect">Navigate to Page After Transaction</Label>
                  <select
                    id="redirect"
                    value={redirectPage}
                    onChange={(e) => setRedirectPage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1"
                  >
                    {redirectOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose where to navigate after the transaction is created
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Preview */}
            {selectedAccount && amount && description && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium mb-3">Transaction Preview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Account:</span>
                    <p className="font-medium">{selectedAccount.accountName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Balance:</span>
                    <p className="font-medium">${parseFloat(selectedAccount.balance).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Transaction:</span>
                    <p className={`font-medium ${transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transactionType === 'credit' ? '+' : '-'}${parseFloat(amount || '0').toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">New Balance:</span>
                    <p className="font-medium text-blue-600">
                      ${(parseFloat(selectedAccount.balance) + (transactionType === 'credit' ? parseFloat(amount || '0') : -parseFloat(amount || '0'))).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateTransaction}
                disabled={!selectedAccountId || !amount || !description || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Transaction
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
