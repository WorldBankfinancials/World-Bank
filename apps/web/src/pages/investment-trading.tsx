import Header from "@/components/Header";
import type { User } from "@packages/shared/schema";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketRate {
  currency: string;
  rate: string;
}

interface Investment {
  id: number;
  symbol: string;
  name: string;
  shares: string;
  average_price: string;
  current_price: string;
  asset_type: string;
}

export default function InvestmentTrading() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const { toast } = useToast();

  const { data: marketRates = [], isLoading: ratesLoading, error: ratesError } = useQuery<MarketRate[]>({
    queryKey: ['/api/market-rates'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/market-rates');
      if (!response.ok) throw new Error('Failed to fetch market rates');
      return response.json();
    }
  });

  const { data: investments = [], isLoading: investmentsLoading, error: investmentsError } = useQuery<Investment[]>({
    queryKey: ['/api/investments'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/investments');
      if (!response.ok) throw new Error('Failed to fetch investments');
      return response.json();
    }
  });

  const isLoading = ratesLoading || investmentsLoading;
  const queryError = ratesError || investmentsError;

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

  const handleTrade = async () => {
    if (!selectedSymbol || !tradeAmount) return;
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const endpoint = tradeType === 'buy' ? '/api/investments/buy' : '/api/investments/sell';
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedSymbol, shares: tradeAmount, price: '100', assetType: 'stock' })
      });

      if (response.ok) {
        toast({ title: `${tradeType === 'buy' ? 'Buy' : 'Sell'} order executed` });
        queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
        setTradeAmount('');
        setSelectedSymbol('');
      } else {
        const errData = await response.json().catch(() => ({}));
        toast({ title: errData.error || 'Trade failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Trade failed. Please try again.', variant: 'destructive' });
    }
  };

  const filteredInvestments = investments.filter((inv: Investment) =>
    !searchQuery || inv.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) || inv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={(userProfile as unknown as User) || undefined} />
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold mb-6">{t('investment_portfolio') || 'Investment Trading'}</h1>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Trade</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setTradeType('buy')} className={`px-4 py-2 rounded-lg font-medium ${tradeType === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Buy</button>
              <button onClick={() => setTradeType('sell')} className={`px-4 py-2 rounded-lg font-medium ${tradeType === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Sell</button>
            </div>
            <input type="text" placeholder="Symbol (e.g. AAPL)" aria-label="Stock symbol" value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <input type="number" placeholder="Shares" aria-label="Number of shares" value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <button onClick={handleTrade} disabled={!selectedSymbol || !tradeAmount} className={`w-full py-2 rounded-lg font-medium text-white ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}>
              {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedSymbol || 'Stock'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Holdings</h2>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search..." className="pl-10 pr-3 py-2 border rounded-lg text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="p-4">
            {filteredInvestments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No holdings</p>
            ) : (
              <div className="space-y-2">
                {filteredInvestments.map((inv: Investment) => {
                  const value = parseFloat(inv.shares) * parseFloat(inv.current_price);
                  const cost = parseFloat(inv.shares) * parseFloat(inv.average_price);
                  const gain = value - cost;
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{inv.symbol}</p>
                        <p className="text-sm text-gray-500">{inv.name} - {inv.shares} shares</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${value.toFixed(2)}</p>
                        <p className={`text-sm flex items-center gap-1 ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gain >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow">
          <div className="p-4 border-b"><h2 className="text-lg font-semibold">Market Rates</h2></div>
          <div className="p-4">
            {marketRates.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No market data available</p>
            ) : (
              <div className="space-y-2">
                {marketRates.map((rate: MarketRate, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">{rate.currency}</span>
                    <span>${rate.rate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
