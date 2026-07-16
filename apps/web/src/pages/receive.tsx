import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { 
  QrCode, 
  Share, 
  Copy, 
  ArrowDownRight, 
  Link,
  CheckCircle,
  Download,
  Users,
  Smartphone,
  Mail,
  Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch, queryClient } from "@/lib/queryClient";


export default function Receive() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const [requestAmount, setRequestAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Fetch real pending requests from API
  const { data: pendingRequests = [], error: requestsError } = useQuery({
    queryKey: ['/api/payment-requests'],
    queryFn: async () => {
      try {
        const response = await authenticatedFetch('/api/payment-requests');
        if (!response.ok) {
          toast({ title: 'Failed to load requests', description: 'Unable to fetch payment requests', variant: 'destructive' });
          return [];
        }
        return response.json();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load payment requests', variant: 'destructive' });
        return [];
      }
    }
  });

  const queryError = error || requestsError;

  useEffect(() => {
    if (queryError) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
  }, [queryError]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const accountDetails = {
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Account Holder",
    accountNumber: user?.accountNumber || t('loading'),
    accountId: (user && 'accountId' in user ? user.accountId : t('loading')),
    bankName: "World Bank Group",
    swiftCode: "WBGLUS33"
  };

  const shareLink = `https://worldbank.app/pay/LW-${Date.now()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    // Copied to clipboard notification
  };

  const handleRequestMoney = async () => {
    const amount = parseFloat(String(requestAmount));
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    if (amount > 100000) {
      toast({ title: 'Maximum request amount is $100,000', variant: 'destructive' });
      return;
    }

    try {
      const response = await authenticatedFetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(requestAmount),
          currency: 'USD',
          description: message || '',
          recipientName: accountDetails.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment request');
      }

      toast({ title: 'Success', description: 'Payment request sent successfully' });
      // Invalidate the payment-requests query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/payment-requests'] });
      // Clear the form
      setRequestAmount("");
      setMessage("");
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send payment request', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="px-4 py-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Receive Money</h1>
            <p className="text-sm text-gray-600">Request payments easily</p>
          </div>
          <Button onClick={() => setShowQR(!showQR)} className="bg-blue-600 text-white">
            <QrCode className="w-4 h-4 mr-1" />
            QR Code
          </Button>
        </div>

        {/* QR Code Section */}
        {showQR && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>QR Code Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-48 h-48 bg-gray-100 mx-auto mb-4 rounded-lg flex items-center justify-center">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to send money to Mr. Liu Wei
              </p>
              <div className="flex space-x-2 justify-center">
                <Button variant="outline" onClick={() => toast({ title: 'QR Code Downloaded', description: 'QR code has been downloaded.' })}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => toast({ title: 'QR Code Shared', description: 'Your QR code has been shared successfully.' })}>
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Payment */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Request Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="number"
                placeholder="Enter amount"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            
            <div>
              <Input
                placeholder="Message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleRequestMoney} className="bg-blue-600 text-white">
                <Users className="w-4 h-4 mr-1" />
                Request
              </Button>
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Link className="w-4 h-4 mr-1" />}
                {copied ? "Copied!" : t('copy_link')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Account Name</p>
                <p className="font-medium">{accountDetails.name}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopyDetails(accountDetails.name)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="font-medium">{accountDetails.accountNumber}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopyDetails(accountDetails.accountNumber)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Account ID</p>
                <p className="font-medium">{String(accountDetails.accountId ?? '')}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopyDetails(String(accountDetails.accountId))}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">SWIFT Code</p>
                <p className="font-medium">{accountDetails.swiftCode}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopyDetails(accountDetails.swiftCode)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests && Array.isArray(pendingRequests) && pendingRequests.length > 0 ? pendingRequests.map((request: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{request.from}</p>
                      <p className="text-xs text-gray-500">{request.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{request.amount}</p>
                    <Badge 
                      className={request.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {request.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No payment requests available</p>
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