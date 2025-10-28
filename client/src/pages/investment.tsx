import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownLeft, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';

export default function Investment() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');

  interface InvestmentData {
    accounts: any[];
  }

  interface MarketRate {
    change: number;
    trending: 'up' | 'down';
  }

  interface MarketData {
    stocks: MarketRate;
    bonds: MarketRate;
    crypto: MarketRate;
    forex: MarketRate;
  }

  // Fetch real investment data from Supabase
  const { data: investmentData, isLoading } = useQuery<InvestmentData>({
    queryKey: ['/api/investments', userProfile?.id],
    enabled: !!userProfile?.id,
    staleTime: 30000
  });

  // Fetch live market data
  const { data: marketData } = useQuery<MarketData>({
    queryKey: ['/api/market-rates'],
    staleTime: 60000, // 1 minute cache
    refetchInterval: 60000 // Auto refresh every minute
  });

  const investmentAccounts = investmentData?.accounts || [];
  const totalInvestmentValue = investmentAccounts.reduce((total: number, account: any) => total + account.balance, 0);
  
  const marketRates: MarketData = marketData || {
    stocks: { change: 2.4, trending: 'up' },
    bonds: { change: -0.8, trending: 'down' },
    crypto: { change: 5.2, trending: 'up' },
    forex: { change: 1.1, trending: 'up' }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-16 pb-20">
        {/* Portfolio Overview */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('investment_portfolio') || 'Investment Portfolio'}</h1>
              <p className="text-gray-600">{t('manage_investments') || 'Manage your investment portfolio'}</p>
            </div>
            <Button className="bg-blue-600 text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              {t('invest_now') || 'Invest Now'}
            </Button>
          </div>

          {/* Portfolio Value */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                <span>{t('total_portfolio_value') || 'Total Portfolio Value'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${totalInvestmentValue.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +12.4% (+$2,845)
                </Badge>
                <span className="text-sm text-gray-500">{t('last_30_days') || 'Last 30 days'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Investment Accounts */}
          <div className="space-y-4 mb-6">
            {investmentAccounts.map((account: any, index: number) => (
              <Card key={account.id || index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{account.account_type?.charAt(0).toUpperCase() + account.account_type?.slice(1)} Account</h3>
                        <p className="text-sm text-gray-600">{account.account_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">${account.balance?.toLocaleString()}</div>
                      <div className="text-sm text-green-600 flex items-center">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +{account.interest_rate}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Market Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-green-600" />
                <span>{t('market_overview') || 'Market Overview'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{t('stocks') || 'Stocks'}</span>
                  <div className="flex items-center space-x-1">
                    {marketRates.stocks.trending === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${marketRates.stocks.trending === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {marketRates.stocks.change > 0 ? '+' : ''}{marketRates.stocks.change}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{t('bonds') || 'Bonds'}</span>
                  <div className="flex items-center space-x-1">
                    {marketRates.bonds.trending === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${marketRates.bonds.trending === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {marketRates.bonds.change > 0 ? '+' : ''}{marketRates.bonds.change}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{t('crypto') || 'Crypto'}</span>
                  <div className="flex items-center space-x-1">
                    {marketRates.crypto.trending === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${marketRates.crypto.trending === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {marketRates.crypto.change > 0 ? '+' : ''}{marketRates.crypto.change}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{t('forex') || 'Forex'}</span>
                  <div className="flex items-center space-x-1">
                    {marketRates.forex.trending === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${marketRates.forex.trending === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {marketRates.forex.change > 0 ? '+' : ''}{marketRates.forex.change}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Investment Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('investment_actions') || 'Investment Actions'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex flex-col items-center space-y-2 h-20">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <span className="text-sm">{t('buy_stocks') || 'Buy Stocks'}</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center space-y-2 h-20">
                  <PieChart className="w-6 h-6 text-green-600" />
                  <span className="text-sm">{t('portfolio_review') || 'Portfolio Review'}</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center space-y-2 h-20">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  <span className="text-sm">{t('market_analysis') || 'Market Analysis'}</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center space-y-2 h-20">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                  <span className="text-sm">{t('rebalance') || 'Rebalance'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}