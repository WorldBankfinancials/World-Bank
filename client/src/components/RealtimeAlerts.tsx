import React, { useState, useEffect } from "react";
import { Bell, Check, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { realtimeAlerts, type RealtimeAlert } from '@/lib/supabase-realtime';

export default function RealtimeAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Load existing alerts
    const loadAlerts = async () => {
      try {
        const existingAlerts = await realtimeAlerts.getAlerts(user.id);
        setAlerts(existingAlerts);
        setUnreadCount(existingAlerts.filter(alert => !alert.isRead).length);
      } catch (error) {
        console.error('Failed to load alerts:', error);
      }
    };

    loadAlerts();

    // Subscribe to new alerts
    realtimeAlerts.subscribe((newAlert: RealtimeAlert) => {
      if (newAlert.userId === user.id) {
        setAlerts(prev => [newAlert, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(`World Bank: ${newAlert.title}`, {
            body: newAlert.message,
            icon: '/favicon.ico'
          });
        }
      }
    });

    return () => {
      realtimeAlerts.unsubscribe();
    };
  }, [user]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Alerts Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Alerts List */}
          <div className="max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    !alert.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium text-gray-800 ${
                        !alert.isRead ? 'font-semibold' : ''
                      }`}>
                        {alert.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                    {!alert.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-600 hover:text-gray-800"
                onClick={() => setIsOpen(false)}
              >
                Close notifications
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Background overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
