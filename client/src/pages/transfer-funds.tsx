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

export default function TransferFunds() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [transferType, setTransferType] = useState("international");
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
          description: `Transfer of $${amount} initiated successfully`,
        });
        form.reset();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to initiate transfer',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during transfer',
        variant: 'destructive'
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as any} />
      
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Transfer Funds</h1>
          <p className="text-gray-600 mt-2">Send money securely worldwide</p>
        </div>

        {/* Transfer Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select Transfer Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={transferType} onValueChange={setTransferType}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="international" className="text-xs">
                  <Globe className="w-4 h-4 mr-1" />
                  International
                </TabsTrigger>
                <TabsTrigger value="domestic" className="text-xs">
                  <Building className="w-4 h-4 mr-1" />
                  Domestic
                </TabsTrigger>
                <TabsTrigger value="card" className="text-xs">
                  <CreditCard className="w-4 h-4 mr-1" />
                  To Card
                </TabsTrigger>
                <TabsTrigger value="mobile" className="text-xs">
                  <Smartphone className="w-4 h-4 mr-1" />
                  Mobile
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Transfer Form */}
        <Card className="mb-6">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Amount */}
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <Label htmlFor="amount" className="text-lg font-bold">Transfer Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  {...form.register('amount', { valueAsNumber: true })}
                  className="text-2xl font-bold text-center mt-3 py-2"
                />
                <p className="text-sm text-gray-600 mt-2">Fee: ${(form.watch('amount') * 0.02).toFixed(2)} • Total: ${(form.watch('amount') * 1.02).toFixed(2)}</p>
              </div>

              {/* Recipient Name */}
              <div>
                <Label htmlFor="recipientName">Recipient Name *</Label>
                <Input
                  id="recipientName"
                  placeholder="Full name of recipient"
                  {...form.register('recipientName')}
                  className="mt-2"
                />
              </div>

              {/* Country */}
              <div>
                <Label htmlFor="country">Country *</Label>
                <Select value={form.watch('recipientCountry')} onValueChange={(value) => form.setValue('recipientCountry', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="SG">Singapore</SelectItem>
                    <SelectItem value="HK">Hong Kong</SelectItem>
                    <SelectItem value="CN">China</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bank Details - Conditional */}
              {(transferType === 'international' || transferType === 'domestic') && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-4">Bank Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bankName">Bank Name *</Label>
                        <Input
                          id="bankName"
                          placeholder="e.g., JP Morgan Chase"
                          {...form.register('bankName')}
                          className="mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="swiftCode">SWIFT Code</Label>
                          <Input
                            id="swiftCode"
                            placeholder="e.g., CHASUS33"
                            {...form.register('swiftCode')}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="accountNumber">Account Number *</Label>
                          <Input
                            id="accountNumber"
                            placeholder="Recipient account number"
                            {...form.register('accountNumber')}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Purpose */}
              <div>
                <Label htmlFor="purpose">Purpose of Transfer</Label>
                <Select value={form.watch('purpose')} onValueChange={(value) => form.setValue('purpose', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Transfer</SelectItem>
                    <SelectItem value="business">Business Payment</SelectItem>
                    <SelectItem value="salary">Salary/Wages</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference */}
              <div>
                <Label htmlFor="reference">Reference/Message (Optional)</Label>
                <Input
                  id="reference"
                  placeholder="Add a note for the recipient"
                  {...form.register('reference')}
                  className="mt-2"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-6"
                disabled={isPending}
              >
                {isPending ? 'Processing...' : 'Continue Transfer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Security Notice</p>
                <p className="text-sm text-yellow-800 mt-1">Transfers over $10,000 may require additional verification. Processing time: 1-5 business days.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
