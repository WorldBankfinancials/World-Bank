import React from "react";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2, Clock, Shield } from "lucide-react";

export default function TransferProcessing() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setLocation("/transfer-pending");
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle>Processing Transfer</CardTitle>
          <p className="text-gray-600">Please wait while we process your transaction</p>
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
              <span>Verifying transfer details...</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Security validation complete</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Processing transaction...</span>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p>Your transfer is being processed securely. This may take a few moments.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
