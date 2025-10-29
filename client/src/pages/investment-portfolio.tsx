import type { User } from "@shared/schema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";


export default function InvestmentPortfolio() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch real investment data from backend
  const { data: investments = [], isLoading: investmentsLoading } = useQuery<any[]>({
    queryKey: ['/api/investments'],
    staleTime: 30000,
  });

  // Real-time subscription for investment updates
  useEffect(() => {
    const channel = supabase
      .channel('investment-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'investments'
      }, () => {
        console.log('🔄 Investment data changed, refreshing...');
        queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate real portfolio metrics
  const totalValue = investments.reduce((sum, inv) => sum + parseFloat(inv.total_value || inv.totalValue || 0), 0);
  const totalGainLoss = investments.reduce((sum, inv) => sum + parseFloat(inv.gain_loss || inv.gainLoss || 0), 0);
  // Guard against division by zero: use cost basis (totalValue - totalGainLoss)
  const costBasis = totalValue - totalGainLoss;
  const gainLossPercent = costBasis > 0 ? (totalGainLoss / costBasis) * 100 : 0;

  if (userLoading || investmentsLoading) {
    return (
      <div className="min-h-screen bg-wb-gray flex items-center justify-center">
        <div className="text-wb-dark">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wb-gray">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold wb-dark">Investment Portfolio</h1>
          <p className="text-wb-text mt-2">Track your investment performance and holdings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-wb-text">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold wb-dark">{formatCurrency(totalValue)}</div>
              <div className="flex items-center mt-2">
                {gainLossPercent >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${gainLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}% Total
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-wb-text">Total Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalGainLoss))}
              </div>
              <div className="flex items-center mt-2">
                {gainLossPercent >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${gainLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-wb-text">Total Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold wb-dark">{investments.length}</div>
              <p className="text-sm text-wb-text mt-2">Active investments</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Current Holdings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investments.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No investments yet</p>
                  <p className="text-sm text-gray-400 mt-2">Start building your portfolio today</p>
                </div>
              ) : (
                investments.map((investment: any) => {
                  const symbol = investment.symbol || 'N/A';
                  const name = investment.name || 'Unknown';
                  const quantity = parseFloat(investment.quantity || 0);
                  const currentPrice = parseFloat(investment.current_price || investment.currentPrice || 0);
                  const totalValue = parseFloat(investment.total_value || investment.totalValue || 0);
                  const gainLoss = parseFloat(investment.gain_loss || investment.gainLoss || 0);
                  const gainLossPercent = parseFloat(investment.gain_loss_percent || investment.gainLossPercent || 0);

                  return (
                    <div key={investment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-wb-blue-light rounded-full flex items-center justify-center">
                          <span className="font-bold wb-blue">{symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold wb-dark">{symbol}</p>
                          <p className="text-sm text-wb-text">{name}</p>
                          <p className="text-sm text-wb-text">{quantity} shares</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold wb-dark">{formatCurrency(currentPrice)}</p>
                        <div className={`flex items-center justify-end ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gainLoss >= 0 ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          <span className="text-sm">
                            {gainLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(gainLoss))} ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                          </span>
                        </div>
                        <p className="text-sm text-wb-text">
                          Value: {formatCurrency(totalValue)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
