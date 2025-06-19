
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle, Download, Share, ArrowRight } from "lucide-react";

export default function TransferSuccess() {
  const [, setLocation] = useLocation();

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
                  <span>Reference ID:</span>
                  <span className="font-mono">WB{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Sent:</span>
                  <span className="font-medium">$1,000.00 USD</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Received:</span>
                  <span className="font-medium">¥7,230.00 CNY</span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span>1 USD = 7.23 CNY</span>
                </div>
                <div className="flex justify-between">
                  <span>Transfer Fee:</span>
                  <span>$8.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Recipient Details</h4>
              <div className="text-sm text-left text-gray-600">
                <p>Zhang Wei</p>
                <p>Bank of China</p>
                <p>Account: ****8901</p>
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
