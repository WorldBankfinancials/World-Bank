
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Download, Share, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { authenticatedFetch } from "@/lib/queryClient";

interface TransferStatusResponse {
  status: string;
  reference?: string;
  amount?: number;
  currency?: string;
  fee?: number;
  recipientName?: string;
  recipientAccount?: string;
  bankName?: string;
  completedAt?: string;
}

export default function TransferSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { t } = useLanguage();

  const searchParams = new URLSearchParams(search);
  const transactionId = searchParams.get("id") || "";

  // Fetch real transaction data from the backend
  const { data: transaction, isLoading } = useQuery<TransferStatusResponse>({
    queryKey: ['/api/transfers', transactionId, 'status'],
    queryFn: async () => {
      if (!transactionId) throw new Error('No transaction ID');
      const response = await authenticatedFetch(`/api/transfers/${transactionId}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }
      return response.json();
    },
    enabled: !!transactionId,
  });

  const amount = transaction?.amount ?? 0;
  const currency = transaction?.currency || 'USD';
  const fee = transaction?.fee ?? 0;
  const recipientName = transaction?.recipientName || '';
  const bankName = transaction?.bankName || '';
  const recipientAccount = transaction?.recipientAccount || '';
  const reference = transaction?.reference || transactionId;
  const completedAt = transaction?.completedAt || new Date().toISOString();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-gray-600">Loading transaction details...</div>
      </div>
    );
  }

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
                  <span className="font-mono">{reference}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('amount_sent')}</span>
                  <span className="font-medium">${amount.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('transfer_fee')}</span>
                  <span>${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('completed_timestamp')}</span>
                  <span>{new Date(completedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Recipient Details</h4>
              <div className="text-sm text-left text-gray-600">
                <p>{recipientName}</p>
                {bankName && <p>{bankName}</p>}
                {recipientAccount && <p>Account: {recipientAccount}</p>}
              </div>
            </div>
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