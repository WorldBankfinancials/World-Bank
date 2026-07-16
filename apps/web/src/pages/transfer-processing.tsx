
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Clock, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { authenticatedFetch } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TransferStatusResponse {
  status: string;
  reference?: string;
  amount?: number;
  currency?: string;
  fee?: number;
  recipientName?: string;
  failureReason?: string;
}

export default function TransferProcessing() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);

  const searchParams = new URLSearchParams(search);
  const transactionId = searchParams.get("id") || "";

  // Poll the backend for transfer status
  const { data: statusData, isLoading, error: queryError } = useQuery<TransferStatusResponse>({
    queryKey: ['/api/transfers', transactionId, 'status'],
    queryFn: async () => {
      if (!transactionId) return { status: "processing" };
      const response = await authenticatedFetch(`/api/transfers/${transactionId}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch transfer status');
      }
      return response.json();
    },
    enabled: !!transactionId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (queryError) {
      toast({ title: 'Error loading transfer status', variant: 'destructive' });
    }
  }, [queryError]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Navigate based on status
  useEffect(() => {
    if (!statusData?.status) return;
    const status = statusData.status;
    if (status === "completed") {
      setLocation(`/transfer-success?id=${transactionId}`);
    } else if (status === "failed" || status === "rejected") {
      setLocation(`/transfer-failed?id=${transactionId}`);
    }
    // processing and pending statuses stay on the processing page while polling continues
  }, [statusData?.status, transactionId, setLocation]);

  // Keep the progress animation as a visual while polling
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle>{t('transfer_processing')}</CardTitle>
          <p className="text-gray-600">{t('please_wait_processing')}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{progress}% Complete</p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{t('verifying_details')}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="w-4 h-4 text-green-600" />
              <span>{t('security_validation_complete')}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>{t('processing_transaction')}</span>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p>{t('transfer_processing_secure')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
