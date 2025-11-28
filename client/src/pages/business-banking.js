import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Users, Globe, CreditCard, TrendingUp, Shield, Calculator, ArrowRightLeft, FileText, Briefcase, Zap, CheckCircle, Star, DollarSign, Phone } from "lucide-react";
export default function BusinessBanking() {
    const { t } = useLanguage();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600", children: t('loading') }) }));
    }
    const businessServices = [
        {
            icon: Building2,
            title: "Business Accounts",
            description: "Tailored accounts for businesses of all sizes",
            features: ["Multi-currency support", "Bulk payments", "API integration", "Dedicated relationship manager"],
            pricing: "Starting from $25/month"
        },
        {
            icon: CreditCard,
            title: "Corporate Cards",
            description: "Expense management and corporate credit solutions",
            features: ["Employee cards", "Expense tracking", "Spending controls", "Rewards program"],
            pricing: "No annual fee"
        },
        {
            icon: ArrowRightLeft,
            title: "Trade Finance",
            description: "International trade financing solutions",
            features: ["Letters of credit", "Documentary collections", "Trade guarantees", "Supply chain finance"],
            pricing: "Competitive rates"
        },
        {
            icon: Calculator,
            title: "Treasury Services",
            description: "Cash management and liquidity solutions",
            features: ["Cash pooling", "Sweep accounts", "FX services", "Investment management"],
            pricing: "Custom pricing"
        }
    ];
    const industryExpertise = [
        { name: "Technology", icon: "💻", description: "Fintech and software companies" },
        { name: "Healthcare", icon: "🏥", description: "Medical and pharmaceutical" },
        { name: "Manufacturing", icon: "🏭", description: "Industrial and production" },
        { name: "Real Estate", icon: "🏢", description: "Property development and investment" },
        { name: "Energy", icon: "⚡", description: "Oil, gas and renewable energy" },
        { name: "Retail", icon: "🛍️", description: "E-commerce and traditional retail" }
    ];
    const globalCapabilities = [
        { metric: "50+", label: "Countries Served", icon: Globe },
        { metric: "25", label: "Currencies Supported", icon: DollarSign },
        { metric: "10,000+", label: "Corporate Clients", icon: Users },
        { metric: "$2.5T", label: "Assets Under Management", icon: TrendingUp }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Business Banking Solutions" }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto mb-6", children: "Comprehensive financial solutions designed to help your business grow globally" }), _jsxs("div", { className: "flex justify-center space-x-3", children: [_jsxs(Button, { className: "bg-blue-600 text-white hover:bg-blue-700", children: [_jsx(Briefcase, { className: "w-4 h-4 mr-2" }), "Get Started"] }), _jsxs(Button, { variant: "outline", children: [_jsx(Users, { className: "w-4 h-4 mr-2" }), "Contact Specialist"] })] })] }), _jsxs(Card, { className: "mb-12", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-center text-2xl", children: "Global Business Banking Capabilities" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6 text-center", children: globalCapabilities.map((item, index) => (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx(item.icon, { className: "w-8 h-8 text-blue-600 mb-2" }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: item.metric }), _jsx("div", { className: "text-gray-600", children: item.label })] }, index))) }) })] }), _jsxs("div", { className: "mb-12", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 text-center mb-8", children: "Our Business Services" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: businessServices.map((service, index) => (_jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center", children: _jsx(service.icon, { className: "w-6 h-6 text-blue-600" }) }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-xl", children: service.title }), _jsx(Badge, { variant: "outline", className: "mt-1", children: service.pricing })] })] }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-gray-600 mb-4", children: service.description }), _jsx("div", { className: "space-y-2 mb-6", children: service.features.map((feature, idx) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-600" }), _jsx("span", { className: "text-sm text-gray-700", children: feature })] }, idx))) }), _jsx(Button, { variant: "outline", className: "w-full", children: "Learn More" })] })] }, index))) })] }), _jsxs("div", { className: "mb-12", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 text-center mb-8", children: "Industry Expertise" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6", children: industryExpertise.map((industry, index) => (_jsx(Card, { className: "text-center hover:shadow-md transition-shadow cursor-pointer", children: _jsxs(CardContent, { className: "p-6", children: [_jsx("div", { className: "text-4xl mb-3", children: industry.icon }), _jsx("div", { className: "font-semibold text-gray-900 mb-2", children: industry.name }), _jsx("div", { className: "text-sm text-gray-600", children: industry.description })] }) }, index))) })] }), _jsx(Card, { className: "mb-12 bg-gradient-to-r from-blue-600 to-blue-800 text-white", children: _jsx(CardContent, { className: "p-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-4", children: "Digital Business Banking" }), _jsx("p", { className: "text-blue-100 mb-6", children: "Advanced digital bank with API integration, real-time reporting, and automated workflows" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Zap, { className: "w-5 h-5 text-blue-200" }), _jsx("span", { className: "text-blue-100", children: "Real-time processing" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Shield, { className: "w-5 h-5 text-blue-200" }), _jsx("span", { className: "text-blue-100", children: "Bank-grade security" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Globe, { className: "w-5 h-5 text-blue-200" }), _jsx("span", { className: "text-blue-100", children: "Global connectivity" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Star, { className: "w-5 h-5 text-blue-200" }), _jsx("span", { className: "text-blue-100", children: "24/7 support" })] })] }), _jsx(Button, { className: "bg-white text-blue-600 hover:bg-gray-100", children: "Try Digital Banking" })] }), _jsx("div", { className: "text-center", children: _jsxs("div", { className: "bg-white bg-opacity-10 rounded-lg p-6", children: [_jsx(Building2, { className: "w-24 h-24 text-blue-200 mx-auto mb-4" }), _jsx("div", { className: "text-2xl font-bold mb-2", children: "99.9%" }), _jsx("div", { className: "text-blue-100", children: "Bank Uptime" })] }) })] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Ready to Get Started?" }), _jsx("p", { className: "text-gray-600 mb-6 max-w-2xl mx-auto", children: "Our business banking specialists are ready to help you find the right solutions for your company" }), _jsxs("div", { className: "flex justify-center space-x-4", children: [_jsxs(Button, { className: "bg-blue-600 text-white hover:bg-blue-700", children: [_jsx(Phone, { className: "w-4 h-4 mr-2" }), "Schedule Consultation"] }), _jsxs(Button, { variant: "outline", children: [_jsx(FileText, { className: "w-4 h-4 mr-2" }), "Download Brochure"] })] })] }) })] }), _jsx(Footer, {})] }));
}
