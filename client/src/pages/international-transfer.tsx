
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { 
  Globe, 
  ArrowRightLeft, 
  DollarSign, 
  Clock, 
  Shield, 
  CheckCircle,
  Calculator,
  AlertCircle,
  CreditCard,
  Building2,
  Users,
  Flag,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff,
  History,
  Star
} from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";

export default function InternationalTransfer() {
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [transferAmount, setTransferAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [showPinModal, setShowPinModal] = useState(false);
  const [transferPin, setTransferPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessingPage, setShowProcessingPage] = useState(false);
  const [transferId, setTransferId] = useState('');

  const handleInternationalTransfer = () => {
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    console.log('PIN submitted:', transferPin);
    
    // Validate PIN first
    if (!transferPin || transferPin.length !== 4) {
      setPinError("Please enter a 4-digit PIN");
      return;
    }

    if (transferPin !== "0192") {
      setPinError("Invalid PIN. Use PIN: 0192");
      return;
    }

    setPinError("");
    setIsProcessing(true);
    
    try {
      const transferData = {
        amount: parseFloat(transferAmount),
        recipientName: "John Smith",
        recipientCountry: "China",
        bankName: "Bank of China",
        swiftCode: "BKCHCNBJ",
        accountNumber: "1234567890",
        transferPurpose: "Family Support",
        transferPin: transferPin
      };
      
      console.log('Sending transfer data:', transferData);

      const response = await fetch('/api/international-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText);
        setPinError(`Transfer failed. Server error: ${response.status}`);
        return;
      }

      const result = await response.json();
      console.log('Transfer result:', result);
      
      setShowPinModal(false);
      setTransferPin('');
      setTransferId(result.id || `INT-${Date.now()}`);
      setShowProcessingPage(true);
      
    } catch (error) {
      console.error('International transfer error:', error);
      setPinError("Network connection error. Check your internet and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Processing page
  if (showProcessingPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        
        <div className="px-4 py-6 pb-20">
          <div className="max-w-md mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">International Transfer Processing</h2>
                  <p className="text-gray-600 mb-4">
                    Your international transfer is being processed securely through our banking network.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Reference Number</span>
                    <span className="font-mono text-sm font-medium">{transferId}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-medium text-orange-600">Processing</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="text-sm font-medium">${transferAmount} USD</span>
                  </div>
                </div>
                
                <div className="text-left space-y-3 mb-6">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Transfer request submitted</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-sm text-gray-700">Processing to recipient bank</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-500">Awaiting bank confirmation</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-500">Transfer completed</span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowProcessingPage(false)}
                  >
                    New Transfer
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    Track Transfer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  const exchangeRates = [
    { from: "USD", to: "CNY", rate: "7.23", trend: "up", flag: "🇨🇳", change: "+0.05", changePercent: "+0.69%" },
    { from: "USD", to: "EUR", rate: "0.92", trend: "down", flag: "🇪🇺", change: "-0.02", changePercent: "-2.13%" },
    { from: "USD", to: "GBP", rate: "0.79", trend: "up", flag: "🇬🇧", change: "+0.01", changePercent: "+1.28%" },
    { from: "USD", to: "JPY", rate: "149.50", trend: "stable", flag: "🇯🇵", change: "0.00", changePercent: "0.00%" },
    { from: "USD", to: "SGD", rate: "1.35", trend: "up", flag: "🇸🇬", change: "+0.03", changePercent: "+2.27%" },
    { from: "USD", to: "AUD", rate: "1.52", trend: "down", flag: "🇦🇺", change: "-0.04", changePercent: "-2.56%" },
    { from: "USD", to: "CAD", rate: "1.36", trend: "up", flag: "🇨🇦", change: "+0.02", changePercent: "+1.49%" },
    { from: "USD", to: "CHF", rate: "0.91", trend: "stable", flag: "🇨🇭", change: "0.00", changePercent: "0.00%" },
    { from: "USD", to: "KRW", rate: "1340.25", trend: "down", flag: "🇰🇷", change: "-15.50", changePercent: "-1.14%" },
    { from: "USD", to: "INR", rate: "83.12", trend: "up", flag: "🇮🇳", change: "+0.45", changePercent: "+0.54%" }
  ];

  const popularDestinations = [
    { country: "China", flag: "🇨🇳", currency: "CNY", fee: "$8.00", time: "Same day" },
    { country: "United Kingdom", flag: "🇬🇧", currency: "GBP", fee: "$12.00", time: "1-2 hours" },
    { country: "Japan", flag: "🇯🇵", currency: "JPY", fee: "$15.00", time: "Same day" },
    { country: "Singapore", flag: "🇸🇬", currency: "SGD", fee: "$10.00", time: "1 hour" },
    { country: "Australia", flag: "🇦🇺", currency: "AUD", fee: "$14.00", time: "2-4 hours" },
    { country: "Germany", flag: "🇩🇪", currency: "EUR", fee: "$11.00", time: "1-3 hours" }
  ];

  const recentRecipients = [
    { name: "Zhang Wei", country: "China", account: "****8901", lastTransfer: "2 days ago" },
    { name: "Emily Johnson", country: "UK", account: "****5643", lastTransfer: "1 week ago" },
    { name: "Hiroshi Tanaka", country: "Japan", account: "****2187", lastTransfer: "2 weeks ago" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">International Money Transfer</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Send money to over 190 countries with competitive exchange rates and ultra-fast delivery
          </p>
          <div className="flex justify-center flex-wrap gap-3">
            <Badge variant="outline" className="flex items-center">
              <Globe className="w-4 h-4 mr-1" />
              190+ Countries
            </Badge>
            <Badge variant="outline" className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Bank-Grade Security
            </Badge>
            <Badge variant="outline" className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Real-time Transfer
            </Badge>
            <Badge variant="outline" className="flex items-center">
              <Star className="w-4 h-4 mr-1" />
              Best Rates Guaranteed
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Transfer Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Transfer Calculator */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <span>Quick Transfer Calculator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label>You Send</Label>
                    <div className="flex mt-1">
                      <Select value={fromCurrency} onValueChange={setFromCurrency}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">🇺🇸 USD</SelectItem>
                          <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                          <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                          <SelectItem value="CNY">🇨🇳 CNY</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        className="flex-1 ml-2" 
                        placeholder="0.00"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div>
                    <Label>Recipient Gets</Label>
                    <div className="flex mt-1">
                      <Select value={toCurrency} onValueChange={setToCurrency}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNY">🇨🇳 CNY</SelectItem>
                          <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                          <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                          <SelectItem value="JPY">🇯🇵 JPY</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input className="flex-1 ml-2" placeholder="0.00" readOnly />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Exchange Rate:</span>
                    <span className="font-medium">1 {fromCurrency} = 7.23 {toCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Transfer Fee:</span>
                    <span className="font-medium">$8.00</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Delivery Time:</span>
                    <span className="font-medium text-green-600">Within 1 hour</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recipient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="w-5 h-5" />
                  <span>Recipient Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recent Recipients Quick Select */}
                <div>
                  <Label className="text-base font-medium">Recent Recipients</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    {recentRecipients.map((recipient, index) => (
                      <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-gray-600">{recipient.country} • {recipient.account}</div>
                        <div className="text-xs text-gray-500">{recipient.lastTransfer}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Label className="text-base font-medium">Add New Recipient</Label>
                  
                  {/* Personal Information */}
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>First Name *</Label>
                        <Input placeholder="Recipient's first name" className="mt-1" />
                      </div>
                      <div>
                        <Label>Last Name *</Label>
                        <Input placeholder="Recipient's last name" className="mt-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Middle Name</Label>
                        <Input placeholder="Middle name (if any)" className="mt-1" />
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input type="date" className="mt-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Phone Number *</Label>
                        <Input placeholder="Recipient's phone number" className="mt-1" />
                      </div>
                      <div>
                        <Label>Email Address</Label>
                        <Input type="email" placeholder="recipient@email.com" className="mt-1" />
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-3">Recipient Address</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Street Address *</Label>
                          <Input placeholder="Full street address" className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>City *</Label>
                            <Input placeholder="City" className="mt-1" />
                          </div>
                          <div>
                            <Label>State/Province</Label>
                            <Input placeholder="State or Province" className="mt-1" />
                          </div>
                          <div>
                            <Label>Postal Code</Label>
                            <Input placeholder="ZIP/Postal code" className="mt-1" />
                          </div>
                        </div>

                        <div>
                          <Label>Country *</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select recipient's country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cn">🇨🇳 China</SelectItem>
                              <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                              <SelectItem value="jp">🇯🇵 Japan</SelectItem>
                              <SelectItem value="sg">🇸🇬 Singapore</SelectItem>
                              <SelectItem value="au">🇦🇺 Australia</SelectItem>
                              <SelectItem value="de">🇩🇪 Germany</SelectItem>
                              <SelectItem value="fr">🇫🇷 France</SelectItem>
                              <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Banking Information */}
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-3">Banking Information</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Bank Name *</Label>
                          <Input placeholder="Recipient's bank name" className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Account Number/IBAN *</Label>
                            <div className="relative">
                              <Input 
                                type={showAccountDetails ? "text" : "password"}
                                placeholder="Account number or IBAN" 
                                className="mt-1 pr-10" 
                              />
                              <button
                                type="button"
                                onClick={() => setShowAccountDetails(!showAccountDetails)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              >
                                {showAccountDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label>SWIFT/BIC Code *</Label>
                            <Input placeholder="Bank's SWIFT code" className="mt-1" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Bank Branch</Label>
                            <Input placeholder="Branch name or code" className="mt-1" />
                          </div>
                          <div>
                            <Label>Routing Number</Label>
                            <Input placeholder="Routing/Sort code" className="mt-1" />
                          </div>
                        </div>

                        <div>
                          <Label>Bank Address</Label>
                          <Textarea placeholder="Complete bank address" className="mt-1" />
                        </div>
                      </div>
                    </div>

                    {/* Transfer Details */}
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-3">Transfer Details</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Transfer Purpose *</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select transfer purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="family">Family Support</SelectItem>
                              <SelectItem value="business">Business Payment</SelectItem>
                              <SelectItem value="education">Education Expenses</SelectItem>
                              <SelectItem value="investment">Investment</SelectItem>
                              <SelectItem value="property">Property Purchase</SelectItem>
                              <SelectItem value="medical">Medical Expenses</SelectItem>
                              <SelectItem value="travel">Travel Expenses</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Transfer Note</Label>
                          <Textarea 
                            placeholder="Optional message to recipient (will appear on their statement)" 
                            className="mt-1" 
                          />
                        </div>

                        <div>
                          <Label>Relationship to Recipient</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="family">Family Member</SelectItem>
                              <SelectItem value="friend">Friend</SelectItem>
                              <SelectItem value="business">Business Partner</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="vendor">Vendor/Supplier</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Summary */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Transfer Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Transfer Amount:</span>
                    <span className="font-medium">$1,000.00 USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exchange Rate:</span>
                    <span className="font-medium">1 USD = 7.23 CNY</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transfer Fee:</span>
                    <span className="font-medium">$8.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipient Gets:</span>
                    <span className="font-medium text-green-600">¥7,230.00 CNY</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Debit:</span>
                    <span className="font-bold">$1,008.00 USD</span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleInternationalTransfer}
                  >
                    Send Money Now
                  </Button>
                  <Button variant="outline" className="w-full">
                    Save as Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Exchange Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Live Exchange Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exchangeRates.map((rate, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{rate.flag}</span>
                        <div>
                          <div className="font-medium">{rate.from}/{rate.to}</div>
                          <div className="text-xs text-gray-500">Live Rate</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{rate.rate}</div>
                        <div className={`text-xs flex items-center space-x-1 ${
                          rate.trend === 'up' ? 'text-green-600' : 
                          rate.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <span>{rate.trend === 'up' ? '↗' : rate.trend === 'down' ? '↘' : '→'}</span>
                          <span>{rate.change}</span>
                          <span>({rate.changePercent})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-800 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Rates updated every 30 seconds</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  <History className="w-4 h-4 mr-2" />
                  Rate History
                </Button>
              </CardContent>
            </Card>

            {/* Popular Destinations */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Destinations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popularDestinations.map((dest, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{dest.flag}</span>
                          <div>
                            <div className="font-medium text-sm">{dest.country}</div>
                            <div className="text-xs text-gray-600">{dest.currency}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{dest.fee}</div>
                          <div className="text-xs text-gray-600">{dest.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transfer Features */}
            <Card>
              <CardHeader>
                <CardTitle>Why Choose World Bank?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Best Exchange Rates</div>
                    <div className="text-sm text-gray-500">Guaranteed competitive rates</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Bank-Grade Security</div>
                    <div className="text-sm text-gray-500">256-bit encryption & fraud protection</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Ultra-Fast Delivery</div>
                    <div className="text-sm text-gray-500">Real-time to same-day delivery</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium">24/7 Support</div>
                    <div className="text-sm text-gray-500">Multilingual customer service</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Live Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 mx-4">
            <h3 className="text-lg font-semibold mb-4">Enter Transfer PIN</h3>
            <p className="text-gray-600 text-sm mb-4">
              Please enter your 4-digit transfer PIN to authorize this international transfer.
            </p>
            
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter PIN"
                  value={transferPin}
                  onChange={(e) => setTransferPin(e.target.value)}
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                />
              </div>
              
              {pinError && (
                <p className="text-red-600 text-sm">{pinError}</p>
              )}
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPinModal(false);
                    setTransferPin('');
                    setPinError('');
                  }}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePinSubmit}
                  disabled={isProcessing || transferPin.length !== 4}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}
