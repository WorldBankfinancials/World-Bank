import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
export default function InvestmentPortfolio() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    // Fetch real investment data from backend
    const { data: investments = [], isLoading: investmentsLoading } = useQuery({
        queryKey: ['/api/investments'],
        staleTime: 30000,
    });
    // Real-time subscription for investment updates
    useEffect(() => {
        const channel = supabase
            .channel('investment-updates')
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'investments'
        }, () => {
            console.log('🔄 Investment data changed, refreshing...');
            queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
        })
            .subscribe();
        return () => {
            channel.unsubscribe();
        };
    }, [queryClient]);
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    // Calculate real portfolio metrics
    const totalValue = investments.reduce((sum, inv) => sum + parseFloat(inv.total_value || inv.totalValue || 0), 0);
    const totalGainLoss = investments.reduce((sum, inv) => sum + parseFloat(inv.gain_loss || inv.gainLoss || 0), 0);
    // Guard against division by zero: use cost basis (totalValue - totalGainLoss)
    const costBasis = totalValue - totalGainLoss;
    const gainLossPercent = costBasis > 0 ? (totalGainLoss / costBasis) * 100 : 0;
    if (userLoading || investmentsLoading) {
        return (_jsx("div", { className: "min-h-screen bg-wb-gray flex items-center justify-center", children: _jsx("div", { className: "text-wb-dark", children: t('loading') }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-wb-gray", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold wb-dark", children: "Investment Portfolio" }), _jsx("p", { className: "text-wb-text mt-2", children: "Track your investment performance and holdings" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "text-sm font-medium text-wb-text", children: "Total Portfolio Value" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-3xl font-bold wb-dark", children: formatCurrency(totalValue) }), _jsxs("div", { className: "flex items-center mt-2", children: [gainLossPercent >= 0 ? (_jsx(TrendingUp, { className: "w-4 h-4 text-green-500 mr-1" })) : (_jsx(TrendingDown, { className: "w-4 h-4 text-red-500 mr-1" })), _jsxs("span", { className: `text-sm ${gainLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`, children: [gainLossPercent >= 0 ? '+' : '', gainLossPercent.toFixed(2), "% Total"] })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "text-sm font-medium text-wb-text", children: "Total Gain/Loss" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: `text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`, children: [totalGainLoss >= 0 ? '+' : '', formatCurrency(Math.abs(totalGainLoss))] }), _jsxs("div", { className: "flex items-center mt-2", children: [gainLossPercent >= 0 ? (_jsx(TrendingUp, { className: "w-4 h-4 text-green-500 mr-1" })) : (_jsx(TrendingDown, { className: "w-4 h-4 text-red-500 mr-1" })), _jsxs("span", { className: `text-sm ${gainLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`, children: [gainLossPercent >= 0 ? '+' : '', gainLossPercent.toFixed(2), "%"] })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "text-sm font-medium text-wb-text", children: "Total Holdings" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-3xl font-bold wb-dark", children: investments.length }), _jsx("p", { className: "text-sm text-wb-text mt-2", children: "Active investments" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(BarChart3, { className: "w-5 h-5" }), _jsx("span", { children: "Current Holdings" })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: investments.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(BarChart3, { className: "w-12 h-12 mx-auto text-gray-400 mb-4" }), _jsx("p", { className: "text-gray-500", children: "No investments yet" }), _jsx("p", { className: "text-sm text-gray-400 mt-2", children: "Start building your portfolio today" })] })) : (investments.map((investment) => {
                                        const symbol = investment.symbol || 'N/A';
                                        const name = investment.name || 'Unknown';
                                        const quantity = parseFloat(investment.quantity || 0);
                                        const currentPrice = parseFloat(investment.current_price || investment.currentPrice || 0);
                                        const totalValue = parseFloat(investment.total_value || investment.totalValue || 0);
                                        const gainLoss = parseFloat(investment.gain_loss || investment.gainLoss || 0);
                                        const gainLossPercent = parseFloat(investment.gain_loss_percent || investment.gainLossPercent || 0);
                                        return (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-12 h-12 bg-wb-blue-light rounded-full flex items-center justify-center", children: _jsx("span", { className: "font-bold wb-blue", children: symbol.charAt(0) }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold wb-dark", children: symbol }), _jsx("p", { className: "text-sm text-wb-text", children: name }), _jsxs("p", { className: "text-sm text-wb-text", children: [quantity, " shares"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold wb-dark", children: formatCurrency(currentPrice) }), _jsxs("div", { className: `flex items-center justify-end ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`, children: [gainLoss >= 0 ? (_jsx(TrendingUp, { className: "w-4 h-4 mr-1" })) : (_jsx(TrendingDown, { className: "w-4 h-4 mr-1" })), _jsxs("span", { className: "text-sm", children: [gainLoss >= 0 ? '+' : '', formatCurrency(Math.abs(gainLoss)), " (", gainLossPercent >= 0 ? '+' : '', gainLossPercent.toFixed(2), "%)"] })] }), _jsxs("p", { className: "text-sm text-wb-text", children: ["Value: ", formatCurrency(totalValue)] })] })] }, investment.id));
                                    })) }) })] })] }), _jsx(Footer, {})] }));
}
