import type { User } from "@/lib/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Bell, 
  BellRing, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Settings,
  Filter,
  Trash2
, DollarSign } from "lucide-react";


export default function Alerts() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const [notifications, setNotifications] = useState({
    transactions: true,
    security: true,
    marketing: false,
    statements: true,
    maintenance: true
  });

  const [activeTab, setActiveTab] = useState('all');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const alerts = [
    {
      id: 1,
      type: "transaction",
      title: "Payment Received",
      message: "You received $250.00 from John Smith",
      time: "2 hours ago",
      icon: ArrowDownRight,
      color: "text-green-600",
      bgColor: "bg-green-100",
      read: false
    },
    {
      id: 2,
      type: "security",
      title: "Security Alert",
      message: "New device login detected from iPhone 15",
      time: "4 hours ago",
      icon: Shield,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      read: false
    },
    {
      id: 3,
      type: "transaction",
      title: "Payment Sent",
      message: "You sent $89.99 to Amazon",
      time: "1 day ago",
      icon: ArrowUpRight,
      color: "text-red-600",
      bgColor: "bg-red-100",
      read: true
    },
    {
      id: 4,
      type: "statement",
      title: "Monthly Statement",
      message: "Your December statement is ready",
      time: "2 days ago",
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      read: true
    },
    {
      id: 5,
      type: "security",
      title: "Password Changed",
      message: "Your account password was successfully updated",
      time: "3 days ago",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      read: true
    },
    {
      id: 6,
      type: "maintenance",
      title: "System Maintenance",
      message: "Scheduled maintenance on Dec 20, 2:00 AM - 4:00 AM",
      time: "5 days ago",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      read: true
    }
  ];

  const notificationSettings = [
    {
      key: "transactions" as keyof typeof notifications,
      title: "Transaction Alerts",
      description: "Get notified about payments and transfers",
      icon: DollarSign
    },
    {
      key: "security" as keyof typeof notifications,
      title: "Security Alerts",
      description: "Important security notifications",
      icon: Shield
    },
    {
      key: "statements" as keyof typeof notifications,
      title: "Account Statements",
      description: "Monthly statements and reports",
      icon: Mail
    },
    {
      key: "maintenance" as keyof typeof notifications,
      title: "System Updates",
      description: "Maintenance and system notifications",
      icon: Settings
    },
    {
      key: "marketing" as keyof typeof notifications,
      title: "Promotional Offers",
      description: "Special offers and product updates",
      icon: Bell
    }
  ];

  const filteredAlerts = activeTab === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === activeTab);

  const unreadCount = alerts.filter(alert => !alert.read).length;

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const markAsRead = (alertId: number) => {
    alert(`Marked alert ${alertId} as read`);
  };

  const deleteAlert = (alertId: number) => {
    alert(`Deleted alert ${alertId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={{
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
      }} />
      
      <div className="px-4 py-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Alerts & Notifications</h1>
            <p className="text-sm text-gray-600">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => alert("Filter options")}>
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => alert("Settings opened")}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Alert Tabs */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: alerts.length },
                { key: 'transaction', label: 'Transactions', count: alerts.filter(a => a.type === 'transaction').length },
                { key: 'security', label: 'Security', count: alerts.filter(a => a.type === 'security').length },
                { key: 'statement', label: 'Statements', count: alerts.filter(a => a.type === 'statement').length }
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  className="whitespace-nowrap"
                >
                  {tab.label} ({tab.count})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAlerts.map((alertItem) => (
                <div
                  key={alertItem.id}
                  className={`p-4 border rounded-lg ${!alertItem.read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 ${alertItem.bgColor} rounded-full flex items-center justify-center`}>
                        <alertItem.icon className={`w-5 h-5 ${alertItem.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-sm">{alertItem.title}</h3>
                          {!alertItem.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alertItem.message}</p>
                        <p className="text-xs text-gray-500">{alertItem.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {!alertItem.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(alertItem.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlert(alertItem.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notificationSettings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <setting.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{setting.title}</p>
                      <p className="text-xs text-gray-600">{setting.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications[setting.key]}
                    onCheckedChange={() => handleNotificationToggle(setting.key)}
                  />
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
