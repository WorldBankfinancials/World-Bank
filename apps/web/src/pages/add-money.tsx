import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Banknote, Building, Smartphone, Plus, CheckCircle, Clock, Wallet, ArrowUpRight } from "lucide-react";

export default function AddMoney() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  const quickAmounts = ["50", "100", "250", "500", "1000", "2500"];

  const addMoneyMethods = [
    {
      id: "debit_card",
      name: t('debit_card'),
      description: t('debit_card_desc'),
      icon: CreditCard,
      fee: t('free'),
      time: t('instant'),
    },
    {
      id: "bank_transfer",
      name: t('bank_transfer'),
      description: t('bank_transfer_desc'),
      icon: Building,
      fee: t('free'),
      time: t('one_to_three_business_days'),
    },
    {
      id: "cash_deposit",
      name: t('cash_deposit'),
      description: t('cash_deposit_desc'),
      icon: Banknote,
      fee: t('free'),
      time: t('instant'),
    },
    {
      id: "mobile_money",
      name: t('mobile_money'),
      description: t('mobile_money_desc'),
      icon: Smartphone,
      fee: t('one_point_five_percent'),
      time: t('instant'),
    }
  ];

  const handleAddMoney = async () => {
    if (!selectedMethod || !amount) {
      toast({
        title: t('missing_information'),
        description: t('select_payment_and_amount'),
        variant: "destructive",
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: t('invalid_amount'),
        description: t('enter_valid_amount'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/add-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selectedMethod, amount: parsedAmount })
      });

      if (!response.ok) throw new Error('Failed to add money');

      // Invalidate wallet balance and related queries to refresh the UI
      const { queryClient } = await import('@/lib/queryClient');
      queryClient.invalidateQueries({ queryKey: ['/api/wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });

      toast({
        title: t('success'),
        description: `${t('add_money_success')} ${amount} ${t('add_money_via')} ${selectedMethod}`,
      });
      setAmount("");
      setSelectedMethod("");
    } catch (error) {
      toast({
        title: t('error'),
        description: t('add_money_failed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="px-4 py-6 pb-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{t('add_money')}</h1>
            <p className="text-gray-600">{t('add_funds_to_account')}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <span>{t('select_amount')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder={t('enter_custom_amount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant={amount === amt ? "default" : "outline"}
                    onClick={() => setAmount(amt)}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span>{t('payment_method')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {addMoneyMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <method.icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-green-600">{method.fee}</div>
                      <div className="text-gray-500">{method.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            onClick={handleAddMoney}
            disabled={!selectedMethod || !amount || loading}
            className="w-full bg-blue-600 text-white h-12"
            size="lg"
          >
            {loading ? "Processing..." : `Add $${amount || "0.00"}`}
          </Button>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}