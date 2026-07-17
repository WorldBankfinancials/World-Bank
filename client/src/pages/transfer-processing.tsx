import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2, Clock, Shield, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TransferProcessing() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"processing" | "completed" | "pending" | "failed">("processing");

  const transferId = (() => {
    const state = (window.history.state?.state || window.history.state || {}) as { transferId?: string };
    return state.transferId || "";
  })();

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 400);

    const pollStatus = async () => {
      if (!transferId) {
        setStatus("pending");
        return;
      }
      try {
        const { authenticatedFetch } = await import("@/lib/queryClient");
        const response = await authenticatedFetch(`/api/transfers/${transferId}/status`);
        if (!response.ok) {
          setStatus("pending");
          return;
        }
        const data = await response.json();
        const txStatus = data.status || data.transaction_status || "pending";

        if (txStatus === "completed" || txStatus === "success") {
          setStatus("completed");
          setProgress(100);
          if (progressInterval) clearInterval(progressInterval);
          if (pollInterval) clearInterval(pollInterval);
          redirectTimeout = setTimeout(() => setLocation("/transfer-success"), 1500);
        } else if (txStatus === "failed" || txStatus === "cancelled") {
          setStatus("failed");
          if (progressInterval) clearInterval(progressInterval);
          if (pollInterval) clearInterval(pollInterval);
          redirectTimeout = setTimeout(() => setLocation("/transfer-failed"), 1500);
        } else if (txStatus === "pending" || txStatus === "processing") {
          setStatus("pending");
        }
      } catch {
        setStatus("pending");
      }
    };

    setTimeout(pollStatus, 2000);
    pollInterval = setInterval(pollStatus, 3000);

    const fallbackTimeout = setTimeout(() => {
      if (status === "processing") {
        setStatus("pending");
        if (progressInterval) clearInterval(progressInterval);
        if (pollInterval) clearInterval(pollInterval);
        redirectTimeout = setTimeout(() => setLocation("/transfer-pending"), 1000);
      }
    }, 15000);

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (pollInterval) clearInterval(pollInterval);
      if (redirectTimeout) clearTimeout(redirectTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, [transferId, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {status === "completed" ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            )}
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
              {status === "completed" ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              )}
              <span>{status === "completed" ? "Transfer completed" : t('processing_transaction')}</span>
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
