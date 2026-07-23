import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, PieChart, BarChart3, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/queryClient';

interface InvestmentData {
  accounts: Array<{ id: string; balance: string; accountType: string; accountNumber: string }>;
}

interface MarketRate { change: number; trending: 'up' | 'down'; }
interface MarketData { stocks: MarketRate; bonds: MarketRate; crypto: MarketRate; forex: MarketRate; }

export default function Investment() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');

  const { data: investmentData, isLoading, error } = useQuery<InvestmentData>({
    queryKey: ['/api/investments', userProfile?.id],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/investments');
      if (!response.ok) throw new Error('Failed to fetch investments');
      return response.json();
    },
    enabled: !!userProfile?.id,
    staleTime: 30000
  });

  const { data: marketData, error: marketError } = useQuery<MarketData>({
    queryKey: ['/api/market-rates'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/market-rates');
      if (!response.ok) throw new Error('Failed to fetch market rates');
      return response.json();
    },
    staleTime: 60000,
    refetchInterval: 60000
  });

  const { toast } = useToast();
  const queryError = error || marketError;
  useEffect(() => {
    if (queryError) toast({ title: 'Error loading data', variant: 'destructive' });
  }, [queryError, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalValue = investmentData?.accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance || '0'), 0) ?? 0;
  const marketItems = marketData ? [
    { name: 'Stocks', data: marketData.stocks },
    { name: 'Bonds', data: marketData.bonds },
    { name: 'Crypto', data: marketData.crypto },
    { name: 'Forex', data: marketData.forex },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as any} />
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold mb-6">Investment Portfolio</h1>
        <Card className="mb-4">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Portfolio Value</p>
            <p className="text-3xl font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <div className="flex gap-2 mb-4">
          {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
            <Button key={tf} variant={selectedTimeframe === tf ? 'default' : 'outline'} size="sm" onClick={() => setSelectedTimeframe(tf)}>{tf}</Button>
          ))}
        </div>
        {marketItems.length > 0 && (
          <Card className="mb-4">
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />Market Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {marketItems.map((item) => (
                  <div key={item.name} className="p-3 border rounded-lg">
                    <p className="text-sm text-gray-500">{item.name}</p>
                    <p className={`font-semibold flex items-center gap-1 ${item.data.trending === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.data.trending === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {item.data.change > 0 ? '+' : ''}{item.data.change}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" />Your Accounts</CardTitle></CardHeader>
          <CardContent>
            {investmentData?.accounts?.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No investment accounts yet</p>
            ) : (
              <div className="space-y-2">
                {investmentData?.accounts?.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><p className="font-medium">{acc.accountType}</p><p className="text-sm text-gray-500">{acc.accountNumber}</p></div>
                    <p className="font-semibold">${parseFloat(acc.balance).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Button className="w-full mt-4" onClick={() => setLocation('/investment-portfolio')}>
          <BarChart3 className="w-4 h-4 mr-2" />View Detailed Portfolio
        </Button>
      </div>
      <BottomNavigation />
    </div>
  );
}
