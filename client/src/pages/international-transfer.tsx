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
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import type { User } from "@shared/schema";

export default function InternationalTransfer() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');

  // State for the form and submission
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    recipientName: '',
    recipientAccount: '',
    recipientCountry: 'CN',
    bankName: '',
    swiftCode: '',
    purpose: '',
  });
  const [errors, setErrors] = useState({
    amount: '',
    recipientName: '',
    recipientAccount: '',
    recipientCountry: '',
    bankName: '',
    swiftCode: '',
    submit: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { data: userData, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Mock data for calculations and display
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

  // Validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
      isValid = false;
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Invalid amount';
      isValid = false;
    } else {
      newErrors.amount = '';
    }

    if (!formData.recipientName) {
      newErrors.recipientName = 'Recipient name is required';
      isValid = false;
    } else {
      newErrors.recipientName = '';
    }

    if (!formData.recipientAccount) {
      newErrors.recipientAccount = 'Recipient account is required';
      isValid = false;
    } else {
      newErrors.recipientAccount = '';
    }

    if (!formData.recipientCountry) {
      newErrors.recipientCountry = 'Recipient country is required';
      isValid = false;
    } else {
      newErrors.recipientCountry = '';
    }

    if (!formData.bankName) {
      newErrors.bankName = 'Bank name is required';
      isValid = false;
    } else {
      newErrors.bankName = '';
    }

    if (!formData.swiftCode) {
      newErrors.swiftCode = 'SWIFT/BIC code is required';
      isValid = false;
    } else {
      newErrors.swiftCode = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific error on input change
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Handle currency change
  const handleCurrencyChange = (field: 'from' | 'to', value: string) => {
    if (field === 'from') {
      setFromCurrency(value);
      setFormData(prev => ({ ...prev, currency: value }));
    } else {
      setToCurrency(value);
    }
  };

  // Handle recipient country change
  const handleRecipientCountryChange = (value: string) => {
    setFormData(prev => ({ ...prev, recipientCountry: value }));
    setErrors(prev => ({ ...prev, recipientCountry: '' }));
  };

  // Handle transfer purpose change
  const handlePurposeChange = (value: string) => {
    setFormData(prev => ({ ...prev, purpose: value }));
  };

  // Mock submission handler (will be replaced by actual API call)
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const transferData = {
        transactionId: `WB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        recipientName: formData.recipientName,
        recipientAccount: formData.recipientAccount,
        recipientCountry: formData.recipientCountry,
        bankName: formData.bankName,
        swiftCode: formData.swiftCode,
        transferType: 'international_transfer',
        purpose: formData.purpose || 'Personal transfer',
        status: 'pending_approval'
      };

      const response = await fetch('/api/transfers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      if (!response.ok) {
        throw new Error('Transfer submission failed');
      }

      const result = await response.json();

      if (result.success) {
        // Store transfer details for success page
        sessionStorage.setItem('transferDetails', JSON.stringify({
          ...transferData,
          transactionId: result.transactionId || transferData.transactionId
        }));

        setLocation('/transfer-pending');
      } else {
        throw new Error(result.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setErrors({ ...errors, submit: 'Failed to submit transfer. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Update formData and clear related errors when input changes
  const handleInputChangeWithClearError = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Mock function to calculate recipient gets amount (based on current selection)
  const calculateRecipientGets = () => {
    const amount = parseFloat(transferAmount) || 0;
    const rateData = exchangeRates.find(rate => rate.from === fromCurrency && rate.to === toCurrency);
    if (!rateData) return "0.00";
    const rate = parseFloat(rateData.rate);
    return (amount * rate).toFixed(2);
  };

  // Mock function to get transfer fee (based on recipient country)
  const getTransferFee = () => {
    const destination = popularDestinations.find(dest => dest.currency === toCurrency);
    return destination ? destination.fee : "$10.00";
  };

  // Mock function to get delivery time (based on recipient country)
  const getDeliveryTime = () => {
    const destination = popularDestinations.find(dest => dest.currency === toCurrency);
    return destination ? destination.time : "1-2 business days";
  };

  // Effect to pre-fill form if user is logged in and has default data
  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        recipientName: userData.name || '',
        // Assuming user object might have address or account details, adjust as needed
        // recipientAccount: userData.accountNumber || '',
        // recipientCountry: userData.country || '',
      }));
    }
  }, [userData]);


  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userData} />

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
                <form onSubmit={handleTransferSubmit}> {/* Wrap calculator inputs in a form */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label htmlFor="amount">You Send</Label>
                      <div className="flex mt-1">
                        <Select value={fromCurrency} onValueChange={(value) => handleCurrencyChange('from', value)}>
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
                          id="amount"
                          name="amount"
                          className="flex-1 ml-2" 
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={handleInputChangeWithClearError}
                          aria-invalid={!!errors.amount}
                          aria-describedby={errors.amount ? "amount-error" : undefined}
                        />
                      </div>
                      {errors.amount && <p id="amount-error" className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                    </div>

                    <div className="flex justify-center">
                      <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                    </div>

                    <div>
                      <Label>Recipient Gets</Label>
                      <div className="flex mt-1">
                        <Select value={toCurrency} onValueChange={(value) => handleCurrencyChange('to', value)}>
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
                        <Input className="flex-1 ml-2" placeholder="0.00" readOnly value={calculateRecipientGets()} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Exchange Rate:</span>
                      <span className="font-medium">1 {fromCurrency} = {exchangeRates.find(rate => rate.from === fromCurrency && rate.to === toCurrency)?.rate ?? 'N/A'} {toCurrency}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Transfer Fee:</span>
                      <span className="font-medium">{getTransferFee()}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Delivery Time:</span>
                      <span className="font-medium text-green-600">{getDeliveryTime()}</span>
                    </div>
                  </div>
                  {/* Add a hidden submit button for the form if needed for Enter key submission */}
                </form>
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
                      <button 
                        key={index} 
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer text-left"
                        onClick={() => {
                          setFormData({
                            recipientName: recipient.name,
                            recipientAccount: recipient.account.replace('****', ''), // Remove masking for actual use
                            recipientCountry: recipient.country === 'UK' ? 'GB' : recipient.country === 'China' ? 'CN' : recipient.country === 'Japan' ? 'JP' : '', // Map to country codes if necessary
                            bankName: 'Mock Bank Name', // Placeholder
                            swiftCode: 'MOCKSWIFT', // Placeholder
                            amount: transferAmount,
                            purpose: 'Family Support'
                          });
                          setErrors({ ...errors, recipientName: '', recipientAccount: '', recipientCountry: '', bankName: '', swiftCode: '' });
                        }}
                      >
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-gray-600">{recipient.country} • {recipient.account}</div>
                        <div className="text-xs text-gray-500">{recipient.lastTransfer}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Label className="text-base font-medium">Add New Recipient</Label>

                  <form onSubmit={handleTransferSubmit} className="mt-4 space-y-4">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="recipientName">First Name *</Label>
                        <Input 
                          id="recipientName"
                          name="recipientName"
                          placeholder="Recipient's first name" 
                          className="mt-1" 
                          value={formData.recipientName}
                          onChange={handleInputChangeWithClearError}
                          aria-invalid={!!errors.recipientName}
                          aria-describedby={errors.recipientName ? "recipientName-error" : undefined}
                        />
                        {errors.recipientName && <p id="recipientName-error" className="text-red-500 text-sm mt-1">{errors.recipientName}</p>}
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
                          <Select name="recipientCountry" value={formData.recipientCountry} onValueChange={handleRecipientCountryChange}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select recipient's country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CN">🇨🇳 China</SelectItem>
                              <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                              <SelectItem value="JP">🇯🇵 Japan</SelectItem>
                              <SelectItem value="SG">🇸🇬 Singapore</SelectItem>
                              <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                              <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                              <SelectItem value="FR">🇫🇷 France</SelectItem>
                              <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.recipientCountry && <p className="text-red-500 text-sm mt-1">{errors.recipientCountry}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Banking Information */}
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-3">Banking Information</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Bank Name *</Label>
                          <Input 
                            name="bankName"
                            placeholder="Recipient's bank name" 
                            className="mt-1" 
                            value={formData.bankName}
                            onChange={handleInputChangeWithClearError}
                            aria-invalid={!!errors.bankName}
                            aria-describedby={errors.bankName ? "bankName-error" : undefined}
                          />
                          {errors.bankName && <p id="bankName-error" className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Account Number/IBAN *</Label>
                            <div className="relative">
                              <Input 
                                type={showAccountDetails ? "text" : "password"}
                                name="recipientAccount"
                                placeholder="Account number or IBAN" 
                                className="mt-1 pr-10" 
                                value={formData.recipientAccount}
                                onChange={handleInputChangeWithClearError}
                                aria-invalid={!!errors.recipientAccount}
                                aria-describedby={errors.recipientAccount ? "recipientAccount-error" : undefined}
                              />
                              {errors.recipientAccount && <p id="recipientAccount-error" className="text-red-500 text-sm mt-1">{errors.recipientAccount}</p>}
                              <button
                                type="button"
                                onClick={() => setShowAccountDetails(!showAccountDetails)}
                                className="absolute inset-y-0 right-3 flex items-center"
                              >
                                {showAccountDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label>SWIFT/BIC Code *</Label>
                            <Input 
                              name="swiftCode"
                              placeholder="Bank's SWIFT code" 
                              className="mt-1" 
                              value={formData.swiftCode}
                              onChange={handleInputChangeWithClearError}
                              aria-invalid={!!errors.swiftCode}
                              aria-describedby={errors.swiftCode ? "swiftCode-error" : undefined}
                            />
                            {errors.swiftCode && <p id="swiftCode-error" className="text-red-500 text-sm mt-1">{errors.swiftCode}</p>}
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
                          <Select name="purpose" onValueChange={handlePurposeChange}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select transfer purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Family Support">Family Support</SelectItem>
                              <SelectItem value="Business Payment">Business Payment</SelectItem>
                              <SelectItem value="Education Expenses">Education Expenses</SelectItem>
                              <SelectItem value="Investment">Investment</SelectItem>
                              <SelectItem value="Property Purchase">Property Purchase</SelectItem>
                              <SelectItem value="Medical Expenses">Medical Expenses</SelectItem>
                              <SelectItem value="Travel Expenses">Travel Expenses</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
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
                              <SelectItem value="Family Member">Family Member</SelectItem>
                              <SelectItem value="Friend">Friend</SelectItem>
                              <SelectItem value="Business Partner">Business Partner</SelectItem>
                              <SelectItem value="Employee">Employee</SelectItem>
                              <SelectItem value="Vendor/Supplier">Vendor/Supplier</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Submission Button */}
                    <div className="mt-6 pt-4 border-t">
                      {errors.submit && <p className="text-red-500 text-sm mb-2">{errors.submit}</p>}
                      <Button 
                        type="submit"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Continue'}
                      </Button>
                    </div>
                  </form>
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
                    <span className="font-medium">{transferAmount ? `${parseFloat(transferAmount).toFixed(2)} ${fromCurrency}` : '0.00 USD'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exchange Rate:</span>
                    <span className="font-medium">1 {fromCurrency} = {exchangeRates.find(rate => rate.from === fromCurrency && rate.to === toCurrency)?.rate ?? 'N/A'} {toCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transfer Fee:</span>
                    <span className="font-medium">{getTransferFee()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipient Gets:</span>
                    <span className="font-medium text-green-600">{calculateRecipientGets()} {toCurrency}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Debit:</span>
                    <span className="font-bold">
                      ${(parseFloat(transferAmount || '0') + parseFloat(getTransferFee().replace('$', ''))).toFixed(2)} {fromCurrency}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleTransferSubmit}
                    disabled={isLoading}
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
                    <button 
                      key={index} 
                      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setToCurrency(dest.currency);
                        setFormData(prev => ({ ...prev, recipientCountry: dest.country === 'United Kingdom' ? 'GB' : dest.country === 'China' ? 'CN' : dest.country === 'Japan' ? 'JP' : '' })); // Set country based on destination
                      }}
                    >
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
                    </button>
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

      <Footer />
    </div>
  );
}