import { useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import LiveChat from "@/components/LiveChat";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";

import { Send, Clock, ArrowDownRight, QrCode, Copy, CheckCircle } from "lucide-react";
import { Link } from "wouter";

/* -------------------------- Transfer Section -------------------------- */
function TransferSection() {
  const { t } = useLanguage();
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
    await new Promise((r) => setTimeout(r, 2000));
    alert(`Transfer of $${transferAmount} to ${recipient} initiated successfully!`);
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
            <span>{t("transfer_money")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transfer-amount">{t("amount")}</Label>
            <Input
              id="transfer-amount"
              type="number"
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="recipient">{t("send_to")}</Label>
            <Input
              id="recipient"
              placeholder={t("account_email_phone_placeholder")}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="transfer-type">{t("transfer_type")}</Label>
            <Select value={transferType} onValueChange={setTransferType}>
              <SelectTrigger>
                <SelectValue placeholder={t("select_transfer_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">{t("quick_send")}</SelectItem>
                <SelectItem value="international">{t("international")}</SelectItem>
                <SelectItem value="bank">{t("bank_transfer")}</SelectItem>
                <SelectItem value="mobile">{t("mobile_money")}</SelectItem>
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
                {t("processing_transfer")}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t("send_amount")} ${transferAmount || "0.00"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------- Receive Section -------------------------- */
function ReceiveSection() {
  const { t } = useLanguage();
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const [requestAmount, setRequestAmount] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const accountDetails = {
    name: user?.fullName || "Account Holder",
    accountNumber: user?.accountNumber || t("loading"),
    accountId: (user as any)?.accountId || t("loading"),
  };

  const handleCopyDetails = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert(text);
    }
  };

  const handleRequestMoney = () => {
    if (!requestAmount) {
      alert("Please enter an amount");
      return;
    }
    alert(`Payment request for $${requestAmount} created successfully!`);
    setRequestAmount("");
  };

  return (
    <div className="px-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowDownRight className="w-5 h-5 text-green-600" />
            <span>{t("receive_money") || "Receive Money"}</span>
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
            <Button onClick={handleRequestMoney} className="bg-green-600 text-white">
              Request
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button onClick={() => setShowQR(!showQR)} variant="outline" className="flex-1">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
            <Button onClick={() => handleCopyDetails(accountDetails.accountNumber)} variant="outline" className="flex-1">
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Details"}
            </Button>
          </div>

          {showQR && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">Scan to send money to {accountDetails.name}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Account Number</span>
              <span className="text-sm font-medium">{accountDetails.accountNumber}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Account ID</span>
              <span className="text-sm font-medium">{accountDetails.accountId}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------- Dashboard (main export) -------------------------- */
export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <TransferSection />
      <ReceiveSection />
      <BottomNavigation />
      <LiveChat />
    </div>
  );
}
