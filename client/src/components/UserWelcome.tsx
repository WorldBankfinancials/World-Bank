import * as React from "react";
import type { User } from "../lib/schema";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface UserWelcomeProps {
  user: User;
}

export default function UserWelcome({ user }: UserWelcomeProps) {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const [freshUserData, setFreshUserData] = useState<any>(null);

  // Fetch fresh user data once only
  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        const response = await fetch('/api/user', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setFreshUserData(userData);
        }
      } catch (error) {
        // Silent error handling
      }
    };

    fetchFreshUserData();
  }, []);

  const displayName = freshUserData?.fullName || userProfile?.fullName || 'Loading...';
  const displayProfession = freshUserData?.profession || userProfile?.profession || 'Loading...';
  const displayEmail = freshUserData?.email || userProfile?.email || 'Loading...';

  // console.log('UserWelcome displaying:', { displayName, displayProfession, displayEmail });

  const displayBalance = user?.balance || 0;

  return (
    <div
      key={`userWelcome-${freshUserData?.fullName || 'loading'}-${Date.now()}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05)',
        padding: '32px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '4px',
        background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
        borderRadius: '16px 16px 0 0'
      }}></div>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 70%, #1e40af 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: '0 2px 4px rgba(37, 99, 235, 0.1)'
      }}>
        {t('welcome')}, LW
      </h1>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">{t('account_number')}:</span>
              <span className="font-semibold text-gray-900">4789-6523-1087-9234</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">{t('account_id')}:</span>
              <span className="font-semibold text-gray-900">WB-2024-7829</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 font-medium">{displayProfession}</span>
            </div>
          </div>

          <div className="relative" style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: '12px',
            border: '4px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), 0 4px 16px rgba(59, 130, 246, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <span style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: '40px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              LW
            </span>
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
            }}></div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-3">
          {user.isVerified && (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-700 text-sm font-semibold">{t('verified_account')}</span>
            </div>
          )}

          <div className="flex items-center space-x-4">
            {(user as any)?.isOnline && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-full" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-700 text-sm font-medium">{t('online')}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 px-3 py-2 rounded-full" style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-orange-700 text-sm font-medium">{t('authenticated')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
