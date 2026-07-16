import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, RefreshCw, Search } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  category: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  customer_name: string;
  account_number: string;
}

export default function AdminTransactionDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/transactions');
      return response.ok ? response.json() : [];
    }
  });

  useEffect(() => {
    if (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
  }, [error]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const handleRefresh = async () => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/transactions');
      if (!response.ok) throw new Error('Failed to fetch');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh transactions",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
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
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by customer or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Recent Transactions ({(transactions as Transaction[]).length})</span>
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
                  {(transactions as Transaction[]).length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No transactions</td></tr>
                  ) : (
                    (transactions as Transaction[]).map((tx: Transaction) => (
                      <tr key={tx.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{tx.customer_name}</td>
                        <td className="p-3 font-medium">${tx.amount}</td>
                        <td className="p-3"><Badge variant="outline">{tx.type}</Badge></td>
                        <td className="p-3"><Badge className={getStatusColor(tx.status)}>{tx.status}</Badge></td>
                        <td className="p-3 text-sm text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
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