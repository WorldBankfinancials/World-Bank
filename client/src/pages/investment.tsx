// client/src/pages/investment.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, PieChart, BarChart3, DollarSign, ArrowUpRight, ArrowDownLeft, Globe } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Investment() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();

  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial investment data
  const fetchInvestments = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false });
    
    if (data) setInvestments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvestments();

    // Realtime subscription
    const subscription = supabase
      .channel(`investments-user-${userProfile?.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "investments", filter: `user_id=eq.${userProfile?.id}` },
        (payload) => {
          console.log("Realtime update:", payload);
          setInvestments((prev) => {
            switch (payload.eventType) {
              case "INSERT":
                return [payload.new, ...prev];
              case "UPDATE":
                return prev.map(inv => inv.id === payload.new.id ? payload.new : inv);
              case "DELETE":
                return prev.filter(inv => inv.id !== payload.old.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userProfile?.id]);

  const totalValue = investments.reduce((sum, inv) => sum + Number(inv.current_value ?? inv.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-16 pb-20 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('investment_portfolio') || 'Investment Portfolio'}</h1>
            <p className="text-gray-600">{t('manage_investments') || 'Manage your investments'}</p>
          </div>
          <Button className="bg-blue-600 text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('invest_now') || 'Invest Now'}
          </Button>
        </div>

        {/* Total Portfolio Value */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              <span>{t('total_portfolio_value') || 'Total Portfolio Value'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        {/* Investment List */}
        <div className="space-y-4">
          {loading ? (
            <div>Loading investments...</div>
          ) : investments.length === 0 ? (
            <div>No investments found.</div>
          ) : (
            investments.map(inv => (
              <Card key={inv.id}>
                <CardContent className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{inv.name || inv.description || "Investment"}</h3>
                    <p className="text-sm text-gray-600">{inv.ticker || ""}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${Number(inv.current_value ?? inv.amount ?? 0).toLocaleString()}</div>
                    {inv.change && (
                      <div className={`text-sm flex items-center ${
                        inv.change >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {inv.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownLeft className="w-3 h-3 mr-1" />}
                        {inv.change}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
