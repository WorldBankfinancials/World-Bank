import type { User } from "@shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { 
  Wallet, 
  Smartphone, 
  QrCode, 
  CreditCard, 
  Shield, 
  Zap, 
  Globe, 
  Plus,
  Send,
  Download,
  Eye,
  EyeOff,
  History,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Scan
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function DigitalWallet() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch real wallet data from Supabase
  const { data: walletData } = useQuery<{ balance: number }>({
    queryKey: ['/api/wallet-balance'],
    enabled: !!user,
    staleTime: 30000
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['/api/wallet-transactions'],
    enabled: !!user,
    staleTime: 30000
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  const walletBalance = walletData?.balance || (user && 'balance' in user ? user.balance : 0) || 0;

  // Quick actions - navigation only (no API needed)
  const quickActions = [
    { icon: Send, label: t('send_money'), action: () => { navigate("/transfer"); } },
    { icon: QrCode, label: "QR Pay", action: () => { navigate("/mobile-pay"); } },
    { icon: Plus, label: t('add_money'), action: () => { navigate("/add-money"); } },
    { icon: History, label: t('history'), action: () => { navigate("/history"); } }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="px-4 py-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t('digital_wallet')}</h1>
            <p className="text-sm text-gray-600">{t('digital_wallet_desc')}</p>
          </div>
          <Button onClick={() => toast({ title: 'Add Funds', description: 'Redirecting to add funds page...' })} className="bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-1" />
            Add Funds
          </Button>
        </div>

        {/* Main Wallet Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl mb-2">World Bank Digital Wallet</CardTitle>
                <p className="text-blue-100">Available Balance</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowBalance(!showBalance)}
                className="text-white hover:bg-blue-700"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-3xl font-bold mb-2">
                {showBalance ? `$${walletBalance.toLocaleString()}` : "••••••"}
              </div>
              <div className="flex items-center space-x-4 text-blue-100">
                <span>Account: {user?.accountNumber || t('loading')}</span>
                <Badge className="bg-green-500 text-white">{user && 'isActive' in user && user.isActive ? t('account_active') : t('account_inactive')}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('quick_actions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={`quick-action-${index}`}
                  onClick={() => {
                    try {
                      action.action();
                    } catch (e) {
                      toast({ title: 'Error', description: 'Navigation failed', variant: 'destructive' });
                    }
                  }}
                  className="h-16 flex flex-col items-center justify-center space-y-2 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <action.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-xs text-gray-700 font-medium text-center line-clamp-2">{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions && Array.isArray(recentTransactions) && (recentTransactions as any).map((transaction: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'received' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'received' ? (
                        <ArrowDownRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.type === 'received' ? `From ${transaction.from}` : `To ${transaction.to}`}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.time}</p>
                    </div>
                  </div>
                  <span className={`font-medium ${
                    transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Digital Payment Options */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <QrCode className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium">QR Code Payments</p>
                    <p className="text-sm text-gray-600">Scan to pay instantly</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'QR Scanner', description: 'Opening QR code scanner...' })}>
                  <Scan className="w-4 h-4 mr-1" />
                  Scan
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium">Mobile Transfers</p>
                    <p className="text-sm text-gray-600">Send to phone numbers</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'Mobile Transfer', description: 'Opening mobile transfer feature...' })}>
                  Send
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="font-medium">International Payments</p>
                    <p className="text-sm text-gray-600">Send money worldwide</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'International Payment', description: 'Opening international transfer feature...' })}>
                  Transfer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
