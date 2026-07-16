import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Lock, Smartphone, AlertTriangle, CheckCircle } from "lucide-react";

interface SecurityItem {
  id: string;
  name: string;
  status: 'verified' | 'pending' | 'required';
  icon: typeof Shield;
}

export default function SecurityCenter() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  const securityItems: SecurityItem[] = [
    { id: 'password', name: 'Password', status: 'verified', icon: Lock },
    { id: 'twofactor', name: 'Two-Factor Authentication', status: 'pending', icon: Smartphone },
    { id: 'biometric', name: 'Biometric Auth', status: 'pending', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as User | undefined} />
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('security_center')}</h1>
        <p className="text-gray-600 mb-6">{t('manage_account_verification_status')}</p>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-lg font-semibold">{t('account_security_level')}</p>
              <p className="text-sm text-gray-500">{t('fully_verified')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {securityItems.map((item: SecurityItem) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-gray-400" />
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.status === 'verified' ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    {t('verified')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="w-5 h-5" />
                    {t('pending')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
