// client/src/pages/add-money.tsx
import type { User } from "@/lib/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CreditCard,
  Banknote,
  Building,
  Smartphone,
  Plus,
  Shield,
  Clock,
  Wallet,
  ArrowUpRight
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

export default function AddMoney() {
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Fetch user
  const { data: user, isLoading: userLoading } = useInfiniteQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('*').eq('id', user?.id).single();
      return data as User;
    },
    enabled: !!user?.id,
  });

  // Infinite transactions query
  const { 
    data: transactionsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<Transaction[]>({
    queryKey: ['/api/recent-deposits'],
    queryFn: async ({ pageParam = 0 }) => {
      const pageSize = 5;
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('to_user_id', user?.id)
        .order('created_at', { ascending: false })
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);
      if (error) throw error;
      return data as Transaction[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 5 ? allPages.length : undefined;
    },
    enabled: !!user?.id,
  });

  if (userLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const quickAmounts = ["50", "100", "250", "500", "1000", "2500"];
  const addMoneyMethods = [
    { id: "debit_card", name: "Debit Card", description: "Instant transfer from your debit card", icon: CreditCard, fee: "Free", time: "Instant", color: "bg-blue-500" },
    { id: "bank_transfer", name: "Bank Transfer", description: "Transfer from your bank account", icon: Building, fee: "Free", time: "1-3 business days", color: "bg-green-500" },
    { id: "cash_deposit", name: "Cash Deposit", description: "Deposit cash at World Bank branches", icon: Banknote, fee: "Free", time: "Instant", color: "bg-yellow-500" },
    { id: "mobile_money", name: "Mobile Money", description: "Transfer from mobile money services", icon: Smartphone, fee: "1.5%", time: "Instant", color: "bg-purple-500" }
  ];

  const handleAddMoney = async () => {
    setMsg(null);
    if (!selectedMethod || !amount) return setMsg("Please select a method and enter an amount");

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return setMsg("Enter a valid amount");

    setLoading(true);
    try {
      await supabase.from("transactions").insert([
        {
          from_user_id: null,
          to_user_id: user?.id,
          amount: amt,
          type: "credit",
          status: "completed",
          description: `Add money via ${selectedMethod}`,
          method: selectedMethod
        }
      ]);

      await supabase.from("accounts").update({ balance: (user?.balance ?? 0) + amt }).eq("id", user?.id);

      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-deposits'] });

      setMsg(`Successfully added $${amt.toFixed(2)} via ${selectedMethod}`);
      setAmount("");
      setSelectedMethod("");
    } catch (error: any) {
      setMsg(error.message || "Add money failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="px-4 py-6 pb-20">
        {/* Header */}
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
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm">Current Balance</p>
              <p className="text-2xl font-bold">${user?.balance?.toLocaleString() || '0.00'}</p>
              <p className="text-blue-200 text-sm">Account: {user?.account_number || "—"}</p>
            </div>
            <Wallet className="w-8 h-8 text-blue-200" />
          </CardContent>
        </Card>

        {/* Amount Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-2xl text-center font-bold" />
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((val, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => setAmount(val)} className="text-xs">${val}</Button>
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
              <div key={method.id} onClick={() => setSelectedMethod(method.name)} className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedMethod === method.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
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

        {/* Add Money Button */}
        <Button onClick={handleAddMoney} disabled={!selectedMethod || !amount || loading} className="w-full bg-blue-600 text-white h-12 text-lg mb-6">
          {loading ? (
            <>
              <Clock className="w-5 h-5 mr-2 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" /> Add ${amount || "0.00"}
            </>
          )}
        </Button>

        {msg && <p className="text-center text-sm text-gray-700 mb-6">{msg}</p>}

        {/* Infinite Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Add Money Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsPages?.pages.flat().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent deposits available</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {transactionsPages?.pages.flat().map(tx => (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Add Money via {tx.method}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">${tx.amount.toFixed(2)}</p>
                        <Badge className="bg-green-100 text-green-800 text-xs">{tx.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {hasNextPage && (
                  <Button onClick={() => fetchNextPage()} className="w-full mt-4" disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? "Loading..." : "Load More"}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
