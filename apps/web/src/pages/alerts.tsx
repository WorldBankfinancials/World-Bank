import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { authenticatedFetch, queryClient } from "@/lib/queryClient";
import { Bell, Mail, ArrowUpRight, ArrowDownRight, Shield, CheckCircle, Clock, DollarSign, Settings, Filter, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";

interface Alert {
  id: number;
  alert_type: string;
  message: string;
  title?: string;
  is_read: boolean;
  created_at?: string;
}

export default function Alerts() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: user, isLoading, error: userError } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  useRealtimeAlerts(String(user?.id), !!user);

  const { data: alerts = [], isLoading: alertsLoading, error: alertsError } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
    enabled: !!user,
  });

  const queryError = userError || alertsError;
  useEffect(() => {
    if (queryError) toast({ title: 'Error loading data', variant: 'destructive' });
  }, [queryError, toast]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAsRead = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await authenticatedFetch(`/api/alerts/${alertId}/read`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Failed to mark as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: () => toast({ title: 'Failed to mark as read', variant: 'destructive' })
  });

  const deleteAlert = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await authenticatedFetch(`/api/alerts/${alertId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete alert');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: () => toast({ title: 'Failed to delete alert', variant: 'destructive' })
  });

  if (isLoading || alertsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredAlerts = filter === 'unread' ? alerts.filter(a => !a.is_read) : alerts;
  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user as User | undefined} />
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
          </div>
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')}>Unread</Button>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No notifications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredAlerts.map((alert: Alert) => (
              <Card key={alert.id} className={alert.is_read ? 'opacity-60' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.alert_type === 'security' ? 'bg-red-100' : alert.alert_type === 'transaction' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        {alert.alert_type === 'security' ? <Shield className="w-5 h-5 text-red-600" /> : alert.alert_type === 'transaction' ? <DollarSign className="w-5 h-5 text-blue-600" /> : <Bell className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{alert.title || alert.alert_type}</p>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        {alert.created_at && <p className="text-xs text-gray-400 mt-1">{new Date(alert.created_at).toLocaleString()}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!alert.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => markAsRead.mutate(alert.id)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteAlert.mutate(alert.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}
