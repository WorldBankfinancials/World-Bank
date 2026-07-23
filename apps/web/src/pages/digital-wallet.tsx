import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Wallet, Send, Download, Eye, EyeOff, History, Settings, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/queryClient";

interface WalletTransaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  status: string;
  type: string;
}

export default function DigitalWallet() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showBalance, setShowBalance] = useState(true);

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const { data: walletData, error: walletError } = useQuery<{ balance: number }>({
    queryKey: ['/api/wallet-balance'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/wallet-balance');
      if (!response.ok) throw new Error('Failed to fetch wallet balance');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000
  });

  const { data: recentTransactions = [], error: transactionsError } = useQuery<WalletTransaction[]>({
    queryKey: ['/api/wallet-transactions'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/wallet-transactions');
      if (!response.ok) throw new Error('Failed to fetch wallet transactions');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000
  });

  useEffect(() => {
    if (error) toast({ title: 'Error loading data', variant: 'destructive' });
  }, [error, toast]);
  useEffect(() => {
    if (walletError) toast({ title: 'Error loading wallet balance', variant: 'destructive' });
  }, [walletError, toast]);
  useEffect(() => {
    if (transactionsError) toast({ title: 'Error loading transactions', variant: 'destructive' });
  }, [transactionsError, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const balance = walletData?.balance ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold mb-6">Digital Wallet</h1>
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Wallet Balance</p>
                <p className="text-3xl font-bold">
                  {showBalance ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '******'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3" onClick={() => navigate('/transfer-funds')}>
            <Send className="w-5 h-5" /><span className="text-xs">Send</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3" onClick={() => navigate('/add-money')}>
            <Download className="w-5 h-5" /><span className="text-xs">Receive</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3" onClick={() => navigate('/transaction-history')}>
            <History className="w-5 h-5" /><span className="text-xs">History</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3" onClick={() => navigate('/account-preferences')}>
            <Settings className="w-5 h-5" /><span className="text-xs">Settings</span>
          </Button>
        </div>
        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx: WalletTransaction) => (
                  <div key={tx.id} className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.type === 'credit' ? <ArrowDownRight className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-xs">{tx.status}</Badge>
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
