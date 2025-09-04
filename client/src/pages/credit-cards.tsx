import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Eye, EyeOff, Settings, MoreHorizontal, ArrowLeft, Lock, Smartphone } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";


export default function CreditCards() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [selectedCard, setSelectedCard] = useState(0);
  const [showTransactions, setShowTransactions] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const creditCards = [
    {
      id: 1,
      name: "World Bank Platinum",
      type: "Platinum",
      number: "4789 6523 1087 9234",
      maskedNumber: "**** **** **** 9234",
      expiry: "12/27",
      balance: "15420.85",
      limit: "50000.00",
      availableCredit: "34579.15",
      status: "Active",
      color: "from-blue-600 to-blue-800"
    },
    {
      id: 2,
      name: "World Bank Business",
      type: "Business",
      number: "5234 8765 2109 5678",
      maskedNumber: "**** **** **** 5678",
      expiry: "08/26",
      balance: "8230.40",
      limit: "75000.00",
      availableCredit: "66769.60",
      status: "Active",
      color: "from-gray-700 to-gray-900"
    }
  ];

  const recentTransactions = [
    { description: "Amazon Prime", amount: "14.99", date: "Dec 15, 2024", category: "Subscription" },
    { description: "Shell Gas Station", amount: "89.45", date: "Dec 14, 2024", category: "Fuel" },
    { description: "Whole Foods Market", amount: "156.78", date: "Dec 13, 2024", category: "Groceries" },
    { description: "Netflix", amount: "15.99", date: "Dec 12, 2024", category: "Entertainment" },
  ];

  const quickActions = [
    { icon: Lock, label: "Lock Card", action: () => alert("Card locked successfully") },
    { icon: Smartphone, label: "Mobile Pay", action: () => alert("Mobile pay activated") },
    { icon: DollarSign, label: "Pay Bill", action: () => alert("Redirecting to payment") },
    { icon: Settings, label: "Settings", action: () => alert("Card settings opened") }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={{
        id: 1,
        username: "liu.wei",
        password: "password123",
        fullName: "Mr. Liu Wei",
        accountNumber: "4789-6523-1087-9234",
        accountId: "WB-2024-7829",
        profession: "Marine Engineer at Oil Rig Company",
        isVerified: true,
        isOnline: true,
        avatarUrl: null
      }} />
      
      <div className="px-4 py-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">My Cards</h1>
          <Button size="sm" className="bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </div>
        {/* Credit Cards */}
        <div className="space-y-4">
          {creditCards.map((card) => (
            <Card key={card.id} className={`bg-gradient-to-r ${card.color} text-white relative overflow-hidden`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">{card.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-mono">
                        {showCardNumbers ? card.number : card.maskedNumber}
                      </span>
                      <button
                        onClick={() => setShowCardNumbers(!showCardNumbers)}
                        className="text-blue-100 hover:text-white"
                      >
                        {showCardNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <MoreHorizontal className="w-5 h-5 text-blue-100" />
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-blue-100 text-xs">Valid Thru</p>
                    <p className="text-sm font-medium">{card.expiry}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-xs">Available Credit</p>
                    <p className="text-lg font-semibold">${parseFloat(card.availableCredit).toLocaleString()}</p>
                  </div>
                </div>

                {/* Credit utilization bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-blue-100 mb-1">
                    <span>Used: ${parseFloat(card.balance).toLocaleString()}</span>
                    <span>Limit: ${parseFloat(card.limit).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2" 
                      style={{width: `${(parseFloat(card.balance) / parseFloat(card.limit)) * 100}%`}}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  onClick={action.action}
                  className="h-16 flex flex-col items-center space-y-2"
                >
                  <action.icon className="w-5 h-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.category} • {transaction.date}</p>
                    </div>
                  </div>
                  <span className="font-medium text-red-600">-${transaction.amount}</span>
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
