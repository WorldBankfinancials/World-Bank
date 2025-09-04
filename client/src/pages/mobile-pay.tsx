import type { User } from "@shared/schema";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Smartphone, 
  QrCode, 
  Nfc, 
  Wifi, 
  Shield, 
  Zap, 
  Store, 
  Users,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle
} from "lucide-react";


export default function MobilePay() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wb-gray flex items-center justify-center">
        <div className="text-wb-dark">Loading...</div>
      </div>
    );
  }

  const paymentMethods = [
    {
      icon: QrCode,
      title: "QR Code Payments",
      description: "Scan and pay instantly at any merchant",
      features: ["Instant scanning", "Secure authentication", "Receipt tracking"]
    },
    {
      icon: Nfc,
      title: "Contactless Pay",
      description: "Tap your phone to pay at NFC terminals",
      features: ["No physical contact", "Fast transactions", "Global acceptance"]
    },
    {
      icon: Wifi,
      title: "Online Payments",
      description: "Seamless online shopping experience",
      features: ["One-click checkout", "Saved payment methods", "Purchase protection"]
    }
  ];

  // Fetch real payment data from Supabase
  const { data: recentPayments } = useQuery({
    queryKey: ['/api/mobile-payments'],
    staleTime: 30000
  });

  const nearbyMerchants = [
    { name: "Starbucks", distance: "0.2 miles", category: "Coffee", accepts: ["QR", "NFC"] },
    { name: "McDonald's", distance: "0.4 miles", category: "Fast Food", accepts: ["QR", "NFC"] },
    { name: "Best Buy", distance: "0.8 miles", category: "Electronics", accepts: ["QR", "NFC", "Online"] },
    { name: "Walmart", distance: "1.2 miles", category: "Retail", accepts: ["QR", "NFC"] }
  ];

  return (
    <div className="min-h-screen bg-wb-gray">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold wb-dark mb-4">Mobile Pay</h1>
          <p className="text-xl text-wb-text max-w-3xl mx-auto">
            Pay anywhere, anytime with your mobile device. Fast, secure, and convenient.
          </p>
          <div className="flex justify-center mt-6 space-x-4">
            <Badge variant="outline" className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Bank-Grade Security
            </Badge>
            <Badge variant="outline" className="flex items-center">
              <Zap className="w-4 h-4 mr-1" />
              Instant Payments
            </Badge>
            <Badge variant="outline" className="flex items-center">
              <Store className="w-4 h-4 mr-1" />
              50M+ Merchants
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Payment Methods */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold wb-dark mb-6">Payment Methods</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {paymentMethods.map((method, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="text-center">
                      <method.icon className="w-12 h-12 wb-blue mx-auto mb-3" />
                      <CardTitle className="text-lg">{method.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-wb-text text-center mb-4">{method.description}</p>
                      <ul className="space-y-2">
                        {method.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-wb-text flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPayments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-wb-blue-light rounded-full flex items-center justify-center">
                          <Store className="w-6 h-6 wb-blue" />
                        </div>
                        <div>
                          <div className="font-medium wb-dark">{payment.merchant}</div>
                          <div className="text-sm text-wb-text">{payment.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold wb-dark">{payment.amount}</div>
                        <Badge variant="secondary" className="text-xs">{payment.method}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Advanced Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Biometric Authentication</div>
                        <div className="text-sm text-wb-text">Fingerprint and Face ID</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">End-to-End Encryption</div>
                        <div className="text-sm text-wb-text">256-bit SSL encryption</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Real-time Fraud Detection</div>
                        <div className="text-sm text-wb-text">AI-powered monitoring</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Transaction Alerts</div>
                        <div className="text-sm text-wb-text">Instant notifications</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Quick Actions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Card
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Split Bill
                </Button>
              </CardContent>
            </Card>

            {/* Nearby Merchants */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Nearby Merchants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {nearbyMerchants.map((merchant, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{merchant.name}</div>
                        <div className="text-sm text-wb-text">{merchant.category}</div>
                      </div>
                      <div className="text-sm text-wb-text">{merchant.distance}</div>
                    </div>
                    <div className="flex space-x-1">
                      {merchant.accepts.map((method, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold wb-blue">142</div>
                  <div className="text-sm text-wb-text">Payments This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold wb-green">$2,847</div>
                  <div className="text-sm text-wb-text">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">89%</div>
                  <div className="text-sm text-wb-text">Contactless Payments</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
