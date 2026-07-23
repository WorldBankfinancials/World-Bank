import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpDown, Calculator, Clock, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CurrencyRate {
  code: string;
  name: string;
  flag: string;
}

const FALLBACK_CURRENCIES: CurrencyRate[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'KRW', name: 'Korean Won', flag: '🇰🇷' }
];

export default function Exchange() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('1000');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const { data: exchangeRates, isLoading: ratesLoading, isError: ratesError, refetch } = useQuery<Record<string, number>>({
    queryKey: ['/api/exchange-rates'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/exchange-rates');
      if (!res.ok) throw new Error('Failed to fetch exchange rates');
      return res.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const { data: rateChanges } = useQuery<Record<string, number>>({
    queryKey: ['/api/exchange-rates/changes'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/exchange-rates/changes');
      if (!res.ok) throw new Error('Failed to fetch rate changes');
      return res.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const { data: currencyList } = useQuery<CurrencyRate[]>({
    queryKey: ['/api/currencies'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/currencies');
      if (!res.ok) throw new Error('Failed to fetch currencies');
      return res.json();
    },
    staleTime: 86400000,
  });

  useEffect(() => {
    if (ratesError) {
      toast({ title: 'Error loading exchange rates', variant: 'destructive' });
    }
  }, [ratesError, toast]);

  useEffect(() => {
    if (exchangeRates) {
      setLastUpdated(new Date());
    }
    if (exchangeRates && amount) {
      const parsedAmount = parseFloat(amount) || 0;
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setConvertedAmount(0);
        return;
      }
      const fromRate = exchangeRates[fromCurrency] ?? 1;
      const toRate = exchangeRates[toCurrency] ?? 1;
      const converted = (parsedAmount / fromRate) * toRate;
      setConvertedAmount(isNaN(converted) || !isFinite(converted) ? 0 : converted);
    }
  }, [exchangeRates, fromCurrency, toCurrency, amount]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleRefreshRates = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/exchange-rates'] });
  };

  const handleExchange = async () => {
    const parsedAmount = parseFloat(amount) || 0;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid exchange amount.', variant: 'destructive' });
      return;
    }
    if (convertedAmount <= 0) {
      toast({ title: 'Invalid Exchange', description: 'Unable to calculate exchange rate. Please try again.', variant: 'destructive' });
      return;
    }
    try {
      const response = await authenticatedFetch('/api/currency-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCurrency, toCurrency, amount: parsedAmount }),
      });
      if (response.ok) {
        toast({ title: 'Exchange Successful', description: `Successfully exchanged ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency}` });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: 'Exchange Failed', description: data.error || 'Unable to complete currency exchange.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Exchange Failed', description: 'Network error. Please try again.', variant: 'destructive' });
    }
  };

  if (ratesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currencies = currencyList && currencyList.length > 0 ? currencyList : FALLBACK_CURRENCIES;
  const topRates: [string, number][] = exchangeRates
    ? Object.entries(exchangeRates)
      .filter(([code]) => ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'].includes(code))
      .slice(0, 6) as [string, number][]
    : [];
  const exchangeRateDisplay = parseFloat(amount) > 0
    ? (convertedAmount / parseFloat(amount)).toFixed(4)
    : '0.0000';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as any} />
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold mb-2">{t('currency_exchange') || 'Currency Exchange'}</h1>
        <p className="text-gray-600 mb-6">{t('convert_currencies') || 'Convert currencies with real-time rates'}</p>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              {t('currency_calculator') || 'Currency Calculator'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>From</Label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={handleSwapCurrencies}>
                <ArrowUpDown className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <Label>To</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1" placeholder="0.00" min="0" />
            </div>
            {exchangeRates && (
              <div className="text-sm text-gray-500 space-y-1">
                <p>1 {fromCurrency} = {exchangeRateDisplay} {toCurrency}</p>
                <p className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t('last_updated') || 'Last updated'}: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
                </p>
              </div>
            )}
            <Button onClick={handleExchange} className="w-full bg-blue-600 text-white">
              {t('exchange') || 'Exchange'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('live_rates') || 'Live Exchange Rates'}
              <Badge className="bg-green-100 text-green-800">{t('live') || 'LIVE'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topRates.length === 0 && <p className="text-center text-gray-500 py-4">No rates available</p>}
            <div className="space-y-2">
              {topRates.map(([currency, rate]) => {
                const currencyInfo = currencies.find(c => c.code === currency);
                const change = rateChanges?.[currency];
                const hasChange = typeof change === 'number' && isFinite(change);
                const isPositive = hasChange ? change >= 0 : true;
                return (
                  <div key={currency} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{currencyInfo?.flag}</span>
                      <div>
                        <p className="font-medium">USD/{currency}</p>
                        <p className="text-sm text-gray-500">{currencyInfo?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{rate.toFixed(4)}</p>
                      {hasChange && (
                        <p className={`text-sm flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{change.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshRates} className="w-full mt-4">
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
      <BottomNavigation />
    </div>
  );
}
