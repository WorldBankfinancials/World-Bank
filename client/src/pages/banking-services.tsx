
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Building2, 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  Globe, 
  Shield, 
  Users, 
  Banknote,
  ArrowRightLeft,
  Calculator,
  Home,
  Car,
  GraduationCap
} from "lucide-react";


export default function BankingServices() {
  const { t } = useLanguage();
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wb-gray flex items-center justify-center">
        <div className="text-wb-dark">{t('loading')}</div>
      </div>
    );
  }

  const personalServices = [
    {
      icon: Building2,
      title: t('checking_accounts'),
      description: t('checking_description'),
      features: [t('no_minimum_balance'), t('free_atm_worldwide'), t('mobile_banking')]
    },
    {
      icon: PiggyBank,
      title: t('savings_accounts'),
      description: t('savings_description'),
      features: [t('high_apy'), t('no_monthly_fees'), t('automatic_savings')]
    },
    {
      icon: CreditCard,
      title: t('credit_cards'),
      description: t('credit_cards_description'),
      features: [t('no_foreign_fees'), t('travel_rewards'), t('purchase_protection')]
    },
    {
      icon: Home,
      title: t('mortgage_services'),
      description: t('mortgage_description'),
      features: [t('competitive_rates'), t('multiple_currencies'), t('expert_guidance')]
    }
  ];

  const businessServices = [
    {
      icon: Users,
      title: t('business_banking'),
      description: t('business_banking_description'),
      features: [t('multi_currency_accounts'), t('trade_finance'), t('cash_management')]
    },
    {
      icon: Globe,
      title: t('international_trade'),
      description: t('international_trade_description'),
      features: [t('letters_of_credit'), t('documentary_collections'), t('trade_guarantees')]
    },
    {
      icon: TrendingUp,
      title: t('investment_services'),
      description: t('investment_services_description'),
      features: [t('portfolio_management'), t('market_research'), t('risk_assessment')]
    },
    {
      icon: ArrowRightLeft,
      title: t('treasury_services'),
      description: t('treasury_services_description'),
      features: [t('liquidity_management'), t('fx_services'), t('payment_solutions')]
    }
  ];

  const specialtyServices = [
    {
      icon: Calculator,
      title: t('loan_services'),
      description: t('loan_services_description'),
      types: [t('personal_loans'), t('auto_loans'), t('business_loans'), t('equipment_financing')]
    },
    {
      icon: GraduationCap,
      title: t('education_financing'),
      description: t('education_financing_description'),
      types: [t('student_loans'), t('education_savings'), t('study_abroad_financing')]
    },
    {
      icon: Shield,
      title: t('insurance_services'),
      description: t('insurance_services_description'),
      types: [t('life_insurance'), t('property_insurance'), t('business_insurance')]
    }
  ];

  return (
    <div className="min-h-screen bg-wb-gray">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold wb-dark mb-4">Banking Services</h1>
          <p className="text-xl text-wb-text max-w-3xl mx-auto">
            Comprehensive financial solutions designed for individuals and businesses operating globally
          </p>
          <div className="flex justify-center mt-6">
            <Badge variant="outline" className="mr-2">
              <Globe className="w-4 h-4 mr-1" />
              190+ Countries
            </Badge>
            <Badge variant="outline" className="mr-2">
              <Shield className="w-4 h-4 mr-1" />
              Bank-Grade Security
            </Badge>
            <Badge variant="outline">
              <Users className="w-4 h-4 mr-1" />
              24/7 Support
            </Badge>
          </div>
        </div>

        {/* Personal Banking */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold wb-dark mb-6">Personal Banking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personalServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <service.icon className="w-8 h-8 wb-blue mb-2" />
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-wb-text mb-4">{service.description}</p>
                  <ul className="space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-wb-text flex items-center">
                        <div className="w-1.5 h-1.5 bg-wb-blue rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4" variant="outline">Learn More</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Banking */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold wb-dark mb-6">Business Banking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <service.icon className="w-8 h-8 wb-green mb-2" />
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-wb-text mb-4">{service.description}</p>
                  <ul className="space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-wb-text flex items-center">
                        <div className="w-1.5 h-1.5 bg-wb-green rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4" variant="outline">Learn More</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Specialty Services */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold wb-dark mb-6">Specialty Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialtyServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <service.icon className="w-8 h-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-wb-text mb-4">{service.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {service.types.map((type, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline">Explore Options</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Global Infrastructure */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Globe className="w-6 h-6 mr-2" />
              Global Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold wb-blue">190+</div>
                <div className="text-wb-text">Countries Served</div>
              </div>
              <div>
                <div className="text-3xl font-bold wb-green">50,000+</div>
                <div className="text-wb-text">ATM Network</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">25</div>
                <div className="text-wb-text">Currencies Supported</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">24/7</div>
                <div className="text-wb-text">Customer Support</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
