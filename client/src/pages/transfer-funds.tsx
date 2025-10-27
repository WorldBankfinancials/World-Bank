import { useState, useEffect } from "react";
import * as React from "react";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar } from "@/components/Avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftRight, 
  Globe, 
  Building, 
  CreditCard, 
  Smartphone,
  Users,
  Clock,
  Shield,
  AlertCircle,
  ChevronRight,
  Bell,
  Check,
  ChevronDown
} from "lucide-react";

export default function TransferFunds() {
  const { t } = useLanguage();
  const [transferType, setTransferType] = useState("international");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("EN");
  
  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    currency: "usd",
    recipientName: "",
    recipientCountry: "",
    recipientAddress: "",
    recipientCity: "",
    recipientState: "",
    recipientPostalCode: "",
    recipientEmail: "",
    recipientPhone: "",
    bankName: "",
    bankAddress: "",
    bankCity: "",
    bankState: "",
    bankPostalCode: "",
    bankCountry: "",
    swiftCode: "",
    ibanNumber: "",
    accountNumber: "",
    routingNumber: "",
    branchCode: "",
    cardNumber: "",
    mobileNumber: "",
    mobileProvider: "",
    purpose: "",
    reference: ""
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = "Please enter a valid amount";
    }
    
    if (!formData.recipientName.trim()) {
      errors.recipientName = "Recipient name is required";
    }
    
    if (transferType === "international") {
      if (!formData.recipientCountry) errors.recipientCountry = "Recipient country is required";
      if (!formData.recipientAddress.trim()) errors.recipientAddress = "Recipient address is required";
      if (!formData.recipientCity.trim()) errors.recipientCity = "Recipient city is required";
      if (!formData.bankName.trim()) errors.bankName = "Bank name is required";
      if (!formData.bankAddress.trim()) errors.bankAddress = "Bank address is required";
      if (!formData.bankCity.trim()) errors.bankCity = "Bank city is required";
      if (!formData.bankCountry) errors.bankCountry = "Bank country is required";
      if (!formData.swiftCode.trim()) errors.swiftCode = "SWIFT/BIC code is required";
      if (!formData.accountNumber.trim()) errors.accountNumber = "Account number is required";
    } else if (transferType === "domestic") {
      if (!formData.routingNumber.trim()) errors.routingNumber = "Routing number is required";
      if (!formData.accountNumber.trim()) errors.accountNumber = "Account number is required";
    } else if (transferType === "card") {
      if (!formData.cardNumber.trim()) errors.cardNumber = "Card number is required";
    } else if (transferType === "mobile") {
      if (!formData.mobileNumber.trim()) errors.mobileNumber = "Mobile number is required";
      if (!formData.mobileProvider) errors.mobileProvider = "Provider is required";
    }
    
    if (!formData.purpose) {
      errors.purpose = "Purpose of transfer is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueTransfer = async () => {
    if (!validateForm()) {
      alert("Please fill in all required fields correctly.");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const amount = parseFloat(formData.amount);
      let fee = 0;
      
      switch (transferType) {
        case "international":
          fee = Math.max(25, Math.min(50, amount * 0.01));
          break;
        case "domestic":
          fee = amount > 1000 ? 15 : 0;
          break;
        case "card":
          fee = amount * 0.025 + 5;
          break;
        case "mobile":
          fee = Math.max(3, Math.min(15, amount * 0.015));
          break;
      }
      
      const total = amount + fee;
      
      // Create the transfer
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          fee: fee,
          total: total,
          transferType: transferType,
          recipientName: formData.recipientName,
          recipientCountry: formData.recipientCountry,
          recipientAccount: formData.accountNumber,
          bankName: formData.bankName,
          swiftCode: formData.swiftCode,
          purpose: formData.purpose,
          reference: formData.reference,
          transferPin: null // PIN verified separately via /api/verify-pin
        })
      });

      if (response.ok) {
        alert(`Transfer of $${amount.toFixed(2)} initiated successfully!`);
        window.location.href = '/transfer-processing';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transfer failed');
      }
      
    } catch (error: any) {
      alert(error.message || "Unable to process transfer. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveAsTemplate = () => {
    if (!formData.recipientName.trim()) {
      alert("Please enter recipient details to save as template");
      return;
    }
    
    const template = {
      name: `${formData.recipientName} - ${transferType}`,
      type: transferType,
      data: formData,
      created: new Date().toISOString()
    };
    
    // Save to localStorage
    const templates = JSON.parse(localStorage.getItem('transferTemplates') || '[]');
    templates.push(template);
    localStorage.setItem('transferTemplates', JSON.stringify(templates));
    
    alert(`Template saved: "${template.name}"`);
  };

  const languages = [
    { code: "EN", name: "English", flag: "🇺🇸" },
    { code: "中文", name: "Chinese", flag: "🇨🇳" }
  ];

  const transferMethods = [
    {
      id: "international",
      title: t('international_transfer_title'),
      description: t('international_transfer_desc'),
      icon: Globe,
      fees: "$25 - $50",
      time: "1-5 business days",
      limit: "$500,000"
    },
    {
      id: "domestic",
      title: t('domestic_transfer_title'),
      description: t('domestic_transfer_desc'),
      icon: Building,
      fees: "$0 - $15",
      time: t('same_day'),
      limit: "$100,000"
    },
    {
      id: "card",
      title: t('card_transfer_title'),
      description: t('card_transfer_desc'),
      icon: CreditCard,
      fees: "2.5% + $5",
      time: t('instant'),
      limit: "$10,000"
    },
    {
      id: "mobile",
      title: t('mobile_money_title'),
      description: t('mobile_money_desc'),
      icon: Smartphone,
      fees: "$3 - $15",
      time: t('minutes_to_hours'),
      limit: "$25,000"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with World Bank Logo */}
      <div className="bg-white px-4 py-3 shadow-sm relative">
        <div className="flex items-center justify-between">
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
              <div className="text-gray-900 font-semibold text-sm">{t('world_bank')}</div>
              <div className="text-xs text-gray-500">{t('international_banking')}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Avatar size={40} />
          </div>
        </div>
      </div>

      {/* Click outside to close language menu */}
      {showLanguageMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLanguageMenu(false)}
        />
      )}

      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transfer Funds</h1>
          <p className="text-gray-600">Send money between your accounts or to others</p>
        </div>

        {/* Transfer Method Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowLeftRight className="w-5 h-5 mr-2" />
              Select Transfer Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {transferMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                    transferType === method.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setTransferType(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transferType === method.id ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <method.icon className={`w-6 h-6 ${
                          transferType === method.id ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{method.title}</h3>
                        <p className="text-sm text-gray-600">{method.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-green-600 font-medium">Fee: {method.fees}</span>
                          <span className="text-xs text-gray-500">Time: {method.time}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Transfer Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              {transferType === "international" && <Globe className="w-5 h-5 mr-2 text-blue-600" />}
              {transferType === "domestic" && <Building className="w-5 h-5 mr-2 text-green-600" />}
              {transferType === "card" && <CreditCard className="w-5 h-5 mr-2 text-purple-600" />}
              {transferType === "mobile" && <Smartphone className="w-5 h-5 mr-2 text-orange-600" />}
              
              {transferType === "international" && "International Wire Transfer"}
              {transferType === "domestic" && "Domestic Bank Transfer"}
              {transferType === "card" && "Card to Card Transfer"}
              {transferType === "mobile" && "Mobile Money Transfer"}
            </CardTitle>
            
            {transferType === "international" && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>SWIFT Network • Bank Grade Security • Global Coverage</span>
              </div>
            )}
            
            {transferType === "mobile" && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>Available in 190+ Countries • Instant Transfer</span>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Transfer Amount */}
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-sm font-medium text-gray-700">Transfer Amount</Label>
              <div className="flex items-center space-x-3 mt-2">
                <div className="flex-1">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`text-xl font-semibold h-12 ${validationErrors.amount ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.amount && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
                  )}
                </div>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                    <SelectItem value="cny">CNY</SelectItem>
                    <SelectItem value="jpy">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recipient Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Recipient Information
              </h3>
              
              {transferType === "international" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipient-name">Recipient Name *</Label>
                      <Input 
                        id="recipient-name" 
                        placeholder="Full name" 
                        value={formData.recipientName}
                        onChange={(e) => handleInputChange('recipientName', e.target.value)}
                        className={validationErrors.recipientName ? 'border-red-500' : ''}
                      />
                      {validationErrors.recipientName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.recipientName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="recipient-country">Country *</Label>
                      <Select value={formData.recipientCountry} onValueChange={(value) => handleInputChange('recipientCountry', value)}>
                        <SelectTrigger className={validationErrors.recipientCountry ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="cn">China</SelectItem>
                          <SelectItem value="jp">Japan</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.recipientCountry && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.recipientCountry}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="recipient-address">Recipient Address *</Label>
                    <Input 
                      id="recipient-address" 
                      placeholder="Street address" 
                      value={formData.recipientAddress}
                      onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                      className={validationErrors.recipientAddress ? 'border-red-500' : ''}
                    />
                    {validationErrors.recipientAddress && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.recipientAddress}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipient-city">City *</Label>
                      <Input 
                        id="recipient-city" 
                        placeholder="City" 
                        value={formData.recipientCity}
                        onChange={(e) => handleInputChange('recipientCity', e.target.value)}
                        className={validationErrors.recipientCity ? 'border-red-500' : ''}
                      />
                      {validationErrors.recipientCity && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.recipientCity}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="recipient-postal">Postal Code</Label>
                      <Input 
                        id="recipient-postal" 
                        placeholder="ZIP/Postal code" 
                        value={formData.recipientPostalCode}
                        onChange={(e) => handleInputChange('recipientPostalCode', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank-name">Bank Name *</Label>
                      <Input 
                        id="bank-name" 
                        placeholder="Bank name" 
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        className={validationErrors.bankName ? 'border-red-500' : ''}
                      />
                      {validationErrors.bankName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.bankName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="bank-address">Bank Address *</Label>
                      <Input 
                        id="bank-address" 
                        placeholder="Bank address" 
                        value={formData.bankAddress}
                        onChange={(e) => handleInputChange('bankAddress', e.target.value)}
                        className={validationErrors.bankAddress ? 'border-red-500' : ''}
                      />
                      {validationErrors.bankAddress && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.bankAddress}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="swift-code">SWIFT Code *</Label>
                      <Input 
                        id="swift-code" 
                        placeholder="SWIFT/BIC code" 
                        value={formData.swiftCode}
                        onChange={(e) => handleInputChange('swiftCode', e.target.value)}
                        className={validationErrors.swiftCode ? 'border-red-500' : ''}
                      />
                      {validationErrors.swiftCode && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.swiftCode}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="account-number">Account Number *</Label>
                      <Input 
                        id="account-number" 
                        placeholder="Account number" 
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        className={validationErrors.accountNumber ? 'border-red-500' : ''}
                      />
                      {validationErrors.accountNumber && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.accountNumber}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {transferType === "domestic" && (
                <>
                  <div>
                    <Label htmlFor="recipient-name-domestic">Recipient Name</Label>
                    <Input id="recipient-name-domestic" placeholder="Full name" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="routing-number">Routing Number</Label>
                      <Input id="routing-number" placeholder="9-digit routing number" />
                    </div>
                    <div>
                      <Label htmlFor="account-number-domestic">Account Number</Label>
                      <Input id="account-number-domestic" placeholder="Account number" />
                    </div>
                  </div>
                </>
              )}

              {transferType === "card" && (
                <>
                  <div>
                    <Label htmlFor="recipient-name-card">Recipient Name</Label>
                    <Input id="recipient-name-card" placeholder="Name on card" />
                  </div>
                  <div>
                    <Label htmlFor="card-number">Recipient Card Number</Label>
                    <Input id="card-number" placeholder="1234 5678 9012 3456" />
                  </div>
                </>
              )}

              {transferType === "mobile" && (
                <>
                  <div>
                    <Label htmlFor="recipient-name-mobile">Recipient Name</Label>
                    <Input id="recipient-name-mobile" placeholder="Full name" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mobile-number">Mobile Number</Label>
                      <Input id="mobile-number" placeholder="+1 234 567 8900" />
                    </div>
                    <div>
                      <Label htmlFor="mobile-provider">Provider</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mpesa">M-Pesa (Kenya)</SelectItem>
                          <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                          <SelectItem value="airtel">Airtel Money</SelectItem>
                          <SelectItem value="orange">Orange Money</SelectItem>
                          <SelectItem value="gcash">GCash (Philippines)</SelectItem>
                          <SelectItem value="paymaya">PayMaya (Philippines)</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Purpose and Reference */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="purpose">Purpose of Transfer</Label>
                <Select value={formData.purpose} onValueChange={(value) => handleInputChange('purpose', value)}>
                  <SelectTrigger className={validationErrors.purpose ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family Support</SelectItem>
                    <SelectItem value="business">Business Payment</SelectItem>
                    <SelectItem value="education">Education Expenses</SelectItem>
                    <SelectItem value="medical">Medical Treatment</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="property">Property Purchase</SelectItem>
                    <SelectItem value="travel">Travel Expenses</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.purpose && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.purpose}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="reference">Reference/Message (Optional)</Label>
                <Input 
                  id="reference" 
                  placeholder="Payment reference or message" 
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                />
              </div>
            </div>

            {/* Transfer Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Transfer Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer Fee:</span>
                  <span className="font-medium">
                    {transferMethods.find(m => m.id === transferType)?.fees}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="font-medium">
                    {transferMethods.find(m => m.id === transferType)?.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Limit:</span>
                  <span className="font-medium">
                    {transferMethods.find(m => m.id === transferType)?.limit}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-amber-800">Security Notice</h5>
                  <p className="text-sm text-amber-700 mt-1">
                    {transferType === "international" 
                      ? "International transfers require additional verification for amounts over $10,000 and may be subject to regulatory compliance checks."
                      : "All transfers are secured with bank-level encryption and monitoring."
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={saveAsTemplate}
                disabled={isProcessing}
              >
                Save as Template
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleContinueTransfer}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue Transfer"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
