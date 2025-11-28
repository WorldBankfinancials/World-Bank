import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Target, Calendar, Users } from "lucide-react";
export default function WealthManagement() {
    const { t } = useLanguage();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-wb-gray flex items-center justify-center", children: _jsx("div", { className: "text-wb-dark", children: t('loading') }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-wb-gray", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold wb-dark", children: "Wealth Management" }), _jsx("p", { className: "text-wb-text mt-2", children: "Professional wealth advisory and investment planning services" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Target, { className: "w-5 h-5" }), _jsx("span", { children: "Financial Goals" })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-green-800", children: "Retirement Planning" }), _jsx("p", { className: "text-sm text-green-600", children: "Target: $2.5M by 2045" }), _jsx("div", { className: "mt-2 bg-green-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-600 h-2 rounded-full w-3/4" }) }), _jsx("p", { className: "text-xs text-green-600 mt-1", children: "75% complete" })] }), _jsxs(Button, { className: "bg-wb-blue text-white w-full", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "Schedule Consultation"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Users, { className: "w-5 h-5" }), _jsx("span", { children: "Your Advisory Team" })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg", children: [_jsx("div", { className: "w-12 h-12 bg-wb-blue-light rounded-full flex items-center justify-center", children: _jsx("span", { className: "font-semibold wb-blue", children: "SA" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium wb-dark", children: "Sarah Anderson" }), _jsx("p", { className: "text-sm text-wb-text", children: "Senior Wealth Advisor" })] })] }), _jsx(Button, { variant: "outline", className: "w-full", children: "Contact Your Advisor" })] })] })] })] }), _jsx(Footer, {})] }));
}
