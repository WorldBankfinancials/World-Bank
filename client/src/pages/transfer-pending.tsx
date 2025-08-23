import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Clock, AlertCircle, Phone, Mail } from "lucide-react";
import React, { useState, useEffect } from 'react';


export default function TransferPending() {
  const [, setLocation] = useLocation();
  const [transferDetails, setTransferDetails] = useState({
    referenceId: `WB${Date.now().toString().slice(-8)}`,
    status: "Pending Review",
    submitted: new Date().toLocaleString(),
  });

  useEffect(() => {
    const details = sessionStorage.getItem('transferDetails');
    if (details) {
      try {
        const parsedDetails = JSON.parse(details);
        setTransferDetails(parsedDetails);
        console.log('Transfer pending details:', parsedDetails);
      } catch (error) {
        console.error('Error parsing transfer details:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-yellow-800">Transfer Pending</CardTitle>
          <p className="text-gray-600">Your transfer is under review</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-left">
                <h4 className="font-medium text-yellow-800">Under Review</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your transfer has been submitted and is currently being reviewed by our security team.
                  This process typically takes 1-24 hours.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Transfer Details</h4>
              <div className="space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span>Reference ID:</span>
                  <span className="font-mono">{transferDetails.referenceId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-yellow-600 font-medium">{transferDetails.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Submitted:</span>
                  <span>{transferDetails.submitted}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="text-sm text-gray-600 text-left space-y-1">
                <li>• Our team will verify all transfer details</li>
                <li>• Security checks will be completed</li>
                <li>• You'll receive an email once approved</li>
                <li>• Funds will be transferred immediately upon approval</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setLocation("/dashboard")}
              className="w-full"
            >
              Return to Dashboard
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Call Support
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            You will receive notifications about your transfer status via email and SMS.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}