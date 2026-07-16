import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Lock, Smartphone, Eye, Bell } from "lucide-react";

export default function SecuritySettings() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as User | undefined} />
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('security_settings')}</h1>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold">Password</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Change your account password</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Change Password
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold">{t('two_factor_authentication')}</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t('add_an_extra_layer_of_security')}</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {t('enabled')}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold">{t('session_security')}</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t('automatic_logout_and_session_management')}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold">{t('notification_preferences')}</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Security alerts and notifications</p>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
