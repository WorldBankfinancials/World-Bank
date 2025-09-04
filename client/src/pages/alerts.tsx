// client/src/pages/Alerts.tsx
import { useState } from "react";
import { useAuthUser, useAlerts, useRealtimeAlerts } from "@/hooks/useSupabase";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, ArrowUpRight, ArrowDownRight, Shield, CheckCircle, Clock, Settings, Trash2 } from "lucide-react";

export default function Alerts() {
  const { data: authUser } = useAuthUser();
  const userId = authUser?.id ?? null;

  const { data: alertsData = [] } = useAlerts(userId);
  useRealtimeAlerts(userId);

  const [notifications, setNotifications] = useState({
    transactions: true,
    security: true,
    marketing: false,
    statements: true,
    maintenance: true
  });
  const [activeTab, setActiveTab] = useState('all');

  const filteredAlerts = activeTab === 'all' 
    ? alertsData 
    : alertsData.filter(alert => alert.type === activeTab);

  const unreadCount = alertsData.filter(alert => !alert.read).length;

  const notificationSettings = [
    { key: "transactions", title: "Transaction Alerts", description: "Get notified about payments and transfers", icon: Bell },
    { key: "security", title: "Security Alerts", description: "Important security notifications", icon: Shield },
    { key: "statements", title: "Account Statements", description: "Monthly statements and reports", icon: Mail },
    { key: "maintenance", title: "System Updates", description: "Maintenance and system notifications", icon: Settings },
    { key: "marketing", title: "Promotional Offers", description: "Special offers and product updates", icon: Bell }
  ];

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const markAsRead = (alertId: number) => {
    alert(`Mark alert ${alertId} as read`);
    // Optional: call Supabase update here to set read=true
  };

  const deleteAlert = (alertId: number) => {
    alert(`Delete alert ${alertId}`);
    // Optional: call Supabase delete here
  };

  const getAlertIcon = (type: string) => {
    switch(type) {
      case "transaction": return ArrowDownRight;
      case "security": return Shield;
      case "statement": return Mail;
      case "maintenance": return Clock;
      default: return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch(type) {
      case "transaction": return { color: "text-green-600", bgColor: "bg-green-100" };
      case "security": return { color: "text-orange-600", bgColor: "bg-orange-100" };
      case "statement": return { color: "text-blue-600", bgColor: "bg-blue-100" };
      case "maintenance": return { color: "text-purple-600", bgColor: "bg-purple-100" };
      default: return { color: "text-gray-600", bgColor: "bg-gray-100" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={authUser ?? undefined} />
      
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
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Alert Tabs */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: alertsData.length },
                { key: 'transaction', label: 'Transactions', count: alertsData.filter(a => a.type === 'transaction').length },
                { key: 'security', label: 'Security', count: alertsData.filter(a => a.type === 'security').length },
                { key: 'statement', label: 'Statements', count: alertsData.filter(a => a.type === 'statement').length },
                { key: 'maintenance', label: 'Maintenance', count: alertsData.filter(a => a.type === 'maintenance').length }
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
              {filteredAlerts.length === 0 && <div className="text-gray-500">No alerts yet.</div>}
              {filteredAlerts.map((alertItem) => {
                const { color, bgColor } = getAlertColor(alertItem.type);
                const Icon = getAlertIcon(alertItem.type);
                return (
                  <div
                    key={alertItem.id}
                    className={`p-4 border rounded-lg ${!alertItem.read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-sm">{alertItem.title}</h3>
                            {!alertItem.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alertItem.message}</p>
                          <p className="text-xs text-gray-500">{new Date(alertItem.created_at).toLocaleString()}</p>
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
                );
              })}
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
