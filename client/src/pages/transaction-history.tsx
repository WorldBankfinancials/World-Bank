import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ArrowUpRight, ArrowDownRight, Calendar, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
}

interface Account {
  id: number;
  accountName: string;
  accountNumber: string;
  balance: string;
}

export default function TransactionHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/accounts');
      if (!response.ok) return [];
      return response.json().catch(() => []);
    }
  });

  const { data: transactions = [], isLoading: loading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', accounts],
    queryFn: async () => {
      if (accounts.length === 0) return [];
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const accountPromises = accounts.map(account =>
          authenticatedFetch(`/api/accounts/${account.id}/transactions`).then(async res => {
            if (!res.ok) return [];
            return res.json().catch(() => []);
          })
        );
        const allTransactionArrays = await Promise.all(accountPromises);
        return allTransactionArrays.flat();
      } catch (error) {
        toast({
          title: 'Error loading transactions',
          description: 'Unable to load transaction history.',
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: accounts.length > 0
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.amount.includes(searchTerm);
    const matchesAccount = selectedAccount === 'all' || transaction.accountId.toString() === selectedAccount;
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    return matchesSearch && matchesAccount && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(transactions.map(t => t.category)))];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || accountsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="px-4 py-6 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
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
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Recent Transactions ({filteredTransactions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No transactions found</p>
                ) : (
                  filteredTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {tx.type === 'credit' ? (
                            <ArrowDownRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{tx.description}</div>
                          <div className="text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className={`font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                        </div>
                        <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
