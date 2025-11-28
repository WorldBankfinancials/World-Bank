import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface Alert {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function RealtimeAlerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: fetchedAlerts } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/alerts');
      if (!response.ok) return [];
      return response.json().catch(() => []);
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  useEffect(() => {
    if (fetchedAlerts) {
      setAlerts(fetchedAlerts);
      const unread = fetchedAlerts.filter((a: Alert) => !a.read).length;
      setUnreadCount(unread);

      // Show toast for new unread alerts
      fetchedAlerts.forEach((alert: Alert) => {
        if (!alert.read) {
          toast({
            title: alert.title,
            description: alert.message,
            variant: alert.type as 'default' | 'destructive',
          });
        }
      });
    }
  }, [fetchedAlerts, toast]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {alerts.slice(0, 3).map((alert: Alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 p-3 rounded-lg shadow-md border-l-4 ${
            alert.type === 'error'
              ? 'bg-red-50 border-red-500'
              : alert.type === 'warning'
              ? 'bg-yellow-50 border-yellow-500'
              : alert.type === 'success'
              ? 'bg-green-50 border-green-500'
              : 'bg-blue-50 border-blue-500'
          }`}
        >
          <div className="flex-shrink-0">
            {getAlertIcon(alert.type)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-900">
              {alert.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {alert.message}
            </p>
          </div>
        </div>
      ))}
      {unreadCount > 0 && (
        <div className="flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded-lg text-sm">
          <Bell className="w-4 h-4" />
          {unreadCount} new alert{unreadCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
