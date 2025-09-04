import React from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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


export default function AddMoney() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
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

  const recentTransactions = [
    { method: "Debit Card", amount: "+$500.00", status: "completed", time: "2 hours ago" },
    { method: "Bank Transfer", amount: "+$1,200.00", status: "completed", time: "1 day ago" },
    { method: "Cash Deposit", amount: "+$300.00", status: "completed", time: "3 days ago" }
  ];

  const handleAddMoney = async () => {
    if (!selectedMethod || !amount) {
      alert("Please select a method and enter an amount");
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully added $${amount} via ${selectedMethod}`);
      setAmount("");
      setSelectedMethod("");
    } catch (error) {
      alert("Add money failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
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
              {recentTransactions.map((transaction, index) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}