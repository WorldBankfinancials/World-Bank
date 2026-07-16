import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Building, CreditCard, Landmark, TrendingUp, Users, Globe } from "lucide-react";

interface BusinessService {
  id: string;
  icon: typeof Building;
  titleKey: string;
  descKey: string;
}

const businessServices: BusinessService[] = [
  { id: 'accounts', icon: Building, titleKey: 'business_accounts', descKey: 'tailored_accounts' },
  { id: 'cards', icon: CreditCard, titleKey: 'corporate_cards', descKey: 'expense_management' },
  { id: 'trade', icon: Landmark, titleKey: 'trade_finance_title', descKey: 'international_trade_financing' },
  { id: 'treasury', icon: TrendingUp, titleKey: 'treasury_services_title', descKey: 'cash_management_desc' },
];

const stats = [
  { labelKey: 'countries_served', value: '190+' },
  { labelKey: 'currencies_supported', value: '40+' },
  { labelKey: 'corporate_clients', value: '10,000+' },
  { labelKey: 'assets_under_management', value: '$2T+' },
];

export default function BusinessBanking() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as User | undefined} />
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('business_banking_title')}</h1>
        <p className="text-gray-600 mb-6">{t('comprehensive_solutions')}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.labelKey} className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{t(stat.labelKey)}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businessServices.map((service: BusinessService) => {
            const Icon = service.icon;
            return (
              <div key={service.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-8 h-8 text-blue-600" />
                  <h2 className="text-lg font-semibold">{t(service.titleKey)}</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">{t(service.descKey)}</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  {t('get_started')}
                </button>
              </div>
            );
          })}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
