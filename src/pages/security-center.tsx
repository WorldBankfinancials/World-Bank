
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  Lock, 
  Eye, 
  Smartphone, 
  Bell, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  FileText,
  Globe,
  Users,
  Activity,
  Fingerprint
} from "lucide-react";
import type { User } from "@shared/schema";

export default function SecurityCenter() {
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

  const securityFeatures = [
    {
      icon: Fingerprint,
      title: "Biometric Authentication",
      description: "Secure login with fingerprint and facial recognition",
      status: "active",
      enabled: true
    },
    {
      icon: Lock,
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      status: "active",
      enabled: true
    },
    {
      icon: Bell,
      title: "Transaction Alerts",
      description: "Instant notifications for all account activities",
      status: "active",
      enabled: true
    },
    {
      icon: Eye,
      title: "Account Monitoring",
      description: "24/7 monitoring for suspicious activities",
      status: "active",
      enabled: true
    }
  ];

  const recentActivity = [
    { action: "Login", device: "iPhone 15 Pro", location: "New York, NY", time: "2 hours ago", status: "success" },
    { action: "Password Changed", device: "MacBook Pro", location: "New York, NY", time: "3 days ago", status: "success" },
    { action: "Failed Login Attempt", device: "Unknown Device", location: "Moscow, RU", time: "5 days ago", status: "blocked" },
    { action: "2FA Setup", device: "iPhone 15 Pro", location: "New York, NY", time: "1 week ago", status: "success" }
  ];

  const trustedDevices = [
    { name: "iPhone 15 Pro", type: "Mobile", lastUsed: "Currently Active", status: "trusted" },
    { name: "MacBook Pro", type: "Computer", lastUsed: "2 hours ago", status: "trusted" },
    { name: "iPad Air", type: "Tablet", lastUsed: "3 days ago", status: "trusted" }
  ];

  return (
    <div className="min-h-screen bg-wb-gray">
      <Header user={user} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold wb-dark mb-4">Security Center</h1>
          <p className="text-wb-text">Manage your account security settings and monitor account activity</p>
        </div>

        {/* Security Status Overview */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-green-800">Your Account is Secure</h2>
                <p className="text-green-700">All security features are active and your account is protected</p>
              </div>
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="w-4 h-4 mr-1" />
                Protected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Security Settings */}
          <div className="lg:col-span-2">
            {/* Security Features */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        feature.enabled ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <feature.icon className={`w-5 h-5 ${
                          feature.enabled ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium wb-dark">{feature.title}</div>
                        <div className="text-sm text-wb-text">{feature.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={feature.enabled ? "default" : "secondary"}>
                        {feature.enabled ? "Active" : "Inactive"}
                      </Badge>
                      <Switch checked={feature.enabled} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Security Activity */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Security Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.status === 'success' ? 'bg-green-100' : 
                          activity.status === 'blocked' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          {activity.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : activity.status === 'blocked' ? (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Eye className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium wb-dark">{activity.action}</div>
                          <div className="text-sm text-wb-text">
                            {activity.device} • {activity.location}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-wb-text">{activity.time}</div>
                        <Badge variant={
                          activity.status === 'success' ? 'default' : 
                          activity.status === 'blocked' ? 'destructive' : 'secondary'
                        }>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Security */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Security Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </div>
                      <div className="text-sm text-wb-text">Update your account password</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Download Security Report
                      </div>
                      <div className="text-sm text-wb-text">Get detailed security analysis</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <Globe className="w-4 h-4 mr-2" />
                        Manage Login Locations
                      </div>
                      <div className="text-sm text-wb-text">Control where you can log in</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <Users className="w-4 h-4 mr-2" />
                        Account Recovery
                      </div>
                      <div className="text-sm text-wb-text">Set up recovery options</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Security Score */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Security Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">95/100</div>
                <div className="text-wb-text mb-4">Excellent Security</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
                <Button variant="outline" size="sm" className="mt-4">
                  Improve Score
                </Button>
              </CardContent>
            </Card>

            {/* Trusted Devices */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Trusted Devices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trustedDevices.map((device, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{device.name}</div>
                      <Badge variant="secondary" className="text-xs">{device.type}</Badge>
                    </div>
                    <div className="text-sm text-wb-text">{device.lastUsed}</div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  Manage Devices
                </Button>
              </CardContent>
            </Card>

            {/* Security Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Security Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-800 mb-1">Enable 2FA</div>
                  <div className="text-sm text-blue-700">
                    Two-factor authentication adds an extra layer of security
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-800 mb-1">Strong Passwords</div>
                  <div className="text-sm text-green-700">
                    Use unique, complex passwords for better protection
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-1">Regular Updates</div>
                  <div className="text-sm text-yellow-700">
                    Keep your devices and apps updated for security
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />    </div>
  );
}
