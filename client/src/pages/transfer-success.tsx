
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle, Download, Share, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TransferSuccess() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const state = (window.history.state?.state || window.history.state || {}) as {
    amount?: number | string;
    currency?: string;
    recipientName?: string;
    recipientBank?: string;
    recipientAccount?: string;
    referenceNumber?: string;
    fee?: number | string;
    exchangeRate?: string;
    receivedAmount?: number | string;
    receivedCurrency?: string;
  };

  const referenceId = state.referenceNumber || `WB${Date.now().toString().slice(-8)}`;
  const hasDetails = !!(state.amount || state.recipientName);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Transfer Successful</CardTitle>
          <p className="text-gray-600">Your money has been sent successfully</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Transfer Completed</h4>
            <p className="text-sm text-green-700">
              Your transfer has been processed and the funds have been delivered to the recipient.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Transaction Summary</h4>
              <div className="space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span>{t('reference_id')}</span>
                  <span className="font-mono">{referenceId}</span>
                </div>
                {hasDetails && (
                  <>
                    {state.amount && (
                      <div className="flex justify-between">
                        <span>{t('amount_sent')}</span>
                        <span className="font-medium">
                          {parseFloat(String(state.amount)).toFixed(2)} {state.currency || 'USD'}
                        </span>
                      </div>
                    )}
                    {state.receivedAmount && (
                      <div className="flex justify-between">
                        <span>{t('amount_received')}</span>
                        <span className="font-medium">
                          {parseFloat(String(state.receivedAmount)).toFixed(2)} {state.receivedCurrency || state.currency || 'USD'}
                        </span>
                      </div>
                    )}
                    {state.exchangeRate && (
                      <div className="flex justify-between">
                        <span>{t('exchange_rate')}</span>
                        <span>{state.exchangeRate}</span>
                      </div>
                    )}
                    {state.fee !== undefined && (
                      <div className="flex justify-between">
                        <span>{t('transfer_fee')}</span>
                        <span>${parseFloat(String(state.fee)).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span>{t('completed_timestamp')}</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>

            {(state.recipientName || state.recipientBank || state.recipientAccount) && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Recipient Details</h4>
                <div className="text-sm text-left text-gray-600">
                  {state.recipientName && <p>{state.recipientName}</p>}
                  {state.recipientBank && <p>{state.recipientBank}</p>}
                  {state.recipientAccount && <p>Account: {state.recipientAccount}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            
            <Button 
              onClick={() => setLocation("/dashboard")}
              className="w-full"
            >
              Return to Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setLocation("/international-transfer")}
              className="w-full"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Make Another Transfer
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            An email confirmation has been sent to your registered email address.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
