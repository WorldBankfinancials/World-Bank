import type { User } from "@/lib/schema";
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
      name: "Debit Card",
      description: "Instant transfer from your debit card",
      icon: CreditCard,
      fee: "Free",
      time: "Instant",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      description: "Transfer from your bank account",
      icon: Building,
      fee: "Free",
      time: "1-3 business days",
    },
    {
      id: "cash_deposit",
      name: "Cash Deposit",
      description: "Deposit cash at World Bank branches",
      icon: Banknote,
      fee: "Free",
      time: "Instant",
    },
    {
      id: "mobile_money",
      name: "Mobile Money",
      description: "Transfer from mobile money services",
      icon: Smartphone,
      fee: "1.5%",
      time: "Instant",
    }
  ];

  const handleAddMoney = async () => {
    if (!selectedMethod || !amount) {
      toast({
        title: "Missing Information",
        description: "Please select a payment method and enter an amount.",
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
        body: JSON.stringify({ method: selectedMethod, amount: parseFloat(amount) })
      });

      if (!response.ok) throw new Error('Failed to add money');

      toast({
        title: "Success",
        description: `Successfully added $${amount} via ${selectedMethod}`,
      });
      setAmount("");
      setSelectedMethod("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add money. Please try again.",
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
            <h1 className="text-2xl font-bold mb-2">Add Money</h1>
            <p className="text-gray-600">Add funds to your World Bank account</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <span>Select Amount</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder="Enter custom amount"
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
                <span>Payment Method</span>
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
