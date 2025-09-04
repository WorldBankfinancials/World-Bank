import type { User } from "@shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  QrCode, 
  Share, 
  Copy, 
  ArrowDownRight, 
  Link,
  CheckCircle,
  Download,
  Users,
  Smartphone,
  Mail
} from "lucide-react";


export default function Receive() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const [requestAmount, setRequestAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const accountDetails = {
    name: user?.fullName || "Account Holder",
    accountNumber: user?.accountNumber || "Loading...",
    accountId: (user as any)?.accountId || "Loading...",
    bankName: "World Bank Group",
    swiftCode: "WBGLUS33"
  };

  const shareLink = `https://worldbank.app/pay/LW-${Date.now()}`;

  // Fetch real pending requests from Supabase
  const { data: pendingRequests } = useQuery({
    queryKey: ['/api/payment-requests'],
    staleTime: 30000
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  const handleRequestMoney = () => {
    if (!requestAmount) {
      alert("Please enter an amount");
      return;
    }
    alert(`Payment request for $${requestAmount} created successfully!`);
    setRequestAmount("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="px-4 py-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Receive Money</h1>
            <p className="text-sm text-gray-600">Request payments easily</p>
          </div>
          <Button onClick={() => setShowQR(!showQR)} className="bg-blue-600 text-white">
            <QrCode className="w-4 h-4 mr-1" />
            QR Code
          </Button>
        </div>

        {/* QR Code Section */}
        {showQR && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>QR Code Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-48 h-48 bg-gray-100 mx-auto mb-4 rounded-lg flex items-center justify-center">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to send money to Mr. Liu Wei
              </p>
              <div className="flex space-x-2 justify-center">
                <Button variant="outline" onClick={() => alert("QR code downloaded")}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => alert("QR code shared")}>
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Payment */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Request Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="number"
                placeholder="Enter amount"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            
            <div>
              <Input
                placeholder="Message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleRequestMoney} className="bg-blue-600 text-white">
                <Users className="w-4 h-4 mr-1" />
                Request
              </Button>
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Link className="w-4 h-4 mr-1" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Account Name</p>
                <p className="font-medium">{accountDetails.name}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopyDetails(accountDetails.name)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="font-medium">{accountDetails.accountNumber}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopyDetails(accountDetails.accountNumber)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Account ID</p>
                <p className="font-medium">{accountDetails.accountId}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopyDetails(accountDetails.accountId)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">SWIFT Code</p>
                <p className="font-medium">{accountDetails.swiftCode}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopyDetails(accountDetails.swiftCode)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{request.from}</p>
                      <p className="text-xs text-gray-500">{request.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{request.amount}</p>
                    <Badge 
                      className={request.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
