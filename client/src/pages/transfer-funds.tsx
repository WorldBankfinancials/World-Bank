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
import { useToast } from "@/hooks/use-toast";
import { transferFormSchema, type TransferForm } from '@shared/schema';

export default function TransferFunds() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [transferType, setTransferType] = useState("international");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("EN");
  const [isPending, setIsPending] = useState(false);
  
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
    try {
      setIsPending(true);
      const amount = data.amount;
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
          amount: amount,
          fee: fee,
          total: total,
          transferType: transferType,
          recipientName: data.recipientName,
          recipientCountry: data.recipientCountry,
          recipientAccount: data.accountNumber,
          bankName: data.bankName,
          swiftCode: data.swiftCode,
          purpose: data.purpose,
          reference: data.reference,
          transferPin: null
        })
      });

      if (response.ok) {
        toast({
          title: 'Transfer Initiated',
          description: `Transfer of $${amount.toFixed(2)} has been initiated successfully.`,
        });
        window.location.href = '/transfer-processing';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transfer failed');
      }
    } catch (error: any) {
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Unable to process transfer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  const saveAsTemplate = () => {
    const formData = form.getValues();
    if (!formData.recipientName?.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter recipient details to save as template.',
        variant: 'destructive',
      });
      return;
    }
    
    const template = {
      name: `${formData.recipientName} - ${transferType}`,
      type: transferType,
      data: formData,
      created: new Date().toISOString()
    };
    
    try {
      const templates = JSON.parse(localStorage.getItem('transferTemplates') || '[]');
      templates.push(template);
      localStorage.setItem('transferTemplates', JSON.stringify(templates));
      toast({
        title: 'Template Saved',
        description: `Template saved: "${template.name}"`,
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    }
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

      {showLanguageMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLanguageMenu(false)}
        />
      )}

      <div className="px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ArrowLeftRight className="w-5 h-5" />
                <span>{t('transfer_funds')}</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Transfer Type Selection */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">{t('transfer_type')}</Label>
                <Tabs value={transferType} onValueChange={setTransferType}>
                  <TabsList className="grid w-full grid-cols-4">
                    {transferMethods.map(method => (
                      <TabsTrigger key={method.id} value={method.id} className="text-xs">
                        {method.icon && <method.icon className="w-4 h-4" />}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {transferMethods.map(method => (
                    <TabsContent key={method.id} value={method.id}>
                      <Card className="border-2 border-blue-100 bg-blue-50">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-blue-900">{method.title}</h3>
                          <p className="text-sm text-blue-700 mt-1">{method.description}</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
                <Input 
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  {...form.register("amount", { valueAsNumber: true })}
                  className={form.formState.errors.amount ? 'border-red-500' : ''}
                  data-testid="input-amount"
                />
                {form.formState.errors.amount && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.amount.message}</p>
                )}
              </div>

              {/* Recipient Name */}
              <div>
                <Label htmlFor="recipientName" className="text-sm font-medium">Recipient Name</Label>
                <Input 
                  id="recipientName"
                  placeholder="Full name"
                  {...form.register("recipientName")}
                  className={form.formState.errors.recipientName ? 'border-red-500' : ''}
                  data-testid="input-recipient-name"
                />
                {form.formState.errors.recipientName && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.recipientName.message}</p>
                )}
              </div>

              {/* International Transfer Fields */}
              {transferType === "international" && (
                <>
                  <div>
                    <Label htmlFor="recipientCountry">Recipient Country</Label>
                    <Select value={form.watch("recipientCountry") || ""} onValueChange={(value) => form.setValue("recipientCountry", value)}>
                      <SelectTrigger className={form.formState.errors.recipientCountry ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="IN">India</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.recipientCountry && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.recipientCountry.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="recipientAddress">Address</Label>
                    <Input 
                      id="recipientAddress"
                      placeholder="Street address"
                      {...form.register("recipientAddress")}
                      className={form.formState.errors.recipientAddress ? 'border-red-500' : ''}
                      data-testid="input-recipient-address"
                    />
                    {form.formState.errors.recipientAddress && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.recipientAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="recipientCity">City</Label>
                    <Input 
                      id="recipientCity"
                      placeholder="City"
                      {...form.register("recipientCity")}
                      className={form.formState.errors.recipientCity ? 'border-red-500' : ''}
                      data-testid="input-recipient-city"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input 
                      id="bankName"
                      placeholder="Recipient's bank name"
                      {...form.register("bankName")}
                      className={form.formState.errors.bankName ? 'border-red-500' : ''}
                      data-testid="input-bank-name"
                    />
                    {form.formState.errors.bankName && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.bankName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bankAddress">Bank Address</Label>
                    <Input 
                      id="bankAddress"
                      placeholder="Bank address"
                      {...form.register("bankAddress")}
                      className={form.formState.errors.bankAddress ? 'border-red-500' : ''}
                      data-testid="input-bank-address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankCity">Bank City</Label>
                    <Input 
                      id="bankCity"
                      placeholder="Bank city"
                      {...form.register("bankCity")}
                      className={form.formState.errors.bankCity ? 'border-red-500' : ''}
                      data-testid="input-bank-city"
                    />
                  </div>

                  <div>
                    <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
                    <Input 
                      id="swiftCode"
                      placeholder="e.g., ABCDUS33"
                      {...form.register("swiftCode")}
                      className={form.formState.errors.swiftCode ? 'border-red-500' : ''}
                      data-testid="input-swift-code"
                    />
                    {form.formState.errors.swiftCode && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.swiftCode.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input 
                      id="accountNumber"
                      placeholder="Recipient account number"
                      {...form.register("accountNumber")}
                      className={form.formState.errors.accountNumber ? 'border-red-500' : ''}
                      data-testid="input-account-number"
                    />
                    {form.formState.errors.accountNumber && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.accountNumber.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* Domestic Transfer Fields */}
              {transferType === "domestic" && (
                <>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input 
                      id="routingNumber"
                      placeholder="9 digit routing number"
                      {...form.register("routingNumber")}
                      className={form.formState.errors.routingNumber ? 'border-red-500' : ''}
                      data-testid="input-routing-number"
                    />
                    {form.formState.errors.routingNumber && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.routingNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input 
                      id="accountNumber"
                      placeholder="Recipient account number"
                      {...form.register("accountNumber")}
                      className={form.formState.errors.accountNumber ? 'border-red-500' : ''}
                      data-testid="input-account-number-domestic"
                    />
                    {form.formState.errors.accountNumber && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.accountNumber.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* Card Transfer Fields */}
              {transferType === "card" && (
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input 
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    {...form.register("cardNumber")}
                    className={form.formState.errors.cardNumber ? 'border-red-500' : ''}
                    data-testid="input-card-number"
                  />
                  {form.formState.errors.cardNumber && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.cardNumber.message}</p>
                  )}
                </div>
              )}

              {/* Mobile Money Fields */}
              {transferType === "mobile" && (
                <>
                  <div>
                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                    <Input 
                      id="mobileNumber"
                      placeholder="+1 234 567 8900"
                      {...form.register("mobileNumber")}
                      className={form.formState.errors.mobileNumber ? 'border-red-500' : ''}
                      data-testid="input-mobile-number"
                    />
                    {form.formState.errors.mobileNumber && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.mobileNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="mobileProvider">Provider</Label>
                    <Select value={form.watch("mobileProvider") || ""} onValueChange={(value) => form.setValue("mobileProvider", value)}>
                      <SelectTrigger className={form.formState.errors.mobileProvider ? 'border-red-500' : ''}>
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
                    {form.formState.errors.mobileProvider && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.mobileProvider.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* Purpose and Reference */}
              <div>
                <Label htmlFor="purpose">Purpose of Transfer</Label>
                <Select value={form.watch("purpose") || ""} onValueChange={(value) => form.setValue("purpose", value)}>
                  <SelectTrigger className={form.formState.errors.purpose ? 'border-red-500' : ''}>
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
                {form.formState.errors.purpose && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.purpose.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reference">Reference/Message (Optional)</Label>
                <Input 
                  id="reference"
                  placeholder="Payment reference or message"
                  {...form.register("reference")}
                  data-testid="input-reference"
                />
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
                  type="button"
                  variant="outline" 
                  className="flex-1"
                  onClick={saveAsTemplate}
                  disabled={isPending}
                  data-testid="button-save-template"
                >
                  Save as Template
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isPending}
                  data-testid="button-continue-transfer"
                >
                  {isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue Transfer"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
