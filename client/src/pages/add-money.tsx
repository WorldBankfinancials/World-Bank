import type { User } from "@/lib/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { 
  CreditCard, 
  Banknote, 
  Building, 
  Smartphone, 
  Plus, 
  CheckCircle, 
  Shield,
  Clock,
  Wallet,
  ArrowUpRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function AddMoney() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading} = useQuery<User>({
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

  const quickAmounts = ["$50", "$100", "$250", "$500", "$1,000", "$2,500"];

  const addMoneyMethods = [
    {
      id: "debit_card",
      name: "Debit Card",
      description: "Instant transfer from your debit card",
      icon: CreditCard,
      fee: "Free",
      time: "Instant",
      color: "bg-blue-500"
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      description: "Transfer from your bank account",
      icon: Building,
      fee: "Free",
      time: "1-3 business days",
      color: "bg-green-500"
    },
    {
      id: "cash_deposit",
      name: "Cash Deposit",
      description: "Deposit cash at World Bank branches",
      icon: Banknote,
      fee: "Free",
      time: "Instant",
      color: "bg-yellow-500"
    },
    {
      id: "mobile_money",
      name: "Mobile Money",
      description: "Transfer from mobile money services",
      icon: Smartphone,
      fee: "1.5%",
      time: "Instant",
      color: "bg-purple-500"
    }
  ];

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDeposits() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: bankUser } = await supabase
          .from('bank_users')
          .select('id')
          .eq('supabase_user_id', authUser.id)
          .single();

        if (bankUser) {
          const { data: accounts } = await supabase
            .from('bank_accounts')
            .select('id')
            .eq('user_id', bankUser.id);

          if (accounts && accounts.length > 0) {
            const { data: deposits } = await supabase
              .from('transactions')
              .select('*')
              .eq('to_account_id', accounts[0].id)
              .eq('transaction_type', 'deposit')
              .order('created_at', { ascending: false })
              .limit(5);

            setRecentTransactions(deposits?.map(d => ({
              method: d.description || 'Debit Card',
              amount: `$${parseFloat(d.amount || '0').toFixed(2)}`,
              time: new Date(d.created_at).toLocaleDateString(),
              status: d.status === 'completed' ? 'Completed' : 'Pending'
            })) || []);
          }
        }
      } catch (error) {
        console.error('Error fetching deposits:', error);
      }
    }

    fetchDeposits();
  }, []);

  const handleAddMoney = async () => {
    if (!selectedMethod || !amount) {
      toast({
        title: 'Missing Information',
        description: 'Please select a payment method and enter an amount.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { data: bankUser } = await supabase
        .from('bank_users')
        .select('id')
        .eq('supabase_user_id', authUser.id)
        .single();

      if (!bankUser) throw new Error('User not found');

      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('user_id', bankUser.id);

      if (!accounts || accounts.length === 0) throw new Error('No account found');

      await supabase
        .from('transactions')
        .insert({
          to_account_id: accounts[0].id,
          amount: parseFloat(amount),
          currency: 'USD',
          transaction_type: 'deposit',
          description: `Add Money via ${selectedMethod}`,
          status: 'completed'
        });

      toast({
        title: 'Money Added',
        description: `Successfully added $${amount} to your account!`,
      });
      setAmount("");
      setSelectedMethod("");
      
      // Invalidate queries to refetch fresh data instead of reloading
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    } catch (error: any) {
      toast({
        title: 'Operation Failed',
        description: error.message || 'Failed to add money. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="px-4 py-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Add Money</h1>
            <p className="text-sm text-gray-600">Fund your account instantly</p>
          </div>
          <Badge className="bg-green-100 text-green-800">
            <Shield className="w-3 h-3 mr-1" />
            Secure
          </Badge>
        </div>

        {/* Current Balance */}
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Current Balance</p>
                <p className="text-2xl font-bold">${user?.balance?.toLocaleString() || '0.00'}</p>
                <p className="text-blue-200 text-sm">Account: 4789-6523-1087-9234</p>
              </div>
              <Wallet className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* Amount Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl text-center font-bold"
            />
            
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.replace('$', ''))}
                  className="text-xs"
                >
                  {quickAmount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Choose Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {addMoneyMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.name)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedMethod === method.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${method.color} rounded-full flex items-center justify-center`}>
                      <method.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{method.fee}</p>
                    <p className="text-xs text-gray-500">{method.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button 
          onClick={handleAddMoney}
          disabled={!selectedMethod || !amount || loading}
          className="w-full bg-blue-600 text-white h-12 text-lg mb-6"
        >
          {loading ? (
            <>
              <Clock className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Add ${amount || "0.00"}
            </>
          )}
        </Button>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Add Money Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions && Array.isArray(recentTransactions) && recentTransactions.length > 0 ? recentTransactions.map((transaction: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Add Money via {transaction.method}</p>
                      <p className="text-xs text-gray-500">{transaction.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{transaction.amount}</p>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent deposits available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
