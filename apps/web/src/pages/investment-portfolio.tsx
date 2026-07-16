import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { TrendingUp, TrendingDown, PieChart, DollarSign } from "lucide-react";

interface Investment {
  id: number;
  symbol: string;
  name: string;
  shares: string;
  average_price: string;
  current_price: string;
  asset_type: string;
  status: string;
}

export default function InvestmentPortfolio() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: investments = [], isLoading, error } = useQuery<Investment[]>({
    queryKey: ['/api/investments'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/investments');
      if (!response.ok) return [];
      return response.json();
    }
  });

  useEffect(() => {
    if (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalValue = investments.reduce((sum: number, inv: Investment) =>
    sum + (parseFloat(inv.shares) * parseFloat(inv.current_price)), 0);
  const totalCost = investments.reduce((sum: number, inv: Investment) =>
    sum + (parseFloat(inv.shares) * parseFloat(inv.average_price)), 0);
  const totalGain = totalValue - totalCost;
  const gainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as User | undefined} />
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('investment_portfolio')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">{t('total_portfolio_value')}</p>
            <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Gain/Loss</p>
            <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)} ({gainPercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">{t('investment_portfolio')}</h2>
          </div>
          <div className="p-4">
            {investments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No investments yet</p>
            ) : (
              <div className="space-y-3">
                {investments.map((inv: Investment) => {
                  const value = parseFloat(inv.shares) * parseFloat(inv.current_price);
                  const cost = parseFloat(inv.shares) * parseFloat(inv.average_price);
                  const gain = value - cost;
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-semibold">{inv.symbol}</p>
                        <p className="text-sm text-gray-500">{inv.shares} shares @ ${inv.average_price}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${value.toFixed(2)}</p>
                        <p className={`text-sm ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
      </main>
      <BottomNavigation />
    </div>
  );
}
