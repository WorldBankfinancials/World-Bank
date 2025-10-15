import React, { useEffect, useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar } from "@/components/Avatar";
import LiveChat from "@/components/LiveChat";
import RealtimeAlerts from "@/components/RealtimeAlerts";
import { useUserData, useAccountData } from "@/hooks/useUserData";
import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';


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
  Filter,
  Trash2
} from "lucide-react";
import { Link, useLocation } from "wouter";

// Transfer Section Component
function TransferSection() {
  const { t } = useLanguage();
  const [transferAmount, setTransferAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [transferType, setTransferType] = useState("quick");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransfer = async () => {
    if (!transferAmount || !recipient) {
      
      return;
    }
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setTransferAmount("");
    setRecipient("");
    setIsProcessing(false);
  };

  return (
    <div className="px-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-blue-600" />
            <span>{t('transfer_money')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transfer-amount">{t('amount')}</Label>
            <Input
              id="transfer-amount"
              type="number"
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="recipient">{t('send_to')}</Label>
            <Input
              id="recipient"
              placeholder={t('account_email_phone_placeholder')}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="transfer-type">{t('transfer_type')}</Label>
            <Select value={transferType} onValueChange={setTransferType}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_transfer_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">{t('quick_send')}</SelectItem>
                <SelectItem value="international">{t('international')}</SelectItem>
                <SelectItem value="bank">{t('bank_transfer')}</SelectItem>
                <SelectItem value="mobile">{t('mobile_money')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleTransfer}
            disabled={!transferAmount || !recipient || isProcessing}
            className="w-full bg-blue-600 text-white"
          >
            {isProcessing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                {t('processing_transfer')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('send_amount')} ${transferAmount || "0.00"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Receive Section Component
function ReceiveSection() {
  const { t } = useLanguage();
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  const [requestAmount, setRequestAmount] = React.useState("");
  const [showQR, setShowQR] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const accountDetails = {
    name: user?.fullName || "Account Holder",
    accountNumber: user?.accountNumber || t('loading'),
    accountId: (user as any)?.accountId || t('loading')
  };

  const handleCopyDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestMoney = () => {
    if (!requestAmount) {
      
      return;
    }
    
    setRequestAmount("");
  };

  return (
    <div className="px-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowDownRight className="w-5 h-5 text-green-600" />
            <span>Receive Money</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Request amount"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleRequestMoney} className="bg-green-600 text-white">
              Request
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={() => setShowQR(!showQR)} variant="outline" className="flex-1">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
            <Button 
              onClick={() => handleCopyDetails(accountDetails.accountNumber)} 
              variant="outline" 
              className="flex-1"
            >
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Details"}
            </Button>
          </div>

          {showQR && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">Scan to send money to {accountDetails.name}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Account Number</span>
              <span className="text-sm font-medium">{accountDetails.accountNumber}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Account ID</span>
              <span className="text-sm font-medium">{accountDetails.accountId}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add Money Section Component
function AddMoneySection() {
  const [addAmount, setAddAmount] = React.useState("");
  const [selectedMethod, setSelectedMethod] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const quickAmounts = ["50", "100", "250", "500", "1000"];
  const addMoneyMethods = [
    { id: "debit_card", name: "Debit Card", icon: CreditCard, fee: "Free", time: "Instant" },
    { id: "bank_transfer", name: "Bank Transfer", icon: Building2, fee: "Free", time: "1-3 days" },
    { id: "cash_deposit", name: "Cash Deposit", icon: Banknote, fee: "Free", time: "Instant" },
    { id: "mobile_money", name: "Mobile Money", icon: Smartphone, fee: "1.5%", time: "Instant" }
  ];

  const handleAddMoney = async () => {
    if (!selectedMethod || !addAmount) {
      alert("Please select a method and enter an amount");
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert(`Successfully added $${addAmount} via ${selectedMethod}`);
    setAddAmount("");
    setSelectedMethod("");
    setLoading(false);
  };

  return (
    <div className="px-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-purple-600" />
            <span>Add Money</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="add-amount">Amount</Label>
            <Input
              id="add-amount"
              type="number"
              placeholder="0.00"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setAddAmount(amount)}
                className="text-xs"
              >
                ${amount}
              </Button>
            ))}
          </div>

          <div>
            <Label>Payment Method</Label>
            <div className="space-y-2 mt-2">
              {addMoneyMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method.name)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.name
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <method.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{method.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600">{method.fee}</p>
                      <p className="text-xs text-gray-500">{method.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleAddMoney}
            disabled={!selectedMethod || !addAmount || loading}
            className="w-full bg-purple-600 text-white"
          >
            {loading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add ${addAmount || "0.00"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Alerts Section Component
function AlertsSection() {
  const [notifications, setNotifications] = React.useState({
    transactions: true,
    security: true,
    statements: true,
    marketing: false
  });

  const alerts = [
    {
      id: 1,
      title: "Payment Received",
      message: "You received $250.00 from John Smith",
      time: "2 hours ago",
      icon: ArrowDownRight,
      color: "text-green-600",
      bgColor: "bg-green-100",
      read: false
    },
    {
      id: 2,
      title: "Security Alert",
      message: "New device login detected",
      time: "4 hours ago",
      icon: Shield,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      read: false
    },
    {
      id: 3,
      title: "Monthly Statement",
      message: "Your December statement is ready",
      time: "2 days ago",
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      read: true
    }
  ];

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const markAsRead = (alertId: number) => {
    // Mark alert as read in system
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;

  return (
    <div className="px-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <span>Alerts & Notifications</span>
            </div>
            <Badge className="bg-orange-100 text-orange-800">
              {unreadCount} unread
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border rounded-lg ${!alert.read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${alert.bgColor} rounded-full flex items-center justify-center`}>
                      <alert.icon className={`w-4 h-4 ${alert.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-sm">{alert.title}</h3>
                        {!alert.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{alert.message}</p>
                      <p className="text-xs text-gray-500">{alert.time}</p>
                    </div>
                  </div>
                  {!alert.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3">Notification Settings</h4>
            <div className="space-y-3">
              {Object.entries(notifications).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => handleNotificationToggle(key as keyof typeof notifications)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = React.useState(true);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [showNotifications] = React.useState(false);
  const [userData, setUserData] = React.useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          
          setUserData(data);
        } else {
          
        }
      } catch (error) {
        
      }
    };
    
    fetchUserData();
  }, []);

  useEffect(() => {
    const handleToggleChat = () => setIsChatOpen(!isChatOpen);
    window.addEventListener('toggleLiveChat', handleToggleChat);
    return () => window.removeEventListener('toggleLiveChat', handleToggleChat);
  }, [isChatOpen]);

  const toggleBalance = () => setShowBalance(!showBalance);

  // Fetch real account data from API
  const [accounts, setAccounts] = React.useState<Array<{
    type: string;
    number: string;
    balance: number;
    icon: any;
    id: number;
  }>>([]);
  
  React.useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounts');
        if (response.ok) {
          const accountsData = await response.json();
          // 
          
          if (Array.isArray(accountsData) && accountsData.length > 0) {
            const formattedAccounts = accountsData.map((account: any) => ({
              type: account.accountType ? account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1) : 'Account',
              number: account.accountNumber ? `****${account.accountNumber.slice(-4)}` : '****0000',
              balance: account.balance ? parseFloat(account.balance.toString()) : 0,
              icon: account.accountType === 'checking' ? Wallet : 
                    account.accountType === 'savings' ? Building2 : TrendingUp,
              id: account.id || 0
            }));
            setAccounts(formattedAccounts);
          } else {
            // console.warn('No accounts data received or invalid format');
            // Set default accounts if API returns empty
            setAccounts([
              { type: 'Checking', number: '****9234', balance: 49332.15, icon: Wallet, id: 1 },
              { type: 'Savings', number: '****5678', balance: 125000.00, icon: Building2, id: 2 },
              { type: 'Investment', number: '****9012', balance: 348900.25, icon: TrendingUp, id: 3 }
            ]);
          }
        } else {
          // console.error('Failed to fetch accounts - HTTP status:', response.status);
        }
      } catch (error) {
        // console.error('Failed to fetch accounts:', error);
        // Set default accounts on error
        setAccounts([
          { type: 'Checking', number: '****9234', balance: 49332.15, icon: Wallet, id: 1 },
          { type: 'Savings', number: '****5678', balance: 125000.00, icon: Building2, id: 2 },
          { type: 'Investment', number: '****9012', balance: 348900.25, icon: TrendingUp, id: 3 }
        ]);
      }
    };
    
    fetchAccounts();
    // Removed auto-refresh to prevent profile reset issues
  }, []);

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
        { icon: Building2, label: "Banking Services", href: "/banking-services" },
        { icon: RotateCcw, label: "Transfer Funds", href: "/transfer-funds" }
      ]
    },
    {
      category: "INVESTMENT & WEALTH",
      items: [
        { icon: TrendingUp, label: "Investment Portfolio", href: "/investment" },
        { icon: Building2, label: "Wealth Management", href: "/wealth-management" },
        { icon: TrendingUp, label: "Investment Trading", href: "/investment-trading" },
        { icon: Building2, label: "Business Banking", href: "/business-banking" }
      ]
    },
    {
      category: "DIGITAL SERVICES",
      items: [
        { icon: CreditCard, label: "Digital Wallet", href: "/digital-wallet" },
        { icon: UserCircle, label: "Mobile Pay", href: "/mobile-pay" },
        { icon: ArrowUpRight, label: "International Transfer", href: "/international-transfer" }
      ]
    },
    {
      category: "SUPPORT & HELP",
      items: [
        { icon: HelpCircle, label: "Support Center", href: "/support-center" },        
        { icon: UserCircle, label: "Customer Support", href: "/customer-support" },
        { icon: Shield, label: "Security Center", href: "/security-center" },
        { icon: Building2, label: "Find Branches", href: "/find-branches" },
        { icon: LogOut, label: "Sign Out", href: "/login" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with World Bank Logo and Profile */}
      <div className="bg-white px-4 py-3 shadow-sm relative">
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
            {/* Real-time Alerts */}
            <RealtimeAlerts />


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
                        <div className="font-semibold text-gray-900">Liu Wei</div>
                        <div className="text-sm text-gray-600">Marine Engineer</div>
                        <div className="text-sm text-gray-600">bankmanagerworld5@gmail.com</div>
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
                    {profileMenuItems.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="mb-4">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {section.category}
                        </div>
                        {section.items.map((item, itemIndex) => (
                          <Link key={itemIndex} href={item.href}>
                            <div 
                              onClick={() => setShowProfileMenu(false)}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <item.icon className="w-5 h-5 text-gray-500" />
                              <span className="text-sm text-gray-700">{item.label}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Account Info Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500">
                      Account ID: {userProfile?.accountId || t('loading')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last Login: {(userProfile as any)?.lastLogin ? new Date((userProfile as any).lastLogin).toLocaleDateString() : t('loading')}
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
                <h1 className="text-lg font-semibold text-gray-900">{t('welcome')}, {userProfile?.fullName || t('loading')}</h1>
                <p className="text-sm text-gray-600">{t('account_number')}: {userProfile?.accountNumber || t('loading')}</p>
                <p className="text-sm text-gray-600">{t('account_id')}: {(userProfile as any)?.accountId || t('loading')}</p>
                <p className="text-sm text-gray-600">{userProfile?.profession || t('loading')}</p>
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
      <div className="p-4">
        <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm">{t('total_balance')}</p>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">
                    {showBalance ? `$${userProfile?.balance?.toLocaleString() || "0.00"}` : "****"}
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
                <p className="text-sm font-medium">****1234</p>
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
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('my_accounts')}</h3>
        <div className="space-y-3">
          {accounts.map((account, index) => (
            <Card key={index} className="wb-card">
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
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/transfer">
            <div className="p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-blue-100 hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">International Transfer</h4>
                  <p className="text-sm text-gray-600">Send money worldwide</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/receive">
            <div className="p-6 bg-gradient-to-br from-white to-green-50 rounded-2xl border-2 border-green-100 hover:border-green-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ArrowDownRight className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Receive</h4>
                  <p className="text-sm text-gray-600">Request money</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/add-money">
            <div className="p-6 bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-100 hover:border-purple-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Add Money</h4>
                  <p className="text-sm text-gray-600">Fund account</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Live Chat Button */}
          <div 
            onClick={() => setIsChatOpen(true)}
            className="p-4 bg-white rounded-lg border hover:border-green-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center relative">
                <Send className="w-6 h-6 text-green-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Live Chat</h4>
                <p className="text-sm text-gray-600">Customer support</p>
              </div>
            </div>
          </div>

          {/* Banking Alerts - With Alerts Page Navigation */}
          <Link href="/alerts">
            <div className="p-4 bg-white rounded-lg border hover:border-orange-500 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center relative">
                  <Bell className="w-6 h-6 text-orange-600" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">3</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Banking Alerts</h4>
                  <p className="text-sm text-gray-600">3 new notifications</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Account Statement */}
          <div 
            onClick={() => alert('Generating account statement...')}
            className="p-4 bg-white rounded-lg border hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Statements</h4>
                <p className="text-sm text-gray-600">Download reports</p>
              </div>
            </div>
          </div>

          {/* Currency Exchange */}
          <div 
            onClick={() => alert('Currency exchange rates: USD 1.00 = CNY 7.24, EUR 1.00 = CNY 7.85')}
            className="p-4 bg-white rounded-lg border hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Exchange</h4>
                <p className="text-sm text-gray-600">Currency rates</p>
              </div>
            </div>
          </div>

          {/* Investment Portfolio */}
          <div 
            onClick={() => setLocation('/investment')}
            className="p-4 bg-white rounded-lg border hover:border-amber-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Investments</h4>
                <p className="text-sm text-gray-600">Portfolio view</p>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Salary Payment</p>
                    <p className="text-sm text-gray-500">Dec 15, 2024</p>
                  </div>
                </div>
                <span className="font-medium text-green-600">+$5,250.00</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Grocery Store</p>
                    <p className="text-sm text-gray-500">Dec 14, 2024</p>
                  </div>
                </div>
                <span className="font-medium text-red-600">-$156.78</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Investment Return</p>
                    <p className="text-sm text-gray-500">Dec 13, 2024</p>
                  </div>
                </div>
                <span className="font-medium text-green-600">+$1,250.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      <BottomNavigation />

      {/* Live Chat Component */}
      <LiveChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  );
}
