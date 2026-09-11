import type { User } from "@packages/shared/schema";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Building2, 
  Users, 
  Globe, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Calculator,
  ArrowRightLeft,
  FileText,
  Briefcase,
  Zap,
  CheckCircle,
  Star,
  DollarSign,
  Phone
} from "lucide-react";


export default function BusinessBanking() {
  const { t } = useLanguage();
  const { data: user, isLoading } = useQuery<User | any>({
    queryKey: ['/api/user'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  const businessServices = [
    {
      icon: Building2,
      title: t('business_accounts'),
      description: t('tailored_accounts'),
      features: [t('multi_currency_accounts'), t('bulk_payments'), t('api_integration'), t('dedicated_manager')],
      pricing: t('starting_25_month')
    },
    {
      icon: CreditCard,
      title: t('corporate_cards'),
      description: t('expense_management'),
      features: [t('employee_cards'), t('expense_tracking'), t('spending_controls'), t('rewards_program')],
      pricing: t('no_annual_fee')
    },
    {
      icon: ArrowRightLeft,
      title: t('trade_finance_title'),
      description: t('international_trade_financing'),
      features: [t('letters_of_credit'), t('documentary_collections'), t('trade_guarantees'), t('supply_chain')],
      pricing: t('competitive_rates')
    },
    {
      icon: Calculator,
      title: t('treasury_services_title'),
      description: t('cash_management_desc'),
      features: [t('cash_pooling'), t('sweep_accounts'), t('fx_services'), t('investment_management')],
      pricing: t('custom_pricing')
    }
  ];

  const industryExpertise = [
    { name: t('industry_technology'), icon: "💻", description: t('technology_desc') },
    { name: t('industry_healthcare'), icon: "🏥", description: t('healthcare_desc') },
    { name: t('industry_manufacturing'), icon: "🏭", description: t('manufacturing_desc') },
    { name: t('industry_real_estate'), icon: "🏢", description: t('real_estate_desc') },
    { name: t('industry_energy'), icon: "⚡", description: t('energy_desc') },
    { name: t('industry_retail'), icon: "🛍️", description: t('retail_desc') }
  ];

  const globalCapabilities = [
    { metric: "50+", label: t('countries_served'), icon: Globe },
    { metric: "25", label: t('currencies_supported'), icon: DollarSign },
    { metric: "10,000+", label: t('corporate_clients_label'), icon: Users },
    { metric: "$2.5T", label: t('assets_under_mgmt_label'), icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('business_banking_title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            {t('comprehensive_solutions')}
          </p>
          <div className="flex justify-center space-x-3">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <Briefcase className="w-4 h-4 mr-2" />
              {t('get_started')}
            </Button>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              {t('contact_specialist')}
            </Button>
          </div>
        </div>

        {/* Global Capabilities */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl">{t('global_capabilities')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {globalCapabilities.map((item, index) => (
                <div key={`item-${index}`} className="flex flex-col items-center">
                  <item.icon className="w-8 h-8 text-blue-600 mb-2" />
                  <div className="text-3xl font-bold text-gray-900">{item.metric}</div>
                  <div className="text-gray-600">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Services */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Business Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {businessServices.map((service, index) => (
              <Card key={`item-${index}`} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">{service.pricing}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full">
                    {t('learn_more')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Industry Expertise */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Industry Expertise</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industryExpertise.map((industry, index) => (
              <Card key={`item-${index}`} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-4xl mb-3">{industry.icon}</div>
                  <div className="font-semibold text-gray-900 mb-2">{industry.name}</div>
                  <div className="text-sm text-gray-600">{industry.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Digital Solutions */}
        <Card className="mb-12 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Digital Business Banking</h2>
                <p className="text-blue-100 mb-6">
                  Advanced digital bank with API integration, real-time reporting, and automated workflows
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-blue-200" />
                    <span className="text-blue-100">Real-time processing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-200" />
                    <span className="text-blue-100">Bank-grade security</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-blue-200" />
                    <span className="text-blue-100">Global connectivity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-blue-200" />
                    <span className="text-blue-100">24/7 support</span>
                  </div>
                </div>
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  Try Digital Banking
                </Button>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-lg p-6">
                  <Building2 className="w-24 h-24 text-blue-200 mx-auto mb-4" />
                  <div className="text-2xl font-bold mb-2">99.9%</div>
                  <div className="text-blue-100">Bank Uptime</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our business banking specialists are ready to help you find the right solutions for your company
            </p>
            <div className="flex justify-center space-x-4">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <Phone className="w-4 h-4 mr-2" />
                Schedule Consultation
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Download Brochure
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}