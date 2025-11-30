
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
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Exchange() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('1000');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const queryClient = useQueryClient();

  // Fetch live exchange rates from Supabase/API
  const { data: exchangeRates, isLoading: ratesLoading, refetch } = useQuery<Record<string, number>>({
    queryKey: ['/api/exchange-rates'],
    staleTime: 30000, // 30 seconds cache
    refetchInterval: 60000 // Auto refresh every minute
  });

  // Calculate converted amount
  useEffect(() => {
    if (exchangeRates && amount) {
      const parsedAmount = parseFloat(amount) || 0;
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setConvertedAmount(0);
        return;
      }
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[toCurrency] || 1;
      const converted = (parsedAmount / fromRate) * toRate;
      setConvertedAmount(isNaN(converted) ? 0 : converted);
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
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid exchange amount.',
        variant: 'destructive'
      });
      return;
    }
    
    if (convertedAmount <= 0) {
      toast({
        title: 'Invalid Exchange',
        description: 'Unable to calculate exchange rate. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/currency-exchange', {
        userId: userProfile?.id,
        fromCurrency,
        toCurrency,
        amount: parsedAmount,
        exchangeRate: convertedAmount / parsedAmount
      });

      if (response.ok) {
        toast({
          title: 'Exchange Successful',
          description: `Successfully exchanged ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency}`
        });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }
    } catch (error) {
      toast({
        title: 'Exchange Failed',
        description: 'Unable to complete currency exchange. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Fetch currencies from API
  const { data: currencyList = [] } = useQuery<any[]>({
    queryKey: ['/api/currencies'],
    staleTime: 86400000
  });
  
  // Show loading state
  if (ratesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading exchange rates...</p>
        </div>
      </div>
    );
  }

  const currencies = currencyList.length > 0 ? currencyList : [
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

  const topRates: [string, number][] = exchangeRates ? Object.entries(exchangeRates)
    .filter(([code]) => ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'].includes(code))
    .slice(0, 6) as [string, number][] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-16 pb-20">
        {/* Page Header */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('currency_exchange') || 'Currency Exchange'}</h1>
              <p className="text-gray-600">{t('convert_currencies') || 'Convert currencies with real-time rates'}</p>
            </div>
            <Button onClick={handleRefreshRates} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${ratesLoading ? 'animate-spin' : ''}`} />
              {t('refresh') || 'Refresh'}
            </Button>
          </div>

          {/* Exchange Calculator */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span>{t('currency_calculator') || 'Currency Calculator'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* From Currency */}
              <div className="space-y-2">
                <Label>{t('from') || 'From'}</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                    placeholder="0.00"
                  />
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleSwapCurrencies}
                  variant="outline" 
                  size="sm"
                  className="rounded-full p-2"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>

              {/* To Currency */}
              <div className="space-y-2">
                <Label>{t('to') || 'To'}</Label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={convertedAmount.toFixed(2)}
                    disabled
                    className="flex-1 bg-gray-50"
                  />
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exchange Rate */}
              {exchangeRates && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">
                    1 {fromCurrency} = {(convertedAmount / parseFloat(amount || '1')).toFixed(4)} {toCurrency}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {t('last_updated') || 'Last updated'}: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleExchange} 
                className="w-full bg-blue-600 text-white"
                disabled={!amount || parseFloat(amount) <= 0}
              >
                {t('exchange_now') || 'Exchange Now'}
              </Button>
            </CardContent>
          </Card>

          {/* Live Exchange Rates */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-green-600" />
                <span>{t('live_rates') || 'Live Exchange Rates'}</span>
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  {t('live') || 'LIVE'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topRates.map(([currency, rate]) => {
                  const currencyInfo = currencies.find(c => c.code === currency);
                  const change = Math.random() * 2 - 1; // Simulate rate change
                  const isPositive = change >= 0;
                  
                  return (
                    <div key={currency} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{currencyInfo?.flag}</span>
                        <div>
                          <div className="font-medium">USD/{currency}</div>
                          <div className="text-sm text-gray-500">{currencyInfo?.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{rate.toFixed(4)}</div>
                        <div className={`text-sm flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {isPositive ? '+' : ''}{change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}