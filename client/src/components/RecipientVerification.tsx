
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Shield, Eye, Camera, Upload } from 'lucide-react';

interface RecipientVerificationProps {
  onVerificationComplete: (verified: boolean) => void;
}

export default function RecipientVerification({ onVerificationComplete }: RecipientVerificationProps) {
  const [verificationStep, setVerificationStep] = useState(1);
  const [verificationData, setVerificationData] = useState({
    identityDocument: '',
    proofOfAddress: '',
    biometricScan: '',
    complianceCheck: false
  });

  const verificationSteps = [
    { step: 1, title: 'Identity Verification', icon: Shield, status: 'pending' },
    { step: 2, title: 'Address Verification', icon: Eye, status: 'pending' },
    { step: 3, title: 'Biometric Scan', icon: Camera, status: 'pending' },
    { step: 4, title: 'Compliance Check', icon: CheckCircle, status: 'pending' }
  ];

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-orange-600" />
          <span>Enhanced Recipient Verification</span>
          <Badge variant="outline" className="bg-orange-100 text-orange-800">Required for $10,000+</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Tracker */}
        <div className="flex justify-between">
          {verificationSteps.map((step) => (
            <div key={step.step} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                verificationStep >= step.step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className="text-xs mt-1 text-center">{step.title}</div>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        {verificationStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 1: Identity Document Upload</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Document Type</Label>
                <select className="w-full mt-1 p-2 border rounded">
                  <option>Passport</option>
                  <option>National ID</option>
                  <option>Driver's License</option>
                </select>
              </div>
              <div>
                <Label>Document Number</Label>
                <Input placeholder="Enter document number" className="mt-1" />
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Drag & drop or click to upload document</p>
              <Button variant="outline" size="sm" className="mt-2">Browse Files</Button>
            </div>
          </div>
        )}

        {verificationStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 2: Proof of Address</h3>
            <div className="space-y-3">
              <div>
                <Label>Address Document Type</Label>
                <select className="w-full mt-1 p-2 border rounded">
                  <option>Utility Bill</option>
                  <option>Bank Statement</option>
                  <option>Government Letter</option>
                  <option>Lease Agreement</option>
                </select>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Upload proof of address (dated within 3 months)</p>
                <Button variant="outline" size="sm" className="mt-2">Browse Files</Button>
              </div>
            </div>
          </div>
        )}

        {verificationStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 3: Biometric Verification</h3>
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto border-2 border-gray-300 rounded-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">Position your face within the circle for facial recognition</p>
              <Button className="bg-blue-600 text-white">Start Biometric Scan</Button>
            </div>
          </div>
        )}

        {verificationStep === 4 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 4: Compliance & Risk Assessment</h3>
            <div className="bg-white p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span>Anti-Money Laundering (AML) Check</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Counter-Terrorism Financing (CTF) Check</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Sanctions List Screening</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Politically Exposed Person (PEP) Check</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">All compliance checks passed</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          {verificationStep > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setVerificationStep(verificationStep - 1)}
            >
              Previous
            </Button>
          )}
          <div className="ml-auto">
            {verificationStep < 4 ? (
              <Button 
                onClick={() => setVerificationStep(verificationStep + 1)}
                className="bg-blue-600 text-white"
              >
                Next Step
              </Button>
            ) : (
              <Button 
                onClick={() => onVerificationComplete(true)}
                className="bg-green-600 text-white"
              >
                Complete Verification
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
