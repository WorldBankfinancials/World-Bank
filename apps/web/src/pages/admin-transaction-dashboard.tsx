import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, RefreshCw, Search } from 'lucide-react';
import { authenticatedFetch } from '@/lib/queryClient';

interface Transaction {
  id: string;
  amount: number | string;
  description?: string;
  type: string;
  transactionType?: string;
  category?: string;
  status: string;
  createdAt?: string;
  created_at?: string;
  customer_name?: string;
  recipientName?: string;
  account_number?: string;
}

export default function AdminTransactionDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/admin/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });

  useEffect(() => {
    if (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
  }, [error, toast]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
  };

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter((tx: Transaction) => {
      const name = tx.customer_name || tx.recipientName || '';
      const acct = tx.account_number || '';
      const desc = tx.description || '';
      return name.toLowerCase().includes(term) ||
             acct.toLowerCase().includes(term) ||
             desc.toLowerCase().includes(term);
    });
  }, [transactions, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'success': return 'bg-green-100 text-green-800';
      case 'pending': case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'reversed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transaction Dashboard</h1>
            <p className="text-gray-600">Monitor all transactions</p>
          </div>
          <Button onClick={handleRefresh} className="bg-blue-600 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search & Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by customer, account, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Recent Transactions ({filteredTransactions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No transactions found</td></tr>
                  ) : (
                    filteredTransactions.map((tx: Transaction) => {
                      const dateStr = tx.createdAt || tx.created_at || '';
                      const date = new Date(dateStr);
                      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
                      return (
                        <tr key={tx.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{tx.customer_name || tx.recipientName || 'N/A'}</td>
                          <td className="p-3 font-medium">${isNaN(amount) ? '0.00' : amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-3"><Badge variant="outline">{tx.transactionType || tx.type || 'transfer'}</Badge></td>
                          <td className="p-3"><Badge className={getStatusColor(tx.status)}>{tx.status}</Badge></td>
                          <td className="p-3 text-sm text-gray-600">{isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
