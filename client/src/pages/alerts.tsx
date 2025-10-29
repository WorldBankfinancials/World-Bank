import type { User } from "@/lib/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRealtimeAlerts } from "@/hooks/useRealtimeTransactions";
import { 
  Bell, 
  
  Mail, 
  
  
  
  ArrowUpRight, 
  ArrowDownRight,
  Shield,
  
  CheckCircle,
  Clock,
  DollarSign,
  Settings,
  Filter,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function Alerts() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Enable real-time alerts updates
  const userId = user?.id ? (typeof user.id === 'number' ? user.id : parseInt(user.id)) : undefined;
  useRealtimeAlerts(userId, !!user);

  // Fetch real alerts from database
  const { data: alerts, isLoading: alertsLoading } = useQuery<any[]>({
    queryKey: ['/api/alerts'],
    enabled: !!user,
  });
  
  const [notifications, setNotifications] = useState({
    transactions: true,
    security: true,
    marketing: false,
    statements: true,
    maintenance: true
  });

  const [activeTab, setActiveTab] = useState('all');

  // Mutation for marking alert as read
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest(`/api/alerts/${alertId}/read`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  if (isLoading || alertsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  const alertsList = alerts || [];

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
    ? alertsList 
    : alertsList.filter((alert: any) => alert.alert_type === activeTab);

  const unreadCount = alertsList.filter((alert: any) => !alert.is_read).length;

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Mutation for deleting alert
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest(`/api/alerts/${alertId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  const markAsRead = (alertId: number) => {
    markAsReadMutation.mutate(alertId);
  };

  const deleteAlert = (alertId: number) => {
    deleteAlertMutation.mutate(alertId);
  };

  // Helper function to get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'transaction': return ArrowUpRight;
      case 'security': return Shield;
      case 'statement': return Mail;
      case 'maintenance': return Clock;
      default: return Bell;
    }
  };

  // Helper function to get alert styling
  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'transaction':
        return { color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'security':
        return { color: 'text-orange-600', bgColor: 'bg-orange-100' };
      case 'statement':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'maintenance':
        return { color: 'text-purple-600', bgColor: 'bg-purple-100' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
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
            <Button variant="outline" size="sm" onClick={() => console.log("Filter options")}>
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Settings', description: 'Alert settings opened.' })}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Alert Tabs */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: alertsList.length },
                { key: 'transaction', label: 'Transactions', count: alertsList.filter((a: any) => a.alert_type === 'transaction').length },
                { key: 'security', label: 'Security', count: alertsList.filter((a: any) => a.alert_type === 'security').length },
                { key: 'statement', label: 'Statements', count: alertsList.filter((a: any) => a.alert_type === 'statement').length }
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  className="whitespace-nowrap"
                  data-testid={`alert-tab-${tab.key}`}
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
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No alerts found</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                filteredAlerts.map((alertItem: any) => {
                  const IconComponent = getAlertIcon(alertItem.alert_type);
                  const { color, bgColor } = getAlertStyle(alertItem.alert_type);
                  const timeAgo = new Date(alertItem.created_at).toLocaleString();
                  
                  return (
                    <div
                      key={alertItem.id}
                      className={`p-4 border rounded-lg ${!alertItem.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                      data-testid={`alert-item-${alertItem.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
                            <IconComponent className={`w-5 h-5 ${color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-sm" data-testid={`alert-title-${alertItem.id}`}>{alertItem.title}</h3>
                              {!alertItem.is_read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alertItem.message}</p>
                            <p className="text-xs text-gray-500">{timeAgo}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!alertItem.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(alertItem.id)}
                              data-testid={`alert-mark-read-${alertItem.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAlert(alertItem.id)}
                            data-testid={`alert-delete-${alertItem.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
