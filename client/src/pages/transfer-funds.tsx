import { useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  ArrowLeftRight, 
  Globe, 
  Building, 
  CreditCard, 
  Smartphone,
  Clock,
  Shield,
  AlertCircle,
  ChevronRight,
  Bell,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { transferFormSchema, type TransferForm } from '@shared/schema';
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

// All Countries for transfer
const ALL_COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "New Zealand",
  "Germany", "France", "Spain", "Italy", "Netherlands", "Belgium", "Switzerland",
  "Sweden", "Norway", "Denmark", "Finland", "Poland", "Portugal", "Ireland",
  "Japan", "China", "South Korea", "Singapore", "Hong Kong", "Taiwan",
  "Thailand", "Vietnam", "Philippines", "Indonesia", "Malaysia",
  "India", "Pakistan", "Bangladesh", "Sri Lanka",
  "Mexico", "Brazil", "Argentina", "Chile", "Colombia",
  "South Africa", "Egypt", "Nigeria", "Kenya",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait",
  "Russia", "Turkey", "Greece", "Ukraine"
];

export default function TransferFunds() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [transferType, setTransferType] = useState("international");
  const [isPending, setIsPending] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [transferPin, setTransferPin] = useState("");
  const [formData, setFormData] = useState<TransferForm | null>(null);
  
  const form = useForm<TransferForm>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      amount: 0,
      recipientName: "",
      recipientCountry: "",
      recipientAddress: "",
      recipientCity: "",
      bankName: "",
      bankAddress: "",
      bankCity: "",
      bankCountry: "",
      swiftCode: "",
      accountNumber: "",
      routingNumber: "",
      cardNumber: "",
      mobileNumber: "",
      mobileProvider: "",
      purpose: "",
      reference: ""
    }
  });

  const onSubmit = async (data: TransferForm) => {
    // Show PIN verification modal
    setFormData(data);
    setShowPinModal(true);
  };

  const verifyPinAndTransfer = async () => {
    if (!transferPin || transferPin.length !== 4) {
      toast({
        title: 'Invalid PIN',
        description: 'Please enter a 4-digit PIN',
        variant: 'destructive'
      });
      return;
    }

    if (!formData) return;

    try {
      setIsPending(true);
      const amount = formData.amount;
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
      
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(formData.amount),
          recipientName: formData.recipientName,
          recipientCountry: formData.recipientCountry,
          recipientAccount: formData.accountNumber || formData.recipientAccount,
          bankName: formData.bankName,
          swiftCode: formData.swiftCode,
          purpose: formData.purpose,
          transferPin: String(transferPin)
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: '✓ Transfer Submitted',
          description: `Your transfer ${result.transactionId} has been submitted successfully and is pending approval.`,
        });
        form.reset();
        setShowPinModal(false);
        setTransferPin("");
        setFormData(null);
        setTimeout(() => window.location.href = '/dashboard', 2000);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Transfer error:', errorData);
        toast({
          title: 'Transfer Failed',
          description: errorData.message || 'Failed to process transfer. Please check your details and try again.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsPending(false);
    }
  };

  const transferMethods = [
    {
      id: "international",
      title: "International Wire",
      description: "SWIFT transfers worldwide",
      icon: Globe,
      fees: "$25 - $50",
      time: "1-5 business days",
      limit: "$500,000"
    },
    {
      id: "domestic",
      title: "Domestic Transfer",
      description: "Bank to bank transfers",
      icon: Building,
      fees: "$0 - $15",
      time: "Same day",
      limit: "$100,000"
    },
    {
      id: "card",
      title: "Card Transfer",
      description: "Instant card transfers",
      icon: CreditCard,
      fees: "2.5% + $5",
      time: "Instant",
      limit: "$10,000"
    },
    {
      id: "mobile",
      title: "Mobile Money",
      description: "Mobile wallet transfer",
      icon: Smartphone,
      fees: "$3 - $15",
      time: "Minutes to hours",
      limit: "$25,000"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header user={userProfile as any} />
      
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{t('international_transfer_title')}</h1>
          <p className="text-gray-600 mt-2 text-lg">{t('send_money_worldwide')}</p>
        </div>

        {/* Transfer Type Tabs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('select_transfer_method')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={transferType} onValueChange={setTransferType} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {transferMethods.map(method => (
                  <TabsTrigger key={method.id} value={method.id} className="text-xs md:text-sm">
                    <method.icon className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{method.title.split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {transferMethods.map(method => (
                <TabsContent key={method.id} value={method.id} className="mt-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-blue-900">{method.title}</h3>
                    <p className="text-sm text-blue-700 mt-1">{method.description}</p>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">Fee</p>
                        <p className="text-blue-900 font-bold">{method.fees}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">Time</p>
                        <p className="text-blue-900 font-bold">{method.time}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">Limit</p>
                        <p className="text-blue-900 font-bold">{method.limit}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Transfer Form */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle>{t('transfer_details')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Amount Section */}
              <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                <Label htmlFor="amount" className="text-lg font-bold text-blue-900">{t('transfer_amount')} *</Label>
                <Input 
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("amount", { valueAsNumber: true })}
                  className="text-2xl font-bold text-center mt-3 py-3"
                />
                {form.formState.errors.amount && (
                  <p className="text-red-600 text-sm mt-2">{form.formState.errors.amount.message}</p>
                )}
                <p className="text-sm text-blue-700 mt-3 font-medium">Estimated fee: ${((form.watch('amount') || 0) * 0.02).toFixed(2)}</p>
              </div>

              {/* Recipient Information */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('recipient_information')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipientName" className="font-semibold">Full Name *</Label>
                    <Input 
                      id="recipientName"
                      placeholder="John Smith"
                      {...form.register("recipientName")}
                      className="mt-2"
                    />
                    {form.formState.errors.recipientName && (
                      <p className="text-red-600 text-sm mt-1">{form.formState.errors.recipientName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="recipientCountry" className="font-semibold">Country *</Label>
                    <Select value={form.watch("recipientCountry") || ""} onValueChange={(value) => form.setValue("recipientCountry", value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.recipientCountry && (
                      <p className="text-red-600 text-sm mt-1">{form.formState.errors.recipientCountry.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="recipientAddress" className="font-semibold">Street Address *</Label>
                    <Input 
                      id="recipientAddress"
                      placeholder="123 Main Street"
                      {...form.register("recipientAddress")}
                      className="mt-2"
                    />
                    {form.formState.errors.recipientAddress && (
                      <p className="text-red-600 text-sm mt-1">{form.formState.errors.recipientAddress.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipientCity" className="font-semibold">City *</Label>
                      <Input 
                        id="recipientCity"
                        placeholder="New York"
                        {...form.register("recipientCity")}
                        className="mt-2"
                      />
                      {form.formState.errors.recipientCity && (
                        <p className="text-red-600 text-sm mt-1">{form.formState.errors.recipientCity.message}</p>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('bank_information') || 'Bank Information'}</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bankName" className="font-semibold">Bank Name *</Label>
                    <Input 
                      id="bankName"
                      placeholder="e.g., JP Morgan Chase"
                      {...form.register("bankName")}
                      className="mt-2"
                    />
                    {form.formState.errors.bankName && (
                      <p className="text-red-600 text-sm mt-1">{form.formState.errors.bankName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="swiftCode" className="font-semibold">SWIFT/BIC Code *</Label>
                      <Input 
                        id="swiftCode"
                        placeholder="e.g., CHASUS33"
                        {...form.register("swiftCode")}
                        className="mt-2"
                      />
                      {form.formState.errors.swiftCode && (
                        <p className="text-red-600 text-sm mt-1">{form.formState.errors.swiftCode.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="accountNumber" className="font-semibold">Account Number *</Label>
                      <Input 
                        id="accountNumber"
                        placeholder="123456789"
                        {...form.register("accountNumber")}
                        className="mt-2"
                      />
                      {form.formState.errors.accountNumber && (
                        <p className="text-red-600 text-sm mt-1">{form.formState.errors.accountNumber.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bankAddress" className="font-semibold">Bank Address</Label>
                    <Input 
                      id="bankAddress"
                      placeholder="270 Park Avenue, New York, NY"
                      {...form.register("bankAddress")}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Purpose & Reference */}
              <div className="border-t pt-6 space-y-4">
                <div>
                  <Label htmlFor="purpose" className="font-semibold">Purpose of Transfer *</Label>
                  <Select value={form.watch("purpose") || ""} onValueChange={(value) => form.setValue("purpose", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Transfer</SelectItem>
                      <SelectItem value="business">Business Payment</SelectItem>
                      <SelectItem value="salary">Salary/Wages</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.purpose && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.purpose.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reference" className="font-semibold">Reference/Message (Optional)</Label>
                  <Input 
                    id="reference"
                    placeholder="Add a note for the recipient"
                    {...form.register("reference")}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 text-lg rounded-lg mt-8"
              >
                Continue Transfer
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="mt-6 bg-yellow-50 border-yellow-300">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-yellow-900">Security Notice</p>
                <p className="text-sm text-yellow-800 mt-2">International transfers require PIN verification. Transfers over $10,000 may require additional compliance checks.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIN Verification Modal */}
      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Verify Transfer with PIN
            </DialogTitle>
            <DialogDescription>
              Enter your 4-digit security PIN to confirm this transfer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="pin" className="font-semibold">Security PIN *</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                placeholder="••••"
                value={transferPin}
                onChange={(e) => setTransferPin(e.target.value.slice(0, 4))}
                className="text-center text-2xl tracking-widest mt-2 py-3 font-bold"
                disabled={isPending}
              />
              <p className="text-xs text-gray-500 mt-2">Enter 4 digits only</p>
            </div>

            {/* Transfer Summary */}
            {formData && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold">${formData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-bold">{formData.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-bold">{formData.bankName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Total (with fee):</span>
                  <span className="font-bold text-lg text-blue-600">${(formData.amount * 1.02).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPinModal(false);
                  setTransferPin("");
                }}
                disabled={isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={verifyPinAndTransfer}
                disabled={isPending || !transferPin || transferPin.length !== 4}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isPending ? 'Verifying...' : 'Verify & Transfer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
