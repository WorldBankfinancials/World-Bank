// src/pages/Dashboard.tsx
import React, { useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import LiveChat from "@/components/LiveChat";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  ArrowDownRight,
  Clock,
  QrCode,
  Copy,
  CheckCircle,
} from "lucide-react";

import { useUser, useAccount, useRealtimeAccount } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabaseClient";

/* -------------------------- Transfer Section -------------------------- */
function TransferSection({ userId }: { userId?: string }) {
  const [transferAmount, setTransferAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [transferType, setTransferType] = useState("quick");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransfer = async () => {
    if (!transferAmount || !recipient) {
      alert("Please enter amount and recipient");
      return;
    }
    setIsProcessing(true);

    const { error } = await supabase.from("transactions").insert([
      {
        sender_id: userId,
        recipient,
        amount: Number(transferAmount),
        type: transferType,
        status: "pending",
      },
    ]);

    if (error) {
      alert("Transfer failed: " + error.message);
    } else {
      alert(`Transfer of $${transferAmount} to ${recipient} created!`);
    }

    setTransferAmount("");
    setRecipient("");
    setIsProcessing(false);
  };

  return (
    <div className="px-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-blue-600" />
            <span>Transfer Money</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transfer-amount">Amount</Label>
            <Input
              id="transfer-amount"
              type="number"
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              placeholder="email / phone / account ID"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="transfer-type">Transfer Type</Label>
            <Select value={transferType} onValueChange={setTransferType}>
              <SelectTrigger>
                <SelectValue placeholder="Select transfer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick Send</SelectItem>
                <SelectItem value="international">International</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="mobile">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleTransfer}
            disabled={!transferAmount || !recipient || isProcessing}
            className="w-full bg-blue-600 text-white"
          >
            {isProcessing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send ${transferAmount || "0.00"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------- Receive Section -------------------------- */
function ReceiveSection({ userId }: { userId?: string }) {
  const { data: account } = useAccount(userId);
  const [requestAmount, setRequestAmount] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useRealtimeAccount(userId);

  const handleCopyDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestMoney = async () => {
    if (!requestAmount) {
      alert("Please enter an amount");
      return;
    }

    const { error } = await supabase.from("payment_requests").insert([
      {
        user_id: userId,
        amount: Number(requestAmount),
        status: "pending",
      },
    ]);

    if (error) {
      alert("Failed to create request: " + error.message);
    } else {
      alert(`Payment request for $${requestAmount} created!`);
    }

    setRequestAmount("");
  };

  return (
    <div className="px-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowDownRight className="w-5 h-5 text-green-600" />
            <span>Receive Money</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Request amount"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleRequestMoney}
              className="bg-green-600 text-white"
            >
              Request
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="outline"
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
            <Button
              onClick={() => handleCopyDetails(account?.account_number ?? "")}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy Details"}
            </Button>
          </div>

          {showQR && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">
                Scan to send money to account {account?.account_number ?? "—"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Account Number</span>
              <span className="text-sm font-medium">
                {account?.account_number ?? "—"}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Balance</span>
              <span className="text-sm font-medium">
                ${account?.balance ?? "0.00"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------- Dashboard (main export) -------------------------- */
export default function Dashboard() {
  const { data: user } = useUser();

  return (
    <div>
      <h1 className="text-2xl font-bold px-4 py-2">Dashboard</h1>
      <TransferSection userId={user?.id} />
      <ReceiveSection userId={user?.id} />
      <BottomNavigation />
      <LiveChat />
    </div>
  );
}
