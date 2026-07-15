import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, Calendar, Download, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Transaction {
  id: number;
  accountId: number;
  type: 'credit' | 'debit';
  amount: string;
  description: string;
  category: string;
  date: string;
  status: string;
  recipientName?: string;
  bankName?: string;
  createdAt: string;
}

interface Account {
  id: number;
  accountType: string;
  accountName: string;
  accountNumber: string;
  balance: string;
}

export default function History() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch accounts with React Query
  const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to load accounts');
      return response.json();
    }
  });

  // Fetch transactions with React Query
  const { data: transactions = [], isLoading: loading, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', accounts],
    queryFn: async () => {
      if (accounts.length === 0) return [];
      
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const accountPromises = accounts.map(account => 
          authenticatedFetch(`/api/accounts/${account.id}/transactions`).then(async res => {
            if (!res.ok) throw new Error(`Failed to fetch transactions for account ${account.id}`);
            return res.json();
          })
        );
        
        const allTransactionArrays = await Promise.all(accountPromises);
        const allTransactions = allTransactionArrays.flat();
        
        // Sort by date (newest first)
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return allTransactions;
      } catch (error) {
        toast({
          title: 'Error loading transactions',
          description: 'Unable to load transaction history. Please try again.',
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: accounts.length > 0
  });

  // Show errors
  useEffect(() => {
    if (accountsError) {
      toast({
        title: 'Error loading accounts',
        description: 'Unable to load your accounts. Please try again.',
        variant: 'destructive',
      });
    }
  }, [accountsError, toast]);

  // Refresh handler - invalidate query cache
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
  };

  const handleExport = async () => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/transactions/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: 'Export started', description: 'Your transactions are downloading.' });
      } else {
        toast({ title: 'Export Failed', description: 'Failed to export transactions.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'An error occurred during export.', variant: 'destructive' });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.amount.includes(searchTerm) ||
                         (transaction.recipientName && transaction.recipientName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAccount = selectedAccount === 'all' || transaction.accountId.toString() === selectedAccount;
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    
    return matchesSearch && matchesAccount && matchesCategory;
  });

  const getAccountName = (accountId: number | undefined) => {
    if (!accountId) return 'My Account';
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.accountName : `Account ${accountId}`;
  };

  const formatAmount = (amount: string, type: 'credit' | 'debit') => {
    const numAmount = parseFloat(amount) || 0;
    if (isNaN(numAmount)) return `$0.00`;
    const sign = type === 'credit' ? '+' : '-';
    return `${sign}$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    switch (category.toLowerCase()) {
      case 'transfer': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'dividend': return 'bg-green-100 text-green-800';
      case 'fee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = ['all', ...Array.from(new Set(transactions.map(t => t.category).filter(cat => cat)))];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 mt-1">View all your transactions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('search_transactions')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('all_accounts')}</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id.toString()}>
                    {account.accountName} (****{account.accountNumber.slice(-4)})
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('all_categories')}</option>
                {categories.filter(cat => cat !== 'all' && cat).map(category => (
                  <option key={category} value={category}>
                    {category && typeof category === 'string' ? (category.charAt(0).toUpperCase() + category.slice(1)) : 'Other'}
                  </option>
                ))}
              </select>

              <Button variant="outline" className="w-full" onClick={() => toast({ title: 'Date filtering coming soon' })}>
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Credits</div>
              <div className="text-2xl font-bold text-green-600">
                ${filteredTransactions
                  .filter(t => t.type === 'credit')
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Debits</div>
              <div className="text-2xl font-bold text-red-600">
                ${filteredTransactions
                  .filter(t => t.type === 'debit')
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Transactions</span>
              <Badge variant="outline">{filteredTransactions.length} transactions</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">{t('loading_transactions')}</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('no_transactions_found')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction, index) => (
                  <div key={`${transaction.id}-${transaction.createdAt}-${index}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                          <Badge className={getCategoryColor(transaction.category)}>
                            {transaction.category}
                          </Badge>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Account: {getAccountName(transaction.accountId)}</p>
                          <p>Date: {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</p>
                          {transaction.recipientName && (
                            <p>Recipient: {transaction.recipientName}</p>
                          )}
                          {transaction.bankName && (
                            <p>Bank: {transaction.bankName}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }">
                          {formatAmount(transaction.amount, transaction.type)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {transaction.id}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
