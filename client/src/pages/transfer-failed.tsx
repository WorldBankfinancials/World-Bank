import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { XCircle, RefreshCw, Phone, Mail, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TransferFailed() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const state = (window.history.state?.state || window.history.state || {}) as {
    transferId?: string;
    referenceNumber?: string;
    amount?: number | string;
    recipientName?: string;
  };

  const referenceId = state.referenceNumber || state.transferId || `WB${Date.now().toString().slice(-8)}`;
  const hasDetails = !!(state.amount || state.recipientName);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-red-800">Transfer Failed</CardTitle>
          <p className="text-gray-600">We couldn't process your transfer</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-left">
                <h4 className="font-medium text-red-800">Transfer Declined</h4>
                <p className="text-sm text-red-700 mt-1">
                  Your transfer could not be completed due to security verification requirements. 
                  Please contact our support team for assistance.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Transaction Details</h4>
              <div className="space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span>{t('reference_id')}</span>
                  <span className="font-mono">{referenceId}</span>
                </div>
                {hasDetails && (
                  <>
                    {state.amount && (
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{parseFloat(String(state.amount)).toFixed(2)}</span>
                      </div>
                    )}
                    {state.recipientName && (
                      <div className="flex justify-between">
                        <span>Recipient:</span>
                        <span className="font-medium">{state.recipientName}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span>{t('status')}</span>
                  <span className="text-red-600 font-medium">{t('status_failed')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('attempted')}</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('reason')}</span>
                  <span className="text-red-600">{t('security_verification_required')}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Common Reasons for Failure</h4>
              <ul className="text-sm text-gray-600 text-left space-y-1">
                <li>Insufficient account balance</li>
                <li>Invalid recipient information</li>
                <li>Security verification required</li>
                <li>Transfer limits exceeded</li>
                <li>Technical issues</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => setLocation("/international-transfer")}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Call Support
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p>No charges have been applied to your account for this failed transfer.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
