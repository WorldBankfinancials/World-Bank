// Real-time demo page for testing World Bank hybrid system
// Shows Supabase Realtime working with your existing UI

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import RealtimeAlerts from "@/components/RealtimeAlerts";
import { Bell, Send, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

export default function RealtimeDemo() {
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [isLoading, setIsLoading] = useState(false);

  // Demo function to send a test alert
  const sendTestAlert = async () => {
    if (!alertTitle.trim() || !alertMessage.trim()) {
      alert('Please fill in both title and message');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/send-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserId: 'test-user-123', // You can replace with actual user ID
          title: alertTitle,
          message: alertMessage,
          type: alertType
        })
      });

      if (response.ok) {
        setAlertTitle('');
        setAlertMessage('');
        setAlertType('info');
        alert('Alert sent successfully! Check the bell icon above.');
      } else {
        alert('Failed to send alert. Check console for details.');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('Error sending alert');
    } finally {
      setIsLoading(false);
    }
  };

  const testHealthCheck = async () => {
    try {
      const response = await fetch('/api/realtime/health');
      const data = await response.json();
      alert(`Supabase Status: ${data.status}\nMessage: ${data.message}`);
    } catch (error) {
      console.error('Health check failed:', error);
      alert('Health check failed - see console');
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header with Real-time Alerts Demo */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                World Bank Real-time System Demo
              </h1>
              <p className="text-gray-600">
                Testing Supabase Realtime integration with your existing World Bank UI
              </p>
              <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                Hybrid System Active
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <RealtimeAlerts />
              <Button onClick={testHealthCheck} variant="outline">
                Test Connection
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Send Test Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-blue-600" />
              <span>Send Test Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="alert-title">Alert Title</Label>
              <Input
                id="alert-title"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="Enter alert title..."
              />
            </div>

            <div>
              <Label htmlFor="alert-message">Alert Message</Label>
              <Input
                id="alert-message"
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Enter alert message..."
              />
            </div>

            <div>
              <Label htmlFor="alert-type">Alert Type</Label>
              <Select value={alertType} onValueChange={(value) => setAlertType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>Information</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Success</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>Warning</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>Error</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={sendTestAlert} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Alert'}
            </Button>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <Bell className="w-4 h-4 inline mr-1" />
                After sending, the alert will appear in real-time in the bell icon above
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Features Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-green-600" />
              <span>Hybrid System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Supabase Connection</span>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Real-time Alerts</span>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Live Chat System</span>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">Integrated</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Mock UI Structure</span>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Preserved</Badge>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">How It Works</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your existing World Bank UI stays unchanged</li>
                <li>• Supabase Realtime powers live features behind the scenes</li>
                <li>• Real notifications, chat, and transaction updates</li>
                <li>• Hybrid approach: mock frontend + real backend</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Test Examples */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Test Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              onClick={() => {
                setAlertTitle('Transfer Approved');
                setAlertMessage('Your international transfer of $5,000 has been approved and processed.');
                setAlertType('success');
              }}
            >
              Transfer Alert
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setAlertTitle('Security Notice');
                setAlertMessage('New login detected from Chrome browser in Houston, TX.');
                setAlertType('warning');
              }}
            >
              Security Alert
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setAlertTitle('Account Update');
                setAlertMessage('Your account information has been successfully updated by our team.');
                setAlertType('info');
              }}
            >
              Account Alert
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setAlertTitle('Payment Failed');
                setAlertMessage('Your payment of $2,450 could not be processed. Please contact support.');
                setAlertType('error');
              }}
            >
              Error Alert
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}