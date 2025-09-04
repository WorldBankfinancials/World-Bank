import React from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar } from './Avatar';

export default function UserWelcomeFixed() {
  const { t } = useLanguage();
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const timestamp = Date.now();
        const response = await fetch(`/api/user?t=${timestamp}`);
        if (response.ok) {
          const data = await response.json();
          // console.log('💰 BALANCE UPDATE:', data.balance);
          setUserData(data);
        }
      } catch (error) {
        // Silent error handling
      }
    };

    fetchUserData();
    
    // Disable auto-refresh to prevent profile image resets
    // Manual refresh button available in dashboard
  }, []);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05)',
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
        {t('welcome')}, {userData.fullName}
      </h1>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">{t('account_number')}:</span>
              <span className="font-semibold text-gray-900">{userData.accountNumber}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">{t('account_id')}:</span>
              <span className="font-semibold text-gray-900">{userData.accountId}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 font-medium">{userData.profession}</span>
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
              {userData.fullName ? userData.fullName.split(' ').map((n: any) => n[0]).join('') : 'LW'}
            </span>
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '28px',
              height: '28px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 mt-4">
        <div className="flex items-center space-x-2">
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            borderRadius: '50%'
          }}></div>
          <span className="text-xs text-blue-600 font-medium">{t('status_online')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#f59e0b',
            borderRadius: '50%'
          }}></div>
          <span className="text-xs text-orange-600 font-medium">{t('status_authenticated')}</span>
        </div>
      </div>
    </div>
  );
}
