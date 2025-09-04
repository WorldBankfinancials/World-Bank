// client/src/pages/receive.tsx
import { useState } from "react";
import { useAuthUser, useAccount, useRealtimeAccount } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Copy, CheckCircle, ArrowDownRight, Wallet, Link, Share } from "lucide-react";

export default function ReceivePage() {
  const { data: authUser } = useAuthUser();
  const userId = authUser?.id ?? null;
  const { data: account } = useAccount(userId);
  useRealtimeAccount(userId);

  const [requestAmount, setRequestAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate a unique payment link
  const paymentLink = `https://worldbank.app/pay/${userId ?? "unknown"}-${Date.now()}`;

  const handleRequestMoney = async () => {
    const amt = Number(requestAmount);
    if (!amt || amt <= 0) return setMessage("Enter a valid amount.");

    const { error } = await supabase.from("payment_requests").insert([
      { user_id: userId, amount: amt, status: "pending" },
    ]);

    if (error) setMessage(error.message);
    else {
      setMessage("Payment request created.");
      setRequestAmount("");
    }
  };

  const handleCopy = async (text: string, type: "account" | "link" = "account") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "account") setCopied(true);
      else setCopiedLink(true);

      setTimeout(() => {
        if (type === "account") setCopied(false);
        else setCopiedLink(false);
      }, 2000);
    } catch {
      alert(text);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Receive Money</h1>
          <p className="text-sm text-gray-600">Request payments easily</p>
        </div>
        <Button onClick={() => setShowQR((s) => !s)} variant="outline">
          <QrCode className="w-4 h-4 mr-2" />
          QR Code
        </Button>
      </div>

      {/* QR Code */}
      {showQR && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>QR Code Payment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mx-auto w-40 h-40 bg-gray-200 rounded flex items-center justify-center">
              <QrCode className="w-16 h-16 text-gray-400" />
            </div>
            <div className="text-sm mt-2">Send to: {account?.account_number ?? "—"}</div>
          </CardContent>
        </Card>
      )}

      {/* Request Payment */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Request Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Enter amount"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleRequestMoney} className="bg-green-600 text-white">
              Request
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => handleCopy(account?.account_number ?? "")}
              variant="outline"
              className="flex-1 flex items-center justify-center"
            >
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy Account Number"}
            </Button>
            <Button
              onClick={() => handleCopy(paymentLink, "link")}
              variant="outline"
              className="flex-1 flex items-center justify-center"
            >
              {copiedLink ? <CheckCircle className="w-4 h-4 mr-2" /> : <Link className="w-4 h-4 mr-2" />}
              {copiedLink ? "Copied!" : "Copy Payment Link"}
            </Button>
            <Button
              onClick={() => alert(`Share link: ${paymentLink}`)}
              variant="outline"
              className="flex-1 flex items-center justify-center"
            >
              <Share className="w-4 h-4 mr-2" />
              Share Link
            </Button>
          </div>

          {message && <div className="text-sm text-gray-700">{message}</div>}
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>My Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Account Number</span>
            <span>{account?.account_number ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Balance</span>
            <span>${account?.balance ?? "0.00"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {account?.payment_requests?.length ? (
            <div className="space-y-4">
              {account.payment_requests.map((req: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{req.from || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${req.amount}</p>
                    <Badge
                      className={
                        req.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No payment requests available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
