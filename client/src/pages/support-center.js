import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, Phone, MessageCircle, FileText, Clock } from "lucide-react";
export default function SupportCenter() {
    const { t } = useLanguage();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-wb-gray flex items-center justify-center", children: _jsx("div", { className: "text-wb-dark", children: t('loading') }) }));
    }
    const faqItems = [
        { question: "How do I transfer funds between accounts?", category: "Banking" },
        { question: "What are your current interest rates?", category: "Rates" },
        { question: "How do I report a lost or stolen card?", category: "Security" },
        { question: "What are the wire transfer fees?", category: "Fees" },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-wb-gray", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold wb-dark", children: "Support Center" }), _jsx("p", { className: "text-wb-text mt-2", children: "Find answers and get help with your banking needs" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Phone, { className: "w-5 h-5" }), _jsx("span", { children: "Phone Support" })] }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-wb-text mb-4", children: "Speak with a representative" }), _jsx("p", { className: "font-semibold wb-dark mb-2", children: "1-800-WORLD-BANK" }), _jsxs("div", { className: "flex items-center text-sm text-wb-text", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), _jsx("span", { children: "24/7 Available" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(MessageCircle, { className: "w-5 h-5" }), _jsx("span", { children: "Live Chat" })] }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-wb-text mb-4", children: "Chat with our support team" }), _jsx(Button, { className: "bg-wb-blue text-white w-full", children: "Start Chat" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(FileText, { className: "w-5 h-5" }), _jsx("span", { children: "Knowledge Base" })] }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-wb-text mb-4", children: "Search our help articles" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { placeholder: "Search help articles...", className: "pl-10" })] })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Frequently Asked Questions" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: faqItems.map((faq, index) => (_jsxs("div", { className: "flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium wb-dark", children: faq.question }), _jsx("p", { className: "text-sm text-wb-text", children: faq.category })] }), _jsx(Button, { variant: "ghost", size: "sm", children: "View Answer" })] }, index))) }) })] })] }), _jsx(Footer, {})] }));
}
