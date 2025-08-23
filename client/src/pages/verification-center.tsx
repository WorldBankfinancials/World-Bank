
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Shield } from 'lucide-react';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VerificationCenter() {
  const { t } = useLanguage();
  
  const mockUser = {
    id: 1,
    username: "liu.wei",
    password: "password123",
    fullName: "Mr. Liu Wei",
    accountNumber: "4789-6523-1087-9234",
    accountId: "WB-2024-7829",
    profession: "Marine Engineer at Oil Rig Company",
    isVerified: true,
    isOnline: true,
    avatarUrl: null
  };

  const verificationItems = [
    {
      title: "Identity Verification",
      status: "completed",
      description: "Government ID verified",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Address Verification",
      status: "completed", 
      description: "Utility bill verified",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Phone Verification",
      status: "pending",
      description: "SMS verification required",
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "Email Verification",
      status: "completed",
      description: "Email address confirmed",
      icon: CheckCircle,
      color: "text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={mockUser} />
      
      <div className="px-4 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
              <p className="text-gray-600">Manage your account verification status</p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Shield className="w-3 h-3 mr-1" />
              Verified Account
            </Badge>
          </div>

          {/* Verification Status Cards */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {verificationItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <IconComponent className={`w-5 h-5 ${item.color} mr-3`} />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <Badge 
                      variant={item.status === 'completed' ? 'default' : 'secondary'}
                      className={item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {item.status === 'completed' ? 'Complete' : 'Pending'}
                    </Badge>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Additional Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                Enhanced Security Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Complete additional verification steps to unlock higher transaction limits and premium features.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Additional Document</label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Code</label>
                  <Input placeholder="Enter 6-digit code" maxLength={6} />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Submit Verification
                </Button>
                <Button variant="outline">
                  Request New Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
