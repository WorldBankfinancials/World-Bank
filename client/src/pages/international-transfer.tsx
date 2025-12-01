import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "@/data/countries";
import { Globe, Shield, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface User {
  id: number;
  email: string;
  fullName?: string;
  balance?: number;
  transferPin?: string;
}

export default function InternationalTransfer() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Fetch user data using useEffect
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const response = await authenticatedFetch(`/api/user`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setDataError(null);
        } else {
          setDataError('Failed to load user data');
        }
      } catch (error: any) {
        setDataError(error?.message || 'Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const [transferAmount, setTransferAmount] = useState("");
  const [recipientFullName, setRecipientFullName] = useState("");
  const [recipientCountry, setRecipientCountry] = useState("");
  const [recipientStreet, setRecipientStreet] = useState("");
  const [recipientCity, setRecipientCity] = useState("");
  const [bankName, setBankName] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [transferPurpose, setTransferPurpose] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [transferPin, setTransferPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPendingStatus, setShowPendingStatus] = useState(false);
  const [transferReference2, setTransferReference2] = useState("");
  const [transferStatus, setTransferStatus] = useState<"processing" | "pending" | "success" | "failed">("processing");
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={(userProfile as any) || undefined} />
        <div className="flex items-center justify-center p-4 mt-20">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                <p className="font-semibold mb-2">Unable to Load</p>
                <p className="text-sm">{dataError || 'Please refresh or login again'}</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="w-full mt-4"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const handleContinueTransfer = async () => {
    try {
      if (!transferAmount) {
        toast({
          title: 'Amount required',
          description: 'Please enter a transfer amount.',
          variant: 'destructive'
        });
        return;
      }
      
      const numAmount = parseFloat(transferAmount);
      const userBalance = parseFloat(user?.balance?.toString() || '0');
      if (numAmount > userBalance) {
        toast({
          title: 'Insufficient balance',
          description: `Your balance is $${userBalance.toFixed(2)}. Please enter an amount up to $${userBalance.toFixed(2)}`,
          variant: 'destructive'
        });
        return;
      }
      
      if (!recipientFullName) {
        toast({
          title: 'Recipient name required',
          description: 'Please enter the recipient name.',
          variant: 'destructive'
        });
        return;
      }

      if (!bankName || !swiftCode || !accountNumber) {
        toast({
          title: 'Banking information required',
          description: 'Please enter bank name, SWIFT code, and account number.',
          variant: 'destructive'
        });
        return;
      }

      setShowPinVerification(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  const verifyPinAndTransfer = async () => {
    const emailToUse = user?.email || userProfile?.email;
    if (!emailToUse) {
      setPinError("User profile not loaded. Please refresh the page.");
      return;
    }
    
    if (!transferPin || transferPin.length !== 4) {
      setPinError("Please enter a 4-digit PIN");
      return;
    }

    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const pinResponse = await authenticatedFetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userProfile?.email || user?.email!,
          pin: transferPin
        })
      });
      
      let pinResult;
      try {
        pinResult = await pinResponse.json();
      } catch (e) {
        setPinError("Failed to parse PIN verification response");
        return;
      }
      if (!pinResult.success) {
        setPinError("Invalid PIN");
        return;
      }
    } catch (error) {
      setPinError("PIN verification failed");
      return;
    }

    setPinError("");
    setIsProcessing(true);
    
    const parsedAmount = parseFloat(transferAmount) || 0;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPinError("Invalid transfer amount");
      setIsProcessing(false);
      return;
    }
    
    try {
      const transferData = {
        amount: parsedAmount,
        recipientName: recipientFullName,
        recipientCountry: recipientCountry,
        bankName: bankName,
        swiftCode: swiftCode,
        accountNumber: accountNumber,
        transferPurpose: transferPurpose,
        transferPin: transferPin,
        userEmail: userProfile?.email || user?.email!
      };
      
      const { authenticatedFetch } = await import('@/lib/queryClient');

      const response = await authenticatedFetch('/api/international-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });

      if (response.ok) {
        let result;
        try {
          result = await response.json();
        } catch (e) {
          setPinError("Failed to parse transfer response");
          setIsProcessing(false);
          return;
        }
        
        setShowPinVerification(false);
        setTransferPin("");
        const txnId = result.transactionId || result.id || `INT-${Date.now()}`;
        setTransferReference2(txnId);
        setTransferStatus("processing");
        setShowPendingStatus(true);
        
        // Refresh user data to reflect balance changes
        const { queryClient } = await import('@/lib/queryClient');
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        const interval = setInterval(async () => {
          try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const statusResponse = await authenticatedFetch(`/api/international-transfers/${txnId}/status`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.status === 'approved' || statusData.status === 'completed') {
                setTransferStatus('success');
                clearInterval(interval);
              } else if (statusData.status === 'rejected' || statusData.status === 'failed') {
                setTransferStatus('failed');
                clearInterval(interval);
              }
            }
          } catch (error) {
          }
        }, 3000);
        
        setPollInterval(interval);

        setTransferAmount("");
        setRecipientFullName("");
        setRecipientCountry("");
        setRecipientStreet("");
        setRecipientCity("");
        setBankName("");
        setSwiftCode("");
        setAccountNumber("");
        setBankAddress("");
        setTransferPurpose("");
        setTransferReference("");
      } else {
        let error;
        try {
          error = await response.json();
        } catch (e) {
          setPinError("Transfer failed - server error");
          setIsProcessing(false);
          return;
        }
        
        setPinError(error?.message || "Invalid PIN. Please verify your 4-digit transfer PIN.");
        setIsProcessing(false);
      }
    } catch (error) {
      setPinError("Network connection error. Check your internet and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Show transfer status interface
  if (showPendingStatus) {
    const statusConfig = {
      processing: {
        icon: Clock,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'Processing',
        message: 'Your international wire transfer is being securely processed...',
        statusText: 'Processing',
        statusColor: 'text-blue-600',
        steps: [
          { done: true, text: 'Transfer request verified' },
          { done: true, text: 'Security verification complete' },
          { done: false, text: 'Processing transfer' }
        ]
      },
      pending: {
        icon: Clock,
        bgColor: 'bg-orange-100',
        iconColor: 'text-orange-600',
        title: 'Pending',
        message: 'Your transfer is being reviewed and will be processed shortly...',
        statusText: 'Pending',
        statusColor: 'text-orange-600',
        steps: [
          { done: true, text: 'Transfer request verified' },
          { done: true, text: 'Security verification complete' },
          { done: true, text: 'In review' }
        ]
      },
      success: {
        icon: CheckCircle,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        title: 'Success',
        message: 'Your wire transfer has been approved and is being sent to the recipient bank.',
        statusText: 'Success',
        statusColor: 'text-green-600',
        steps: [
          { done: true, text: 'Transfer request verified' },
          { done: true, text: 'Security verification complete' },
          { done: true, text: 'Transfer approved' }
        ]
      },
      failed: {
        icon: AlertCircle,
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
        title: 'Transfer Failed',
        message: 'Your transfer could not be processed. Please contact support for assistance.',
        statusText: 'Failed',
        statusColor: 'text-red-600',
        steps: [
          { done: true, text: 'Transfer request verified' },
          { done: true, text: 'Security verification complete' },
          { done: false, text: 'Transfer failed' }
        ]
      }
    };

    const config = statusConfig[transferStatus];
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={(userProfile as any) || undefined} />
        
        <div className="px-4 py-6 pb-20">
          <div className="max-w-md mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <div className={`w-20 h-20 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-10 h-10 ${config.iconColor} ${transferStatus === 'processing' || transferStatus === 'pending' ? 'animate-spin' : ''}`} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h2>
                  <p className="text-gray-600 mb-4">{config.message}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Reference Number</span>
                    <span className="font-mono text-sm font-medium">{transferReference2}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-medium ${config.statusColor}`}>{config.statusText}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estimated Time</span>
                    <span className="text-sm font-medium">{transferStatus === 'success' ? '1-5 business days' : 'Reviewing...'}</span>
                  </div>
                </div>
                
                <div className="text-left space-y-3 mb-6">
                  {config.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className={`w-2 h-2 ${step.done ? 'bg-green-500' : 'bg-gray-300'} rounded-full mr-3 ${!step.done && transferStatus !== 'failed' ? 'animate-pulse' : ''}`}></div>
                      <span className={`text-sm ${step.done ? 'text-gray-700' : 'text-gray-500'}`}>{step.text}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowPendingStatus(false);
                      if (pollInterval) clearInterval(pollInterval);
                    }}
                  >
                    New Transfer
                  </Button>
                  {transferStatus === 'failed' && (
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        toast({
                          title: 'Support',
                          description: 'Opening live chat...',
                        });
                      }}
                    >
                      Contact Support
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={(userProfile || user) as any} />
      
      <div className="px-4 py-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">International Wire Transfer</h1>
            <p className="text-sm text-gray-600">Send money worldwide with complete security</p>
          </div>
          <div className="flex space-x-2">
            <Badge className="bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" />
              Secure
            </Badge>
          </div>
        </div>

        {/* Select Transfer Method */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Transfer Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-blue-500 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">International Wire</p>
                  <p className="text-sm text-gray-600">SWIFT transfers worldwide</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Details Form */}
        <Card className="mb-6">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {/* Transfer Amount */}
            <div>
              <Label htmlFor="amount" className="font-semibold">Transfer Amount (USD) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="text-xl font-bold mt-1"
              />
              <p className="text-xs text-gray-600 mt-2">Please review fee details during confirmation</p>
            </div>

            {/* Recipient Information */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Recipient Information</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="recipientName">Full Name *</Label>
                  <Input
                    id="recipientName"
                    placeholder="John Smith"
                    value={recipientFullName}
                    onChange={(e) => setRecipientFullName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipientCountry">Country *</Label>
                  <Select value={recipientCountry} onValueChange={setRecipientCountry}>
                    <SelectTrigger id="recipientCountry">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country, idx) => (
                        <SelectItem key={`country-${idx}`} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="recipientStreet">Street Address *</Label>
                  <Input
                    id="recipientStreet"
                    placeholder="123 Main Street"
                    value={recipientStreet}
                    onChange={(e) => setRecipientStreet(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="recipientCity">City *</Label>
                  <Input
                    id="recipientCity"
                    placeholder="New York"
                    value={recipientCity}
                    onChange={(e) => setRecipientCity(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Bank Details</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    placeholder="JPMorgan Chase Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="swiftCode">SWIFT/BIC Code *</Label>
                    <Input
                      id="swiftCode"
                      placeholder="CHASUS33"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      placeholder="1234567890"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bankAddress">Bank Address</Label>
                  <Input
                    id="bankAddress"
                    placeholder="270 Park Avenue, New York, NY"
                    value={bankAddress}
                    onChange={(e) => setBankAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Purpose of Transfer */}
            <div>
              <Label htmlFor="purpose">Purpose of Transfer *</Label>
              <Select value={transferPurpose} onValueChange={setTransferPurpose}>
                <SelectTrigger id="purpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family Support</SelectItem>
                  <SelectItem value="business">Business Payment</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference/Message */}
            <div>
              <Label htmlFor="reference">Reference/Message (Optional)</Label>
              <Input
                id="reference"
                placeholder="Add a reference or message"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
              />
            </div>

            {/* Continue Button */}
            <Button onClick={handleContinueTransfer} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold">
              Transfer
            </Button>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Security Notice</p>
                <p className="text-gray-700 mt-1">International transfers require PIN verification. Transfers over $10,000 may require additional compliance checks.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIN Verification Modal */}
      {showPinVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Verify Transfer with PIN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Enter your 4-digit transfer PIN to confirm this international wire transfer.</p>
              <div>
                <Label htmlFor="pin">Transfer PIN *</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  value={transferPin}
                  onChange={(e) => setTransferPin(e.target.value.slice(0, 4))}
                  maxLength={4}
                  className="text-center text-2xl tracking-widest mt-1"
                />
              </div>
              {pinError && <p className="text-red-600 text-sm text-center">{pinError}</p>}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setShowPinVerification(false); 
                    setTransferPin(''); 
                    setPinError(''); 
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={verifyPinAndTransfer} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
