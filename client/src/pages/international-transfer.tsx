import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { Globe, Shield, Clock, Star, AlertCircle, CheckCircle, Phone, Mail, MapPin, Eye, EyeOff, History } from "lucide-react";
import { COUNTRIES } from "@/data/countries";

export default function InternationalTransfer() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [transferAmount, setTransferAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [recipientMiddleName, setRecipientMiddleName] = useState('');
  const [recipientDOB, setRecipientDOB] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientStreet, setRecipientStreet] = useState('');
  const [recipientCity, setRecipientCity] = useState('');
  const [recipientState, setRecipientState] = useState('');
  const [recipientPostal, setRecipientPostal] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [transferPurpose, setTransferPurpose] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [relationship, setRelationship] = useState('');
  
  // Modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [transferPin, setTransferPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showProcessingPage, setShowProcessingPage] = useState(false);
  const [transferId, setTransferId] = useState('');
  const [intlTransferStatus, setIntlTransferStatus] = useState<"processing" | "pending" | "success" | "failed">("processing");

  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const handleSendMoney = () => {
    if (!recipientFirstName || !recipientLastName || !bankName || !accountNumber || !swiftCode) {
      toast({ title: 'Incomplete Form', description: 'Please fill in all required fields', variant: 'destructive' });
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
          fromCurrency,
          toCurrency,
          recipientName: `${recipientFirstName} ${recipientLastName}`,
          recipientCountry,
          bankName,
          accountNumber,
          swiftCode,
          transferPurpose,
          transferPin
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
      processing: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100', title: 'Processing', msg: 'Your international transfer is being securely processed...' },
      pending: { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100', title: 'Pending Approval', msg: 'Your transfer is being reviewed...' },
      success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', title: 'Success', msg: 'Transfer approved and processing!' },
      failed: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100', title: 'Failed', msg: 'Transfer could not be processed' }
    };
    
    const config = statusConfig[intlTransferStatus];
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="px-4 py-12 pb-20 flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <div className={`w-20 h-20 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`w-10 h-10 ${config.color} ${intlTransferStatus === 'processing' ? 'animate-spin' : ''}`} />
              </div>
              <h2 className="text-2xl font-semibold mb-2">{config.title}</h2>
              <p className="text-gray-600 mb-6">{config.msg}</p>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-xs text-gray-600">Reference Number</p>
                <p className="font-mono font-bold text-sm">{transferId}</p>
              </div>
              <Button 
                onClick={() => { setShowProcessingPage(false); setTransferPin(''); setPinError(''); }}
                className="w-full bg-blue-600 hover:bg-blue-700"
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

  const exchangeRate = 7.23;
  const fee = 8.00;
  const recipientAmount = (parseFloat(transferAmount) * exchangeRate) - fee;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('international_money_transfer')}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">{t('send_money_description')}</p>
          <div className="flex justify-center flex-wrap gap-3 mb-6">
            <Badge className="flex items-center gap-1"><Globe className="w-4 h-4" />190+ Countries</Badge>
            <Badge className="flex items-center gap-1"><Shield className="w-4 h-4" />Bank-Grade Security</Badge>
            <Badge className="flex items-center gap-1"><Clock className="w-4 h-4" />Real-time Transfer</Badge>
            <Badge className="flex items-center gap-1"><Star className="w-4 h-4" />Best Rates Guaranteed</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Transfer Calculator */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Quick Transfer Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">You Send</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Amount" className="flex-1" />
                      <Select value={fromCurrency} onValueChange={setFromCurrency}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="USD">USD</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Recipient Gets</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={`¥${recipientAmount.toFixed(2)}`} readOnly className="flex-1" />
                      <Select value={toCurrency} onValueChange={setToCurrency}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="CNY">CNY</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded border">
                  <div><p className="text-xs text-gray-600">Exchange Rate</p><p className="font-semibold text-sm">1 USD = {exchangeRate} {toCurrency}</p></div>
                  <div><p className="text-xs text-gray-600">Transfer Fee</p><p className="font-semibold text-sm">${fee.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-600">Delivery Time</p><p className="font-semibold text-sm">Within 1 hour</p></div>
                </div>
              </CardContent>
            </Card>

            {/* Recipient Information */}
            <Card>
              <CardHeader>
                <CardTitle>Recipient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={recipientFirstName} onChange={(e) => setRecipientFirstName(e.target.value)} placeholder="First Name" />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={recipientLastName} onChange={(e) => setRecipientLastName(e.target.value)} placeholder="Last Name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Middle Name</Label>
                    <Input value={recipientMiddleName} onChange={(e) => setRecipientMiddleName(e.target.value)} placeholder="Middle Name" />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={recipientDOB} onChange={(e) => setRecipientDOB(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number *</Label>
                    <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="Phone Number" />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Email" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recipient Address */}
            <Card>
              <CardHeader>
                <CardTitle>Recipient Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Street Address *</Label>
                  <Input value={recipientStreet} onChange={(e) => setRecipientStreet(e.target.value)} placeholder="Street Address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input value={recipientCity} onChange={(e) => setRecipientCity(e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <Label>State/Province</Label>
                    <Input value={recipientState} onChange={(e) => setRecipientState(e.target.value)} placeholder="State" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Postal Code</Label>
                    <Input value={recipientPostal} onChange={(e) => setRecipientPostal(e.target.value)} placeholder="Postal Code" />
                  </div>
                  <div>
                    <Label>Country *</Label>
                    <Select value={recipientCountry} onValueChange={setRecipientCountry}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banking Information */}
            <Card>
              <CardHeader>
                <CardTitle>Banking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bank Name *</Label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank Name" />
                </div>
                <div>
                  <Label>Account Number/IBAN *</Label>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account Number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SWIFT/BIC Code *</Label>
                    <Input value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} placeholder="SWIFT Code" />
                  </div>
                  <div>
                    <Label>Bank Branch</Label>
                    <Input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} placeholder="Branch" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Routing Number</Label>
                    <Input value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} placeholder="Routing Number" />
                  </div>
                  <div>
                    <Label>Bank Address</Label>
                    <Input value={bankAddress} onChange={(e) => setBankAddress(e.target.value)} placeholder="Bank Address" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Transfer Purpose *</Label>
                  <Select value={transferPurpose} onValueChange={setTransferPurpose}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family Support</SelectItem>
                      <SelectItem value="business">Business Payment</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transfer Note</Label>
                  <Textarea value={transferNote} onChange={(e) => setTransferNote(e.target.value)} placeholder="Add a note (optional)" rows={3} />
                </div>
                <div>
                  <Label>Relationship to Recipient</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family Member</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="business">Business Associate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Summary */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle>Transfer Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Transfer Amount:</span><span className="font-semibold">${transferAmount} USD</span></div>
                <div className="flex justify-between"><span>Exchange Rate:</span><span className="font-semibold">1 USD = {exchangeRate} {toCurrency}</span></div>
                <div className="flex justify-between"><span>Transfer Fee:</span><span className="font-semibold">${fee.toFixed(2)}</span></div>
                <div className="border-t pt-2 flex justify-between font-bold"><span>Recipient Gets:</span><span>¥{recipientAmount.toFixed(2)} {toCurrency}</span></div>
                <div className="border-t pt-2 flex justify-between font-bold"><span>Total Debit:</span><span>${(parseFloat(transferAmount) + fee).toFixed(2)} USD</span></div>
                <Button onClick={handleSendMoney} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">Send Money Now</Button>
                <Button variant="outline" className="w-full">Save as Template</Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Why Choose */}
            <Card>
              <CardHeader>
                <CardTitle>Why Choose World Bank?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div><p className="font-semibold text-sm">Best Exchange Rates</p><p className="text-xs text-gray-600">Guaranteed competitive rates</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div><p className="font-semibold text-sm">Bank-Grade Security</p><p className="text-xs text-gray-600">256-bit encryption & fraud protection</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div><p className="font-semibold text-sm">Ultra-Fast Delivery</p><p className="text-xs text-gray-600">Real-time to same-day delivery</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div><p className="font-semibold text-sm">24/7 Support</p><p className="text-xs text-gray-600">Multilingual customer service</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Exchange Rates</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                  <span>1 USD = <strong>{exchangeRate}</strong> CNY</span>
                  <span className="text-green-600 text-xs">↗ +0.2%</span>
                </div>
                <p className="text-xs text-gray-500 text-center">Rates updated every 30 seconds</p>
                <Button variant="outline" size="sm" className="w-full text-xs"><History className="w-3 h-3 mr-1" />Rate History</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Enter PIN to Confirm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Enter your 4-digit PIN to complete the transfer</p>
              <Input type="password" placeholder="Enter PIN" value={transferPin} onChange={(e) => setTransferPin(e.target.value.slice(0, 4))} maxLength={4} className="text-center text-2xl tracking-widest" />
              {pinError && <p className="text-red-600 text-sm text-center">{pinError}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowPinModal(false); setTransferPin(''); setPinError(''); }} className="flex-1">Cancel</Button>
                <Button onClick={handlePinSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">Confirm</Button>
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
