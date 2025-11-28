import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpDown, Calculator, Clock, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
export default function Exchange() {
    const { userProfile } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [amount, setAmount] = useState('1000');
    const [convertedAmount, setConvertedAmount] = useState(0);
    const queryClient = useQueryClient();
    // Fetch live exchange rates from Supabase/API
    const { data: exchangeRates, isLoading: ratesLoading, refetch } = useQuery({
        queryKey: ['/api/exchange-rates'],
        staleTime: 30000, // 30 seconds cache
        refetchInterval: 60000 // Auto refresh every minute
    });
    // Calculate converted amount
    useEffect(() => {
        if (exchangeRates && amount) {
            const fromRate = exchangeRates[fromCurrency] || 1;
            const toRate = exchangeRates[toCurrency] || 1;
            const converted = (parseFloat(amount) / fromRate) * toRate;
            setConvertedAmount(converted);
        }
    }, [exchangeRates, fromCurrency, toCurrency, amount]);
    const handleSwapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };
    const handleRefreshRates = () => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['/api/exchange-rates'] });
    };
    const handleExchange = async () => {
        try {
            const response = await apiRequest('POST', '/api/currency-exchange', {
                userId: userProfile?.id,
                fromCurrency,
                toCurrency,
                amount: parseFloat(amount),
                exchangeRate: convertedAmount / parseFloat(amount)
            });
            if (response.ok) {
                toast({
                    title: 'Exchange Successful',
                    description: `Successfully exchanged ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency}`
                });
                queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            }
        }
        catch (error) {
            toast({
                title: 'Exchange Failed',
                description: 'Unable to complete currency exchange. Please try again.',
                variant: 'destructive'
            });
        }
    };
    const currencies = [
        { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
        { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
        { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
        { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
        { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
        { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
        { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
        { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
        { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
        { code: 'KRW', name: 'Korean Won', flag: '🇰🇷' }
    ];
    const topRates = exchangeRates ? Object.entries(exchangeRates)
        .filter(([code]) => ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'].includes(code))
        .slice(0, 6) : [];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsx("div", { className: "pt-16 pb-20", children: _jsxs("div", { className: "px-4 py-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: t('currency_exchange') || 'Currency Exchange' }), _jsx("p", { className: "text-gray-600", children: t('convert_currencies') || 'Convert currencies with real-time rates' })] }), _jsxs(Button, { onClick: handleRefreshRates, variant: "outline", size: "sm", children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${ratesLoading ? 'animate-spin' : ''}` }), t('refresh') || 'Refresh'] })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Calculator, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { children: t('currency_calculator') || 'Currency Calculator' })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('from') || 'From' }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Input, { type: "number", value: amount, onChange: (e) => setAmount(e.target.value), className: "flex-1", placeholder: "0.00" }), _jsxs(Select, { value: fromCurrency, onValueChange: setFromCurrency, children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: currencies.map(currency => (_jsxs(SelectItem, { value: currency.code, children: [currency.flag, " ", currency.code] }, currency.code))) })] })] })] }), _jsx("div", { className: "flex justify-center", children: _jsx(Button, { onClick: handleSwapCurrencies, variant: "outline", size: "sm", className: "rounded-full p-2", children: _jsx(ArrowUpDown, { className: "w-4 h-4" }) }) }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('to') || 'To' }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Input, { type: "text", value: convertedAmount.toFixed(2), disabled: true, className: "flex-1 bg-gray-50" }), _jsxs(Select, { value: toCurrency, onValueChange: setToCurrency, children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: currencies.map(currency => (_jsxs(SelectItem, { value: currency.code, children: [currency.flag, " ", currency.code] }, currency.code))) })] })] })] }), exchangeRates && (_jsxs("div", { className: "p-3 bg-blue-50 rounded-lg", children: [_jsxs("div", { className: "text-sm text-blue-600 mb-1", children: ["1 ", fromCurrency, " = ", (convertedAmount / parseFloat(amount || '1')).toFixed(4), " ", toCurrency] }), _jsxs("div", { className: "flex items-center text-xs text-gray-500", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), t('last_updated') || 'Last updated', ": ", new Date().toLocaleTimeString()] })] })), _jsx(Button, { onClick: handleExchange, className: "w-full bg-blue-600 text-white", disabled: !amount || parseFloat(amount) <= 0, children: t('exchange_now') || 'Exchange Now' })] })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Globe, { className: "w-5 h-5 text-green-600" }), _jsx("span", { children: t('live_rates') || 'Live Exchange Rates' }), _jsx(Badge, { variant: "default", className: "bg-green-100 text-green-800 text-xs", children: t('live') || 'LIVE' })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: topRates.map(([currency, rate]) => {
                                            const currencyInfo = currencies.find(c => c.code === currency);
                                            const change = Math.random() * 2 - 1; // Simulate rate change
                                            const isPositive = change >= 0;
                                            return (_jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-lg", children: currencyInfo?.flag }), _jsxs("div", { children: [_jsxs("div", { className: "font-medium", children: ["USD/", currency] }), _jsx("div", { className: "text-sm text-gray-500", children: currencyInfo?.name })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "font-medium", children: rate.toFixed(4) }), _jsxs("div", { className: `text-sm flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`, children: [isPositive ? (_jsx(TrendingUp, { className: "w-3 h-3 mr-1" })) : (_jsx(TrendingDown, { className: "w-3 h-3 mr-1" })), isPositive ? '+' : '', change.toFixed(2), "%"] })] })] }, currency));
                                        }) }) })] })] }) }), _jsx(BottomNavigation, {})] }));
}
