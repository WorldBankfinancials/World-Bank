import { useEffect, useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar } from "@/components/Avatar";
import LiveChat from "@/components/LiveChat";

// Wire LiveChat for dashboard support - ACTIVE + REAL-TIME
import { useUserData, useAccountData } from "@/hooks/useUserData";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import type { User } from '@shared/schema';
import { useToast } from "@/hooks/use-toast";

// Error Boundary for Dashboard
function ErrorFallback({ error }: { error: Error }) {
  const handleRetry = () => {
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen bg-red-50 p-4 flex flex-col items-center justify-center">
      <div className="text-red-600 font-semibold">Dashboard Error</div>
      <div className="text-red-500 text-sm mt-2">{error.message}</div>
      <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded" onClick={handleRetry}>
        Reload Page
      </button>
    </div>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Send,
  Download,
  Bell,
  Settings,
  LogOut,
  CreditCard,
  Shield,
  HelpCircle,
  UserCircle,
  Globe,
  ChevronDown,
  Check,
  Building2,
  TrendingUp,
  Wallet,
  RotateCcw,
  QrCode,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Smartphone,
  Banknote,
  Briefcase,
  PieChart,
  BarChart3,
  Headphones,
  MapPin,
  Lock,
  Filter,
  Trash2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { CustomerData, TransactionData } from "@/types";
import { useSupabaseRealtimeAccounts, useSupabaseRealtimeTransactions, useSupabaseRealtimeUserBalance } from "@/hooks/useSupabaseRealtimeDashboard";

export default function Dashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userData, setUserData] = useState<CustomerData | null>(null);
  const queryClient = useQueryClient();

  // Fetch real transaction data from API instead of hardcoded array
  const { data: recentTransactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery<TransactionData[]>({
    queryKey: ['/api/transactions/recent'],
    queryFn: async () => {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const response = await authenticatedFetch('/api/transactions/recent');
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data.slice(0, 10).map((txn: any) => ({
          id: txn.id,
          type: txn.type || 'transfer',
          amount: txn.amount,
          status: txn.status || 'pending',
          recipient: txn.recipientName || 'Recipient',
          timestamp: txn.createdAt || new Date().toISOString(),
          referenceId: txn.referenceNumber || txn.id,
          description: txn.description || txn.recipientName || 'Transfer',
          date: txn.createdAt || new Date().toISOString(),
          created_at: txn.createdAt || new Date().toISOString()
        })) : [];
      } catch (error: any) {
        return [];
      }
    }
  });

  // Track user presence for real-time online/offline status
  // usePresence disabled for backend auth mode
  // usePresence(
  //   userProfile?.id ? (typeof userProfile.id === 'number' ? userProfile.id : parseInt(userProfile.id)) : undefined,
  //   userProfile?.fullName || userProfile?.email
  // );

  // Fetch alerts
  const { data: fetchedAlerts = [] } = useQuery<any[]>({
    queryKey: ['/api/alerts'],
    queryFn: async () => {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const response = await authenticatedFetch('/api/alerts');
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return data;
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 10000
  });

  useEffect(() => {
    if (fetchedAlerts && fetchedAlerts.length > 0) {
      setNotifications(fetchedAlerts.map(alert => ({
        title: alert.title,
        message: alert.message,
        type: alert.type || 'info'
      })));
    }
  }, [fetchedAlerts]);

  // Subscribe to realtime user balance updates
  useSupabaseRealtimeUserBalance((data) => setUserData(data), true);

  useEffect(() => {
    const handleToggleChat = () => setIsChatOpen(!isChatOpen);
    window.addEventListener('toggleLiveChat', handleToggleChat);
    return () => window.removeEventListener('toggleLiveChat', handleToggleChat);
  }, [isChatOpen]);

  const toggleBalance = () => setShowBalance(!showBalance);

  // Fetch real account data from API
  const [accounts, setAccounts] = useState<Array<{
    type: string;
    number: string;
    balance: number;
    icon: any;
    id: number;
  }>>([]);

  // Subscribe to realtime account updates
  useSupabaseRealtimeAccounts((accountsData: any[]) => {
    if (Array.isArray(accountsData) && accountsData.length > 0) {
      const formattedAccounts = accountsData.map((account: any) => ({
        type: account.accountType ? account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1) : 'Account',
        number: account.accountNumber ? `****${account.accountNumber.slice(-4)}` : '****0000',
        balance: account.balance ? parseFloat(account.balance.toString()) : 0,
        icon: account.accountType === 'checking' ? Wallet : 
              account.accountType === 'savings' ? Building2 : TrendingUp,
        id: account.id
      }));
      setAccounts(formattedAccounts);
    }
  }, true);

  // Subscribe to realtime transaction updates
  useSupabaseRealtimeTransactions((transactions: any[]) => {
    queryClient.setQueryData(['/api/transactions/recent'], transactions);
  }, true);

  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };

  const profileMenuItems = [
    { 
      category: "ACCOUNT MANAGEMENT",
      items: [
        { icon: UserCircle, label: "Profile Settings", href: "/profile-settings" },
        { icon: Shield, label: "Security Settings", href: "/security-settings" },
        { icon: Settings, label: "Account Preferences", href: "/account-preferences" },
        { icon: Check, label: "Verification Center", href: "/verification" }
      ]
    },
    {
      category: "BANKING SERVICES", 
      items: [
        { icon: CreditCard, label: "Credit Cards", href: "/credit-cards" },
        { icon: ArrowUpRight, label: "Transaction History", href: "/transaction-history" },
        { icon: Download, label: "Statements & Reports", href: "/statements-reports" },
        { icon: Briefcase, label: "Banking Services", href: "/banking-services" },
        { icon: RotateCcw, label: "Transfer Funds", href: "/transfer-funds" }
      ]
    },
    {
      category: "INVESTMENT & WEALTH",
      items: [
        { icon: TrendingUp, label: "Investment Portfolio", href: "/investment" },
        { icon: PieChart, label: "Wealth Management", href: "/wealth-management" },
        { icon: BarChart3, label: "Investment Trading", href: "/investment-trading" },
        { icon: Banknote, label: "Business Banking", href: "/business-banking" }
      ]
    },
    {
      category: "DIGITAL SERVICES",
      items: [
        { icon: CreditCard, label: "Digital Wallet", href: "/digital-wallet" },
        { icon: Smartphone, label: "Mobile Pay", href: "/mobile-pay" },
        { icon: Globe, label: "International Transfer", href: "/international-transfer" }
      ]
    },
    {
      category: "SUPPORT & HELP",
      items: [
        { icon: HelpCircle, label: "Support Center", href: "/support-center" },        
        { icon: Headphones, label: "Customer Support", href: "/customer-support" },
        { icon: Lock, label: "Security Center", href: "/security-center" },
        { icon: MapPin, label: "Find Branches", href: "/find-branches" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20" key="dashboard-main">
      {/* Header with World Bank Logo and Profile */}
      <div className="bg-white px-4 py-3 shadow-sm relative" key="dashboard-header">
        <div className="flex items-center justify-between">
          {/* World Bank Logo and Brand */}
          <div className="flex items-center space-x-2">
            <img 
              src="/world-bank-logo.jpeg" 
              alt="World Bank Logo" 
              className="w-8 h-8 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/World_Bank_Group_logo.svg/1200px-World_Bank_Group_logo.svg.png";
              }}
            />
            <div>
              <div className="text-gray-900 font-semibold text-sm">WORLD BANK</div>
              <div className="text-xs text-gray-500">International Banking</div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-3">
            {/* Profile Icon with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Avatar size={40} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {/* Profile Header in Dropdown */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <Avatar size={64} />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{userProfile?.fullName || 'Account Holder'}</div>
                        <div className="text-sm text-gray-600">{userProfile?.profession || 'Customer'}</div>
                        <div className="text-sm text-gray-600">{userProfile?.email || 'Loading...'}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Verified Account</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Menu Items */}
                  <div className="max-h-64 overflow-y-auto">
                    {profileMenuItems.map((section) => (
                      <div key={`menu-${section.category}`} className="mb-4">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {section.category}
                        </div>
                        {section.items.map((item) => (
                          <div key={`menu-item-${item.href}`}>
                            <Link href={item.href}>
                              <div 
                                onClick={() => setShowProfileMenu(false)}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <item.icon className="w-5 h-5 text-gray-500" />
                                <span className="text-sm text-gray-700">{item.label}</span>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Sign Out Button */}
                  <div className="p-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>

                  {/* Account Info Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500">
                      Account ID: {userProfile?.accountId || t('loading')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last Login: {userProfile && 'lastLogin' in userProfile && userProfile.lastLogin ? new Date(String(userProfile.lastLogin)).toLocaleDateString() : t('loading')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Welcome, {userProfile?.fullName || 'Valued Customer'}</h1>
                <p className="text-sm text-gray-600">Account Number: {userProfile?.accountNumber || '••••-••••-••••-••••'}</p>
                <p className="text-sm text-gray-600">Account ID: {userProfile && 'accountId' in userProfile ? userProfile.accountId : 'WB-••••-••••'}</p>
                <p className="text-sm text-gray-600">{userProfile?.profession || 'Account Holder'}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Verified Account</span>
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">{t('online')}</Badge>
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">{t('authenticated')}</Badge>
                </div>
              </div>

              <Avatar size={80} />
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
          }}
        />
      )}

      {/* Account Balance Card */}
      <div className="p-4" key="dashboard-balance-section-wrapper">
        <Card key="dashboard-balance-card-unique" className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm">{t('total_balance')}</p>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">
                    {showBalance ? `$${(accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "****"}
                  </h2>
                  <button onClick={toggleBalance}>
                    {showBalance ? (
                      <EyeOff className="w-5 h-5 text-blue-100" />
                    ) : (
                      <Eye className="w-5 h-5 text-blue-100" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">{t('account')}</p>
                <p className="text-sm font-medium">{accounts.length > 0 ? accounts[0].number : '••••'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="w-4 h-4 text-green-300" />
                <span className="text-sm">+2.5%</span>
              </div>
              <span className="text-blue-100 text-sm">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Types Section - IN DASHBOARD */}
      <div className="px-4 mb-6" key="dashboard-accounts-section">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('my_accounts')}</h3>
        <div className="space-y-3" key="dashboard-accounts-list-wrapper">
          {accounts.map((account, idx) => (
            <Card key={`dashboard-acct-card-${account.id}-${idx}`} className="wb-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <account.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{account.type} Account</h4>
                      <p className="text-sm text-gray-500">{account.number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {showBalance ? `$${account.balance.toLocaleString()}` : "****"}
                    </p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6" key="dashboard-quick-actions-section-unique">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4" key="dashboard-quick-actions-grid-wrapper">
          <div key="quick-action-qa-1-transfer">
            <Link href="/international-transfer" className="no-underline">
              <div className="p-4 bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-blue-100 hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 h-full">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">International Transfer</h4>
                    <p className="text-xs text-gray-600 truncate">Send money worldwide</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div key="quick-action-qa-2-receive">
            <Link href="/receive" className="no-underline">
              <div className="p-6 bg-gradient-to-br from-white to-green-50 rounded-2xl border-2 border-green-100 hover:border-green-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 h-full">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <ArrowDownRight className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">Receive</h4>
                    <p className="text-sm text-gray-600">Request money</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div key="quick-action-qa-3-addmoney">
            <Link href="/add-money" className="no-underline">
              <div className="p-6 bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-100 hover:border-purple-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 h-full">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">Add Money</h4>
                    <p className="text-sm text-gray-600">Fund account</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div 
            key="quick-action-qa-4-live-chat"
            onClick={() => setIsChatOpen(true)}
            className="p-4 bg-white rounded-lg border hover:border-green-500 hover:shadow-md transition-all cursor-pointer h-full"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center relative flex-shrink-0">
                <Send className="w-6 h-6 text-green-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Live Chat</h4>
                <p className="text-sm text-gray-600">Customer support</p>
              </div>
            </div>
          </div>

          <div 
            key="quick-action-qa-5-banking-alerts"
            onClick={() => setShowNotifications(true)}
            className="p-4 bg-white rounded-lg border hover:border-orange-500 hover:shadow-md transition-all cursor-pointer h-full"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center relative flex-shrink-0">
                <Bell className="w-6 h-6 text-orange-600" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">4</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Banking Alerts</h4>
                <p className="text-sm text-gray-600">4 new notifications</p>
              </div>
            </div>
          </div>

          <div 
            key="quick-action-qa-6-statements"
            onClick={() => toast({ title: 'Account Statement', description: 'Generating account statement...' })}
            className="p-4 bg-white rounded-lg border hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer h-full"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Statements</h4>
                <p className="text-sm text-gray-600">Download reports</p>
              </div>
            </div>
          </div>

          <div 
            key="quick-action-qa-7-currency-exchange"
            onClick={() => toast({ title: 'Currency Exchange', description: 'USD 1.00 = CNY 7.24, EUR 1.00 = CNY 7.85' })}
            className="p-4 bg-white rounded-lg border hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer h-full"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Exchange</h4>
                <p className="text-sm text-gray-600">Currency rates</p>
              </div>
            </div>
          </div>

          <div 
            key="quick-action-qa-8-portfolio-investments"
            onClick={() => setLocation('/investment')}
            className="p-4 bg-white rounded-lg border hover:border-amber-500 hover:shadow-md transition-all cursor-pointer h-full"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Investments</h4>
                <p className="text-sm text-gray-600">Portfolio view</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Card */}
      <div className="px-4 pb-8" key="dashboard-recent-txn-section-wrapper">
        <Card key="dashboard-transactions-card-unique" className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" key="transactions-list">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx, idx) => (
                  <div key={`dashboard-tx-${idx}-${tx.id}`} className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`w-10 h-10 ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                        {tx.type === 'credit' ? (
                          <ArrowDownRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-gray-500">{new Date(tx.date || tx.created_at || new Date()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}${parseFloat(String(tx.amount)).toFixed(2)}
                      </span>
                      <Badge variant="outline" className={`text-xs ${
                        tx.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                        tx.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {tx.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No recent transactions</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation key="dashboard-bottom-nav" />

      {isChatOpen && (
        <LiveChat 
          key="dashboard-live-chat"
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}

      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Banking Alerts & Notifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
                className="text-gray-600"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {(notifications.length > 0 ? notifications : [
                  { title: "Account Security", message: "New login detected on your account - November 30, 2:15 PM from Replit", type: "warning" },
                  { title: "Transaction Completed", message: "Transfer of $5,000 to John Smith completed successfully", type: "success" },
                  { title: "Low Balance Alert", message: "Your checking account balance is below $1,000", type: "warning" },
                  { title: "Payment Received", message: "You received $2,500 from ABC Corporation", type: "success" }
                ]).map((notif, idx) => (
                  <div
                    key={`notif-${idx}`}
                    className={`p-4 rounded-lg border ${
                      notif.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                      notif.type === 'success' ? 'border-green-200 bg-green-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                        <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}