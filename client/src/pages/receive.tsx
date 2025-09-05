// client/src/pages/receive.tsx
import { useState } from "react";
import { useUser, useAccount, useRealtimeAccount } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, CheckCircle } from "lucide-react";

export default function ReceivePage() {
  const { data: authUser } = useUser();
  const userId = authUser?.id ?? null;
  const { data: account } = useAccount(userId);
  useRealtimeAccount(userId);

  const [amount, setAmount] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRequest = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return setMessage("Enter a valid amount");

    const { error } = await supabase.from("payment_requests").insert([{ user_id: userId, amount: amt, status: "pending" }]);
    if (error) return setMessage(error.message);
    setMessage("Payment request created");
    setAmount("");
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(text);
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader><CardTitle>Receive Money</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
            <Button onClick={handleRequest} className="bg-green-600 text-white">Request</Button>
          </div>

          <div className="flex space-x-2">
            <Button onClick={() => setShowQR((s) => !s)} variant="outline"><QrCode className="w-4 h-4 mr-2" />QR Code</Button>
            <Button onClick={() => handleCopy(account?.account_number ?? "")} variant="outline">
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}{copied ? "Copied" : "Copy Details"}
            </Button>
          </div>

          {showQR && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">Scan to send money to {authUser?.user_metadata?.full_name ?? authUser?.email}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Account Number</span>
              <span className="text-sm font-medium">{account?.account_number ?? "-"}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Balance</span>
              <span className="text-sm font-medium">${(account?.balance ?? 0).toLocaleString()}</span>
            </div>
          </div>

          {message && <div className="text-sm text-gray-700">{message}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
