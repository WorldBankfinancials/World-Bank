import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, ArrowUpRight, ArrowDownRight, Calendar, FileText, TrendingUp, RefreshCw, Plus, DollarSign, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, Transaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface TransactionFormData {
  amount: string;
  type: 'credit' | 'debit';
  description: string;
  category: string;
  adminNotes: string;
}

export default function TransactionHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/accounts', '1', 'transactions'],
    enabled: !!user?.id,
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    type: 'credit',
    description: '',
    category: 'general',
    adminNotes: ''
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await fetch('/api/admin/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          accountId: 1,
          amount: parseFloat(data.amount),
          type: data.type,
          description: data.description,
          category: data.category,
          adminNotes: data.adminNotes,
          status: 'completed'
        }),
      });
      if (!response.ok) throw new Error('Failed to create transaction');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Created",
        description: "Transaction has been successfully created and processed.",
      });
      setIsCreateDialogOpen(false);
      setFormData({
        amount: '',
        type: 'credit',
        description: '',
        category: 'general',
        adminNotes: ''
      });
      refetchTransactions();
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportTransactions = () => {
    if (!transactions || transactions.length === 0) {
      toast({
        title: "No Data",
        description: "No transactions available to export.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Date', 'Description', 'Category', 'Type', 'Amount', 'Status'].join(','),
      ...transactions.map(t => [
        new Date(t.createdAt || new Date()).toLocaleDateString(),
        `"${t.description || ''}"`,
        t.category || 'General',
        t.type === 'credit' ? 'Credit' : 'Debit',
        t.amount || '0',
        t.status || 'pending'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Transaction history has been exported successfully.",
    });
  };

  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesStatus = filterStatus === "all" || (transaction.status || '').toLowerCase() === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getStatusIcon = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: string | number, type: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount || 0);
    return type === 'credit' ? `+${formatted}` : `-${formatted}`;
  };

  const calculateTotals = () => {
    const credits = filteredTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    const debits = filteredTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    return { credits, debits, net: credits - debits };
  };

  const totals = calculateTotals();

  if (isLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading transaction history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="px-4 py-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-sm text-gray-600 mt-1">Comprehensive transaction management and reporting</p>
          </div>
          <div className="flex space-x-2">
            {user?.role === 'admin' && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Create Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Transaction</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={formData.type} onValueChange={(value: 'credit' | 'debit') => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit">Credit (+)</SelectItem>
                            <SelectItem value="debit">Debit (-)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="Transaction description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="fees">Fees</SelectItem>
                          <SelectItem value="bonus">Bonus</SelectItem>
                          <SelectItem value="withdrawal">Withdrawal</SelectItem>
                          <SelectItem value="deposit">Deposit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Admin Notes</Label>
                      <Textarea
                        placeholder="Internal notes (optional)"
                        value={formData.adminNotes}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => createTransactionMutation.mutate(formData)}
                        disabled={!formData.amount || !formData.description || createTransactionMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createTransactionMutation.isPending ? 'Creating...' : 'Create Transaction'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button size="sm" variant="outline" onClick={exportTransactions}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetchTransactions()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Credits</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totals.credits.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Debits</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${totals.debits.toLocaleString()}
                  </p>
                </div>
                <ArrowUpRight className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Balance</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${totals.net.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credits</SelectItem>
                    <SelectItem value="debit">Debits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Last 30 Days
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Try adjusting your search criteria.' 
                    : 'No transactions have been recorded yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction, index) => (
                  <div key={transaction.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownRight className="w-6 h-6 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{transaction.category || 'General'}</Badge>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(transaction.status || '')}
                              <Badge className={getStatusColor(transaction.status || '')}>
                                {(transaction.status || 'pending').charAt(0).toUpperCase() + (transaction.status || 'pending').slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(transaction.createdAt || new Date()).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatAmount(transaction.amount || '0', transaction.type)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                        </p>
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