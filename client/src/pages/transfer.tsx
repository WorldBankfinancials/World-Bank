// client/src/pages/transfer.tsx
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthUser, useAccount, useRealtimeAccount } from "@/hooks/useSupabase";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Globe, Building, Smartphone, Users, Clock, Shield } from "lucide-react";

export default function Transfer() {
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();
  const userId = authUser?.id ?? null;
  const { data: account } = useAccount(userId);
  useRealtimeAccount(userId);

  const [amount, setAmount] = useState("");
  const [transferType, setTransferType] = useState("international");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [transferPin, setTransferPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [recipientDetails, setRecipientDetails] = useState({
    fullName: "",
    country: "",
    phoneNumber: "",
    bankName: "",
    bankAddress: "",
    swiftCode: "",
    iban: "",
    accountNumber: "",
    routingNumber: "",
    purpose: "",
    relationship: ""
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [showPendingStatus, setShowPendingStatus] = useState(false);

  const quickTransferOptions = [
    { icon: Globe, label: "International Wire", action: () => setTransferType("international") },
    { icon: Building, label: "Cross-Border Bank", action: () => setTransferType("bank") },
    { icon: Smartphone, label: "Global Mobile Money", action: () => setTransferType("mobile") },
    { icon: Send, label: "Express Transfer", action: () => setTransferType("express") }
  ];

  const recentContacts = [
    { name: "John Smith", account: "****1234", lastAmount: "$500" },
    { name: "Sarah Wilson", account: "****5678", lastAmount: "$1,200" },
    { name: "Mike Chen", account: "****9012", lastAmount: "$750" }
  ];

  const handleTransfer = () => {
    if (!amount || !recipientDetails.fullName || !recipientDetails.accountNumber) {
      setNotice("Please complete all required transfer details");
      return;
    }
    setShowPinVerification(true);
  };

  const verifyPinAndTransfer = async () => {
    if (!transferPin || transferPin.length !== 4) {
      setPinError("Please enter a 4-digit PIN");
      return;
    }

    try {
      // Verify PIN
      const pinResponse = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUser?.email, pin: transferPin })
      });
      const pinResult = await pinResponse.json();
      if (!pinResult.success) {
        setPinError("Invalid PIN");
        return;
      }
    } catch {
      setPinError("PIN verification failed");
      return;
    }

    setPinError("");
    setIsProcessing(true);

    try {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) throw new Error("Invalid amount");

      // Find recipient in Supabase
      const { data: recipientRows, error: findErr } = await supabase
        .from("accounts")
        .select("*")
        .eq("account_number", recipientDetails.accountNumber)
        .limit(1);

      if (findErr) throw findErr;
      const recipient = Array.isArray(recipientRows) && recipientRows.length ? recipientRows[0] : null;
      if (!recipient) throw new Error("Recipient not found");

      // Insert transaction
      const { data: transaction, error: insertErr } = await supabase.from("transactions").insert([
        {
          from_user_id: userId,
          to_user_id: recipient.user_id,
          amount: amt,
          type: "debit",
          status: "pending",
          description: `Transfer to ${recipientDetails.accountNumber} (${transferType})`
        }
      ]).select().single();

      if (insertErr) throw insertErr;

      // Update balances
      await supabase.from("accounts").update({ balance: (account?.balance ?? 0) - amt }).eq("id", account?.id);
      await supabase.from("accounts").update({ balance: (recipient.balance ?? 0) + amt }).eq("id", recipient.id);

      queryClient.invalidateQueries({ queryKey: ["account", userId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });

      setTransferReference(transaction.id);
      setShowPinVerification(false);
      setShowPendingStatus(true);
      setAmount("");
      setRecipientDetails({
        fullName: "",
        country: "",
        phoneNumber: "",
        bankName: "",
        bankAddress: "",
        swiftCode: "",
        iban: "",
        accountNumber: "",
        routingNumber: "",
        purpose: "",
        relationship: ""
      });

    } catch (error: any) {
      setPinError(error.message || "Transfer failed");
    } finally {
      setIsProcessing(false);
      setTransferPin("");
    }
  };

  if (showPendingStatus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={authUser || undefined} />
        <div className="px-4 py-6 pb-20 max-w-md mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-orange-600 animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Transfer Processing</h2>
                <p className="text-gray-600 mb-4">Your transfer is being processed securely.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Reference Number</span>
                  <span className="font-mono text-sm font-medium">{transferReference}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-medium text-orange-600">Processing</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Time</span>
                  <span className="text-sm font-medium">1-3 business days</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPendingStatus(false)}>New Transfer</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Track Transfer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={authUser || undefined} />
      <div className="px-4 py-6 pb-20 max-w-3xl mx-auto space-y-6">
        {/* Quick Transfer Options */}
        <Card>
          <CardHeader><CardTitle>Transfer Options</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickTransferOptions.map((option, idx) => (
              <Button
                key={idx}
                variant={transferType === option.label.toLowerCase().replace(" ", "") ? "default" : "outline"}
                onClick={option.action}
                className="h-20 flex flex-col items-center justify-center space-y-1"
              >
                <option.icon className="w-6 h-6" />
                <span className="text-xs text-center">{option.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Transfer Form */}
        <Card>
          <CardHeader><CardTitle>Transfer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label htmlFor="amount" className="text-lg font-semibold">Transfer Amount (USD)</Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="text-2xl font-bold text-center mt-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recipient Name *</Label>
                <Input value={recipientDetails.fullName} onChange={e => setRecipientDetails(prev => ({ ...prev, fullName: e.target.value }))}
