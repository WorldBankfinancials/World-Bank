
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CreditCard, 
  Send, 
  Download, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Shield,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [hasError] = useState(false);

  // Removed redundant redirect - ProtectedRoute already handles this

  // User check removed - handled by ProtectedRoute

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-11/12 md:w-1/3 text-center">
          <CardHeader>
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-xl font-bold mb-3">Oops! Something went wrong.</CardTitle>
            <p className="text-gray-700 mb-4">
              We encountered an issue loading your dashboard. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t('welcome')}, {userProfile?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}!
              </h1>
              <p className="text-blue-100">
                Welcome back to World Bank Online Banking
              </p>
            </div>
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile?.avatarUrl || '/world-bank-logo.jpeg'} />
              <AvatarFallback>
                {(userProfile?.fullName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Account Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">{t('balance')}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {showBalance ? '$25,847.50' : '••••••••'}
            </div>
            <p className="text-sm text-gray-600 mt-2">Available Balance</p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('quick-actions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => setLocation('/transfer')}
              >
                <Send className="h-6 w-6" />
                <span className="text-sm">{t('send-money')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => setLocation('/receive')}
              >
                <Download className="h-6 w-6" />
                <span className="text-sm">{t('receive-money')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => setLocation('/cards')}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">{t('my-cards')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => setLocation('/statements-reports')}
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">{t('view-statements')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recent-transactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ArrowDownLeft className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Payment Received</p>
                    <p className="text-sm text-gray-600">From: John Smith</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+$1,250.00</p>
                  <p className="text-sm text-gray-600">Dec 30, 2024</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Transfer Sent</p>
                    <p className="text-sm text-gray-600">To: Sarah Johnson</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">-$500.00</p>
                  <p className="text-sm text-gray-600">Dec 29, 2024</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">{t('instant-payments')}</h3>
                  <p className="text-sm text-gray-600">{t('instant-payments-desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">{t('secure-transactions')}</h3>
                  <p className="text-sm text-gray-600">{t('secure-transactions-desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">{t('mobile-wallet')}</h3>
                  <p className="text-sm text-gray-600">{t('mobile-wallet-desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
