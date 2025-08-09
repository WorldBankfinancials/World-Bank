// Real-time alerts component for World Bank hybrid system
// Maintains your existing UI style while adding Supabase real-time functionality

import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { realtimeAlerts, RealtimeAlert } from "@/lib/supabase-realtime";
import { useAuth } from "@/contexts/AuthContext";

interface RealtimeAlertsProps {
  className?: string;
}

export default function RealtimeAlerts({ className = "" }: RealtimeAlertsProps) {
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAlerts();
      subscribeToAlerts();
    }

    return () => {
      realtimeAlerts.unsubscribe();
    };
  }, [user]);

  const loadAlerts = async () => {
    try {
      const alertData = await realtimeAlerts.getUserAlerts();
      setAlerts(alertData);
      setUnreadCount(alertData.filter(alert => !alert.isRead).length);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const subscribeToAlerts = () => {
    realtimeAlerts.subscribe((alert: RealtimeAlert) => {
      setAlerts(prev => [alert, ...prev]);
      if (!alert.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    });
  };

  const markAsRead = async (alertId: string) => {
    try {
      await realtimeAlerts.markAsRead(alertId);
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Alert Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAlerts(!showAlerts)}
        className="relative p-2 hover:bg-gray-100"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Alerts Dropdown */}
      {showAlerts && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Banking Alerts</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlerts(false)}
              className="p-1 hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Alerts List */}
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No alerts available</p>
                <p className="text-sm">You'll receive notifications about your account here</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border-b border-gray-100 ${getAlertColor(alert.type)} ${
                    !alert.isRead ? 'border-l-4 border-l-blue-500' : ''
                  } hover:bg-opacity-75 transition-colors`}
                  onClick={() => !alert.isRead && markAsRead(alert.id)}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`font-medium text-sm ${
                          !alert.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {alert.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissAlert(alert.id);
                          }}
                          className="p-1 hover:bg-gray-200 ml-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className={`text-sm mt-1 ${
                        !alert.isRead ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                World Bank Security Notifications • Real-time Updates
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}