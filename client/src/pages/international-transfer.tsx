import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { Globe, Shield, Clock, Star, AlertCircle, CheckCircle } from "lucide-react";

export default function InternationalTransfer() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [transferAmount, setTransferAmount] = useState('1000');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [showPinModal, setShowPinModal] = useState(false);
  const [transferPin, setTransferPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showProcessingPage, setShowProcessingPage] = useState(false);
  const [transferId, setTransferId] = useState('');
  const [intlTransferStatus, setIntlTransferStatus] = useState<"processing" | "pending" | "success" | "failed">("processing");

  // Fetch user data - simple and clean
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const handleInternationalTransfer = () => {
    if (!user?.email) {
      toast({ title: 'Please wait', description: 'Loading your profile...', variant: 'destructive' });
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    if (!transferPin || transferPin.length !== 4) {
      setPinError("Please enter a 4-digit PIN");
      return;
    }

    setPinError("");
    
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/international-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(transferAmount),
          recipientCountry: toCurrency,
          transferPin: transferPin
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setPinError(errorData.message || "Transfer failed");
        return;
      }

      const result = await response.json();
      setShowPinModal(false);
      setTransferPin('');
      setTransferId(result.id || `INT-${Date.now()}`);
      setIntlTransferStatus("processing");
      setShowProcessingPage(true);
      
    } catch (error) {
      setPinError("Network error. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Failed to load user profile. Please refresh.</div>
      </div>
    );
  }

  if (showProcessingPage) {
    const statusConfig = {
      processing: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100', title: 'Processing', msg: 'Transfer processing...' },
      pending: { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100', title: 'Pending', msg: 'Awaiting approval...' },
      success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', title: 'Success', msg: 'Transfer approved!' },
      failed: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100', title: 'Failed', msg: 'Transfer failed' }
    };
    
    const config = statusConfig[intlTransferStatus];
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="px-4 py-6 pb-20 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <div className={`w-20 h-20 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`w-10 h-10 ${config.color}`} />
              </div>
              <h2 className="text-xl font-semibold mb-2">{config.title}</h2>
              <p className="text-gray-600 mb-4">{config.msg}</p>
              <p className="text-sm font-mono text-gray-500 mb-4">Ref: {transferId}</p>
              <Button 
                onClick={() => { setShowProcessingPage(false); setTransferPin(''); setPinError(''); }}
                className="w-full"
              >
                New Transfer
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('international_money_transfer')}</h1>
          <p className="text-xl text-gray-600 mb-6">{t('send_money_description')}</p>
          <div className="flex justify-center flex-wrap gap-3">
            <Badge><Globe className="w-4 h-4 mr-1" />190+ Countries</Badge>
            <Badge><Shield className="w-4 h-4 mr-1" />Bank-Grade Security</Badge>
            <Badge><Clock className="w-4 h-4 mr-1" />Real-time Transfer</Badge>
            <Badge><Star className="w-4 h-4 mr-1" />Best Rates</Badge>
          </div>
        </div>

        {/* Transfer Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Transfer Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount */}
            <div>
              <Label>You Send</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  type="number" 
                  value={transferAmount} 
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1"
                />
                <Input value="USD" readOnly className="w-20" />
              </div>
            </div>

            {/* Currency */}
            <div>
              <Label>Recipient Gets</Label>
              <div className="flex gap-2 mt-2">
                <Input value={`¥${(parseFloat(transferAmount) * 7.23).toFixed(2)}`} readOnly className="flex-1" />
                <Input value="CNY" readOnly className="w-20" />
              </div>
            </div>

            {/* Exchange Rate Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Exchange Rate</p>
                <p className="font-semibold">1 USD = 7.23 CNY</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transfer Fee</p>
                <p className="font-semibold">$8.00</p>
              </div>
            </div>

            {/* Send Button */}
            <Button 
              onClick={handleInternationalTransfer}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Send Money Now
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Why Choose World Bank?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Best Exchange Rates</p>
                <p className="text-xs text-gray-600">Guaranteed competitive rates</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Bank-Grade Security</p>
                <p className="text-xs text-gray-600">256-bit encryption & fraud protection</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Ultra-Fast Delivery</p>
                <p className="text-xs text-gray-600">Real-time to same-day delivery</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">24/7 Support</p>
                <p className="text-xs text-gray-600">Multilingual customer service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Enter PIN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Enter 4-digit PIN"
                value={transferPin}
                onChange={(e) => setTransferPin(e.target.value.slice(0, 4))}
                maxLength={4}
              />
              {pinError && <p className="text-red-600 text-sm">{pinError}</p>}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => { setShowPinModal(false); setTransferPin(''); setPinError(''); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePinSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Verify
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
      <BottomNavigation />
    </div>
  );
}
