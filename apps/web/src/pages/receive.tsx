import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { QrCode, Share, Copy, ArrowDownRight, CheckCircle, Download, Smartphone, Mail, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch, queryClient } from "@/lib/queryClient";

interface PaymentRequest {
  id: string;
  amount: string;
  description: string;
  status: string;
  created_at: string;
}

export default function Receive() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const [requestAmount, setRequestAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: pendingRequests = [], error: requestsError } = useQuery<PaymentRequest[]>({
    queryKey: ['/api/payment-requests'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/payment-requests');
      if (!response.ok) throw new Error('Failed to fetch payment requests');
      return response.json();
    }
  });

  const queryError = error || requestsError;
  useEffect(() => {
    if (queryError) toast({ title: 'Error loading data', variant: 'destructive' });
  }, [queryError, toast]);

  const handleCopyAccount = () => {
    const accountNumber = (user as Record<string, unknown>)?.accountNumber || '';
    if (accountNumber) {
      navigator.clipboard.writeText(String(accountNumber)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => toast({ title: 'Failed to copy', variant: 'destructive' }));
    }
  };

  const handleCreateRequest = async () => {
    if (!requestAmount) return;
    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    try {
      const response = await authenticatedFetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description: message || 'Payment request' })
      });
      if (!response.ok) throw new Error('Failed to create request');
      toast({ title: 'Payment request created' });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-requests'] });
      setRequestAmount("");
      setMessage("");
    } catch {
      toast({ title: 'Failed to create request', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const accountNumber = (user as Record<string, unknown>)?.accountNumber || 'N/A';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user as User | undefined} />
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold mb-6">Receive Money</h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" />Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="text-lg font-mono font-bold">{String(accountNumber)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyAccount}>
                {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Button variant="outline" className="w-full mt-3" onClick={() => setShowQR(!showQR)}>
              <QrCode className="w-4 h-4 mr-2" />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </Button>
            {showQR && (
              <div className="flex justify-center py-4">
                <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-gray-400" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowDownRight className="w-5 h-5" />Request Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <Input type="number" placeholder="0.00" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message (optional)</label>
              <Input placeholder="What's it for?" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <Button onClick={handleCreateRequest} disabled={!requestAmount} className="w-full bg-blue-600 text-white">
              Send Request
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req: PaymentRequest) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{req.description}</p>
                      <p className="text-sm text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${parseFloat(req.amount).toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs">{req.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <BottomNavigation />
    </div>
  );
}
