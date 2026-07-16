import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, Shield, TrendingUp, Home, Building, Landmark } from "lucide-react";

interface ServiceCard {
  id: string;
  icon: typeof CreditCard;
  titleKey: string;
  descKey: string;
  features: string[];
}

const services: ServiceCard[] = [
  { id: 'checking', icon: CreditCard, titleKey: 'checking_accounts', descKey: 'checking_description', features: ['no_minimum_balance', 'free_atm_worldwide', 'mobile_banking'] },
  { id: 'savings', icon: Shield, titleKey: 'savings_accounts', descKey: 'savings_description', features: ['high_apy', 'no_monthly_fees', 'automatic_savings'] },
  { id: 'credit', icon: CreditCard, titleKey: 'credit_cards', descKey: 'credit_cards_description', features: ['no_foreign_fees', 'travel_rewards', 'purchase_protection'] },
  { id: 'mortgage', icon: Home, titleKey: 'mortgage_services', descKey: 'mortgage_description', features: ['competitive_rates', 'multiple_currencies', 'expert_guidance'] },
  { id: 'business', icon: Building, titleKey: 'business_banking', descKey: 'business_banking_description', features: ['bulk_payments', 'api_integration', 'dedicated_manager'] },
  { id: 'trade', icon: Landmark, titleKey: 'international_trade', descKey: 'international_trade_description', features: ['letters_of_credit', 'documentary_collections', 'trade_guarantees'] },
];

export default function BankingServices() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as User | undefined} />
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('banking_services')}</h1>
        <p className="text-gray-600 mb-6">{t('comprehensive_solutions')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service: ServiceCard) => {
            const Icon = service.icon;
            return (
              <div key={service.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-8 h-8 text-blue-600" />
                  <h2 className="text-lg font-semibold">{t(service.titleKey)}</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">{t(service.descKey)}</p>
                <ul className="space-y-2">
                  {service.features.map((feature: string) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {t(feature)}
                    </li>
                  ))}
                </ul>
                <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  {t('learn_more')}
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
