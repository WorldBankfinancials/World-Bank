import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Building2, CreditCard, PiggyBank, TrendingUp, Globe, Shield, Users, ArrowRightLeft, Calculator, Home, GraduationCap } from "lucide-react";
export default function BankingServices() {
    const { t } = useLanguage();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-wb-gray flex items-center justify-center", children: _jsx("div", { className: "text-wb-dark", children: t('loading') }) }));
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
    return (_jsxs("div", { className: "min-h-screen bg-wb-gray", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl font-bold wb-dark mb-4", children: "Banking Services" }), _jsx("p", { className: "text-xl text-wb-text max-w-3xl mx-auto", children: "Comprehensive financial solutions designed for individuals and businesses operating globally" }), _jsxs("div", { className: "flex justify-center mt-6", children: [_jsxs(Badge, { variant: "outline", className: "mr-2", children: [_jsx(Globe, { className: "w-4 h-4 mr-1" }), "190+ Countries"] }), _jsxs(Badge, { variant: "outline", className: "mr-2", children: [_jsx(Shield, { className: "w-4 h-4 mr-1" }), "Bank-Grade Security"] }), _jsxs(Badge, { variant: "outline", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), "24/7 Support"] })] })] }), _jsxs("div", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-bold wb-dark mb-6", children: "Personal Banking" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: personalServices.map((service, index) => (_jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(service.icon, { className: "w-8 h-8 wb-blue mb-2" }), _jsx(CardTitle, { className: "text-lg", children: service.title })] }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-wb-text mb-4", children: service.description }), _jsx("ul", { className: "space-y-1", children: service.features.map((feature, idx) => (_jsxs("li", { className: "text-sm text-wb-text flex items-center", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-wb-blue rounded-full mr-2" }), feature] }, idx))) }), _jsx(Button, { className: "w-full mt-4", variant: "outline", children: "Learn More" })] })] }, index))) })] }), _jsxs("div", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-bold wb-dark mb-6", children: "Business Banking" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: businessServices.map((service, index) => (_jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(service.icon, { className: "w-8 h-8 wb-green mb-2" }), _jsx(CardTitle, { className: "text-lg", children: service.title })] }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-wb-text mb-4", children: service.description }), _jsx("ul", { className: "space-y-1", children: service.features.map((feature, idx) => (_jsxs("li", { className: "text-sm text-wb-text flex items-center", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-wb-green rounded-full mr-2" }), feature] }, idx))) }), _jsx(Button, { className: "w-full mt-4", variant: "outline", children: "Learn More" })] })] }, index))) })] }), _jsxs("div", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-bold wb-dark mb-6", children: "Specialty Services" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: specialtyServices.map((service, index) => (_jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(service.icon, { className: "w-8 h-8 text-purple-600 mb-2" }), _jsx(CardTitle, { className: "text-lg", children: service.title })] }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-wb-text mb-4", children: service.description }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: service.types.map((type, idx) => (_jsx(Badge, { variant: "secondary", className: "text-xs", children: type }, idx))) }), _jsx(Button, { className: "w-full mt-4", variant: "outline", children: "Explore Options" })] })] }, index))) })] }), _jsxs(Card, { className: "mb-8", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-2xl flex items-center", children: [_jsx(Globe, { className: "w-6 h-6 mr-2" }), "Global Infrastructure"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 text-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-3xl font-bold wb-blue", children: "190+" }), _jsx("div", { className: "text-wb-text", children: "Countries Served" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-3xl font-bold wb-green", children: "50,000+" }), _jsx("div", { className: "text-wb-text", children: "ATM Network" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-3xl font-bold text-purple-600", children: "25" }), _jsx("div", { className: "text-wb-text", children: "Currencies Supported" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-3xl font-bold text-orange-600", children: "24/7" }), _jsx("div", { className: "text-wb-text", children: "Customer Support" })] })] }) })] })] }), _jsx(Footer, {})] }));
}
