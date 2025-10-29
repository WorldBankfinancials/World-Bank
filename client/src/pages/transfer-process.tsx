import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/Avatar";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff 
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface TransferProcessProps {
  transferData: any;
  onBack: () => void;
  onComplete: () => void;
}

export default function TransferProcess({ transferData, onBack, onComplete }: TransferProcessProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1); // 1: PIN, 2: Processing, 3: Pending
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const handlePinSubmit = async () => {
    // Verify PIN with backend
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const verifyResponse = await authenticatedFetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (!verifyResponse.ok) {
        console.error('PIN verification failed:', await verifyResponse.text());
        setPinError(t('invalid_pin_try_again'));
        toast({
          title: 'Invalid PIN',
          description: 'The PIN you entered is incorrect. Please try again.',
          variant: 'destructive',
        });
        return;
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setPinError(t('invalid_pin_try_again'));
      toast({
        title: 'Verification failed',
        description: 'Unable to verify PIN. Please check your connection.',
        variant: 'destructive',
      });
      return;
    }

    setPinError("");
    setCurrentStep(2);
    setIsProcessing(true);

    // Generate transaction ID
    const txId = `WB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setTransactionId(txId);

    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      // Submit transfer for admin approval
      const response = await authenticatedFetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...transferData,
          transactionId: txId,
          status: 'pending_approval'
        }),
      });

      if (response.ok) {
        // Processing complete, move to pending
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep(3); // Move to pending status
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error('Transfer submission failed:', errorText);
        throw new Error(errorText || 'Transfer submission failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setPinError(t('transfer_failed_try_again'));
      toast({
        title: 'Transfer failed',
        description: error instanceof Error ? error.message : 'Unable to process transfer. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
      setCurrentStep(1);
    }
  };

  // Step 1: PIN Verification
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold">{t('verify_transfer_pin')}</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {t('enter_4_digit_pin_to_authorize')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pin">{t('transfer_pin')}</Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError("");
                  }}
                  maxLength={4}
                  placeholder="••••"
                  className="text-center text-lg tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {pinError}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('back')}
              </Button>
              <Button 
                onClick={handlePinSubmit} 
                className="flex-1"
                disabled={pin.length !== 4}
              >
                {t('verify_and_continue')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Processing
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-orange-600 animate-pulse" />
            </div>
            <CardTitle className="text-xl font-semibold">{t('processing_transfer')}</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {t('processing_your_transfer_request')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900 mb-2">
                {t('transaction_id')}: {transactionId}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{t('please_wait_processing')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Pending Admin Approval
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl font-semibold">{t('transfer_pending')}</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            {t('transfer_submitted_for_review')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">{t('awaiting_processing')}</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {t('transfer_id')}: {transactionId}
                </p>
                <p className="text-sm text-yellow-700">
                  {t('amount')}: {transferData?.currency}{transferData?.amount}
                </p>
                <p className="text-sm text-yellow-700">
                  {t('recipient')}: {transferData?.recipientName}
                </p>
                <p className="text-sm text-yellow-700">
                  {t('bank')}: {transferData?.bankName}
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  {t('admin_will_review_shortly')}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={onComplete} className="w-full">
              {t('return_to_dashboard')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
