import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Send, 
  Globe, 
  Building, 
  Smartphone,
  Users,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Calculator
} from "lucide-react";
import type { User } from "@shared/schema";

export default function Transfer() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  const { userProfile } = useAuth();
  
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [transferType, setTransferType] = useState("international");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [transferPin, setTransferPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPendingStatus, setShowPendingStatus] = useState(false);
  const [transferReference, setTransferReference] = useState("");
  
  // International transfer details
  const [recipientDetails, setRecipientDetails] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phoneNumber: "",
    email: "",
    bankName: "",
    bankAddress: "",
    swiftCode: "",
    iban: "",
    accountNumber: "",
    routingNumber: "",
    purpose: "",
    relationship: ""
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const quickTransferOptions = [
    { icon: Globe, label: "International Wire", description: "SWIFT transfers worldwide", action: () => setTransferType("international") },
    { icon: Building, label: "Cross-Border Bank", description: "Bank to bank transfers", action: () => setTransferType("bank") },
    { icon: Smartphone, label: "Global Mobile Money", description: "190+ countries coverage", action: () => setTransferType("mobile") },
    { icon: Send, label: "Express Transfer", description: "Fast international delivery", action: () => setTransferType("express") }
  ];

  const recentContacts = [
    { name: "John Smith", account: "****1234", lastAmount: "$500" },
    { name: "Sarah Wilson", account: "****5678", lastAmount: "$1,200" },
    { name: "Mike Chen", account: "****9012", lastAmount: "$750" }
  ];

  const handleTransfer = () => {
    if (!amount || !recipientDetails.fullName || !recipientDetails.accountNumber) {
      alert("Please complete all required transfer details");
      return;
    }

    // Show PIN verification modal
    setShowPinVerification(true);
  };

  const verifyPinAndTransfer = async () => {
    console.log('Regular transfer PIN submitted:', transferPin);
    
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
      // Verify PIN and create transfer request
      const transferData = {
        amount: parseFloat(amount),
        recipientName: recipientDetails.fullName,
        recipientAccount: recipientDetails.accountNumber,
        recipientCountry: recipientDetails.country,
        bankName: recipientDetails.bankName,
        swiftCode: recipientDetails.swiftCode,
        transferPurpose: recipientDetails.purpose,
        transferPin: transferPin,
        status: "pending_approval",
        requiresApproval: parseFloat(amount) >= 10000 // Transfers over $10k require admin approval
      };
      
      console.log('Sending regular transfer data:', transferData);

      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });

      console.log('Regular transfer response status:', response.status);
      
      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText);
        setPinError(`Transfer failed. Server error: ${response.status}`);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Transfer successful:', result);
        setShowPinVerification(false);
        setTransferPin("");
        setTransferReference(result.transactionId || result.id || `WB-${Date.now()}`);
        
        // Show pending status instead of alert
        setShowPendingStatus(true);
        
        // Reset form
        setAmount("");
        setRecipientDetails({
          fullName: "",
          address: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
          phoneNumber: "",
          email: "",
          bankName: "",
          bankAddress: "",
          swiftCode: "",
          iban: "",
          accountNumber: "",
          routingNumber: "",
          purpose: "",
          relationship: ""
        });
      } else {
        const error = await response.json();
        console.error('Transfer error:', error);
        setPinError(error.message || "Invalid PIN. Please try PIN: 0192");
      }
    } catch (error) {
      console.error('Regular transfer error:', error);
      setPinError("Network connection error. Check your internet and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Show pending status interface
  if (showPendingStatus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={userProfile || undefined} />
        
        <div className="px-4 py-6 pb-20">
          <div className="max-w-md mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-10 h-10 text-orange-600 animate-spin" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Transfer Processing</h2>
                  <p className="text-gray-600 mb-4">
                    Your international transfer is being processed securely through our banking network.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Reference Number</span>
                    <span className="font-mono text-sm font-medium">{transferReference}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-medium text-orange-600">Processing</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estimated Time</span>
                    <span className="text-sm font-medium">1-3 business days</span>
                  </div>
                </div>
                
                <div className="text-left space-y-3 mb-6">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Transfer request verified</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-sm text-gray-700">Compliance review in progress</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-500">Processing to recipient bank</span>
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
                    onClick={() => setShowPendingStatus(false)}
                  >
                    New Transfer
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Track Transfer
                  </Button>
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
      <Header user={userProfile || user} />
      
      <div className="px-4 py-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">International Money Transfer</h1>
            <p className="text-sm text-gray-600">Send money worldwide with complete recipient details</p>
          </div>
          <div className="flex space-x-2">
            <Badge className="bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" />
              Secure
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              <Globe className="w-3 h-3 mr-1" />
              190+ Countries
            </Badge>
          </div>
        </div>

        {/* Quick Transfer Options */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transfer Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickTransferOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={option.action}
                  className={`h-20 flex flex-col items-center space-y-2 ${
                    transferType === option.label.toLowerCase().replace(" ", "") ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <option.icon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="text-xs font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* International Transfer Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>International Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transfer Amount */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label htmlFor="amount" className="text-lg font-semibold">Transfer Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-bold text-center mt-2"
              />
              <p className="text-sm text-gray-600 mt-1">Exchange rate: 1 USD = 1.00 USD • Fee: $15.00</p>
            </div>

            {/* Recipient Information - Simplified */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Recipient Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="John Smith"
                    value={recipientDetails.fullName}
                    onChange={(e) => setRecipientDetails(prev => ({...prev, fullName: e.target.value}))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select value={recipientDetails.country} onValueChange={(value) => setRecipientDetails(prev => ({...prev, country: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="CN">China</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="IN">India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+1 555 123 4567"
                      value={recipientDetails.phoneNumber}
                      onChange={(e) => setRecipientDetails(prev => ({...prev, phoneNumber: e.target.value}))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Bank Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="JPMorgan Chase Bank"
                    value={recipientDetails.bankName}
                    onChange={(e) => setRecipientDetails(prev => ({...prev, bankName: e.target.value}))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bankAddress">Bank Address</Label>
                  <Input
                    id="bankAddress"
                    placeholder="270 Park Avenue, New York, NY 10017"
                    value={recipientDetails.bankAddress}
                    onChange={(e) => setRecipientDetails(prev => ({...prev, bankAddress: e.target.value}))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
                    <Input
                      id="swiftCode"
                      placeholder="CHASUS33"
                      value={recipientDetails.swiftCode}
                      onChange={(e) => setRecipientDetails(prev => ({...prev, swiftCode: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="iban">IBAN (if applicable)</Label>
                    <Input
                      id="iban"
                      placeholder="GB82 WEST 1234 5698 7654 32"
                      value={recipientDetails.iban}
                      onChange={(e) => setRecipientDetails(prev => ({...prev, iban: e.target.value}))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="123456789"
                      value={recipientDetails.accountNumber}
                      onChange={(e) => setRecipientDetails(prev => ({...prev, accountNumber: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number (US)</Label>
                    <Input
                      id="routingNumber"
                      placeholder="021000021"
                      value={recipientDetails.routingNumber}
                      onChange={(e) => setRecipientDetails(prev => ({...prev, routingNumber: e.target.value}))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Purpose */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Transfer Purpose</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="purpose">Purpose of Transfer</Label>
                  <Select value={recipientDetails.purpose} onValueChange={(value) => setRecipientDetails(prev => ({...prev, purpose: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family_support">Family Support</SelectItem>
                      <SelectItem value="education">Education Expenses</SelectItem>
                      <SelectItem value="medical">Medical Expenses</SelectItem>
                      <SelectItem value="business">Business Payment</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="property">Property Purchase</SelectItem>
                      <SelectItem value="gift">Gift</SelectItem>
                      <SelectItem value="loan_repayment">Loan Repayment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="relationship">Relationship to Recipient</Label>
                  <Select value={recipientDetails.relationship} onValueChange={(value) => setRecipientDetails(prev => ({...prev, relationship: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family Member</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="business_partner">Business Partner</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="service_provider">Service Provider</SelectItem>
                      <SelectItem value="myself">Myself</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Transfer Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Transfer Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Transfer Amount:</span>
                  <span className="font-medium">${amount || "0.00"} USD</span>
                </div>
                <div className="flex justify-between">
                  <span>Transfer Fee:</span>
                  <span className="font-medium">$15.00 USD</span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span className="font-medium">1.0000</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total Debit:</span>
                  <span>${amount ? (parseFloat(amount) + 15).toFixed(2) : "15.00"} USD</span>
                </div>
                <div className="flex justify-between font-semibold text-green-600">
                  <span>Recipient Receives:</span>
                  <span>${amount || "0.00"} USD</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleTransfer}
              disabled={!amount || !recipientDetails.fullName || !recipientDetails.accountNumber || isProcessing}
              className="w-full bg-blue-600 text-white h-12 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Processing Transfer...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Send ${amount || "0.00"} Internationally
                </>
              )}
            </Button>
            
            {/* PIN Verification Modal */}
            {showPinVerification && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Transfer PIN</h3>
                    <p className="text-sm text-gray-600">
                      Please enter your 4-digit PIN to authorize this ${amount} transfer
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <input
                      type="password"
                      value={transferPin}
                      onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full text-center text-2xl tracking-widest p-4 border border-gray-300 rounded-lg"
                      placeholder="****"
                      maxLength={4}
                      autoFocus
                    />
                    {pinError && (
                      <p className="text-red-600 text-sm mt-2 text-center">{pinError}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPinVerification(false);
                        setTransferPin("");
                        setPinError("");
                      }}
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={verifyPinAndTransfer}
                      disabled={transferPin.length !== 4 || isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isProcessing ? "Processing..." : "Confirm Transfer"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.account}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Last: {contact.lastAmount}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setRecipient(contact.name)}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}