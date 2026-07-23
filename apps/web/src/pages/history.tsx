import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, Download, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/queryClient';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';

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

  const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to load accounts');
      return response.json();
    }
  });

  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', accounts],
    queryFn: async () => {
      if (accounts.length === 0) return [];
      const response = await authenticatedFetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to load transactions');
      return response.json();
    },
    enabled: accounts.length > 0
  });

  useEffect(() => {
    if (accountsError) toast({ title: 'Error loading accounts', variant: 'destructive' });
    if (transactionsError) toast({ title: 'Error loading transactions', variant: 'destructive' });
  }, [accountsError, transactionsError, toast]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: Transaction) => {
      const matchesSearch = !searchTerm ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.recipientName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAccount = selectedAccount === 'all' || String(tx.accountId) === selectedAccount;
      const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
      return matchesSearch && matchesAccount && matchesCategory;
    });
  }, [transactions, searchTerm, selectedAccount, selectedCategory]);

  const handleDownload = () => {
    const csv = [
      'id,date,description,amount,type,status,recipient',
      ...filteredTransactions.map((tx: Transaction) =>
        `${tx.id},${tx.date},${tx.description},${tx.amount},${tx.type},${tx.status},${tx.recipientName || ''}`
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAccountName = (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.accountType} (${account.accountNumber})` : 'N/A';
  };

  if (accountsLoading || transactionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions found</p>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx: Transaction) => (
                  <div key={tx.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tx.description || tx.recipientName || 'Transfer'}</p>
                        <p className="text-sm text-gray-500">
                          {getAccountName(tx.accountId)} - {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}
                        </p>
                        {tx.recipientName && <p className="text-xs text-gray-400">To: {tx.recipientName}</p>}
                        {tx.bankName && <p className="text-xs text-gray-400">Bank: {tx.bankName}</p>}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                        </p>
                        <Badge variant="outline" className="text-xs">{tx.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <BottomNavigation />
    </div>
  );
}
