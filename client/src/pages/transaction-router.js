import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Navigation, Route, MapPin, ArrowRight, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
export default function TransactionRouter() {
    const { t } = useLanguage();
    const [, setLocation] = useLocation();
    const [routes, setRoutes] = useState([
        {
            id: '1',
            name: 'Dashboard Route',
            description: 'Send all transactions to customer dashboard',
            targetPage: '/dashboard'
        },
        {
            id: '2',
            name: 'History Route',
            description: 'Send all transactions to transaction history page',
            targetPage: '/history'
        },
        {
            id: '3',
            name: 'Admin Panel Route',
            description: 'Send all transactions to admin panel',
            targetPage: '/simple-admin'
        }
    ]);
    const [newRoute, setNewRoute] = useState({
        name: '',
        description: '',
        targetPage: '',
        accountType: '',
        transactionType: '',
        amountMin: '',
        amountMax: ''
    });
    const [isCreating, setIsCreating] = useState(false);
    const pageOptions = [
        { value: '/dashboard', label: 'Customer Dashboard' },
        { value: '/history', label: 'Transaction History' },
        { value: '/cards', label: 'Cards Page' },
        { value: '/transfer', label: 'Transfer Page' },
        { value: '/simple-admin', label: 'Admin Panel' },
        { value: '/profile-settings', label: 'Profile Settings' },
        { value: '/banking-services', label: 'Banking Services' },
        { value: '/statements-reports', label: 'Statements & Reports' },
        { value: '/investment-portfolio', label: 'Investment Portfolio' },
        { value: '/wealth-management', label: 'Wealth Management' },
        { value: '/support-center', label: 'Support Center' },
        { value: '/verification', label: 'Verification Center' }
    ];
    const handleCreateRoute = () => {
        if (!newRoute.name || !newRoute.targetPage) {
            // console.warn('Missing route name or target page');
            return;
        }
        const route = {
            id: Date.now().toString(),
            name: newRoute.name,
            description: newRoute.description,
            targetPage: newRoute.targetPage,
            conditions: {}
        };
        if (newRoute.accountType)
            route.conditions.accountType = newRoute.accountType;
        if (newRoute.transactionType)
            route.conditions.transactionType = newRoute.transactionType;
        if (newRoute.amountMin)
            route.conditions.amountMin = parseFloat(newRoute.amountMin);
        if (newRoute.amountMax)
            route.conditions.amountMax = parseFloat(newRoute.amountMax);
        setRoutes([...routes, route]);
        // Reset form
        setNewRoute({
            name: '',
            description: '',
            targetPage: '',
            accountType: '',
            transactionType: '',
            amountMin: '',
            amountMax: ''
        });
        setIsCreating(false);
        // console.log(`Route "${route.name}" created successfully`);
    };
    const handleDeleteRoute = (routeId) => {
        setRoutes(routes.filter(route => route.id !== routeId));
    };
    const handleTestRoute = (targetPage) => {
        setLocation(targetPage);
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-4", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Transaction Router" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Control where transactions navigate after creation" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Badge, { variant: "outline", className: "bg-blue-50", children: [_jsx(Route, { className: "w-4 h-4 mr-1" }), "Router Control"] }), _jsxs(Button, { onClick: () => setIsCreating(!isCreating), className: "bg-green-600 hover:bg-green-700", children: [_jsx(Settings, { className: "w-4 h-4 mr-2" }), isCreating ? 'Cancel' : 'Create Route'] })] })] }), isCreating && (_jsxs(Card, { className: "border-green-200 bg-green-50", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-green-800", children: "Create New Transaction Route" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "routeName", children: "Route Name *" }), _jsx(Input, { id: "routeName", placeholder: "e.g., High Value Transactions", value: newRoute.name, onChange: (e) => setNewRoute({ ...newRoute, name: e.target.value }), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "targetPage", children: "Target Page *" }), _jsxs("select", { id: "targetPage", value: newRoute.targetPage, onChange: (e) => setNewRoute({ ...newRoute, targetPage: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mt-1", children: [_jsx("option", { value: "", children: "Select target page" }), pageOptions.map(page => (_jsx("option", { value: page.value, children: page.label }, page.value)))] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "accountType", children: "Account Type Filter (Optional)" }), _jsxs("select", { id: "accountType", value: newRoute.accountType, onChange: (e) => setNewRoute({ ...newRoute, accountType: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mt-1", children: [_jsx("option", { value: "", children: "Any account type" }), _jsx("option", { value: "checking", children: "Checking only" }), _jsx("option", { value: "savings", children: "Savings only" }), _jsx("option", { value: "investment", children: "Investment only" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "transactionType", children: "Transaction Type Filter (Optional)" }), _jsxs("select", { id: "transactionType", value: newRoute.transactionType, onChange: (e) => setNewRoute({ ...newRoute, transactionType: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mt-1", children: [_jsx("option", { value: "", children: "Any transaction type" }), _jsx("option", { value: "credit", children: "Credits only" }), _jsx("option", { value: "debit", children: "Debits only" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "amountMin", children: "Minimum Amount (Optional)" }), _jsx(Input, { id: "amountMin", type: "number", step: "0.01", placeholder: "0.00", value: newRoute.amountMin, onChange: (e) => setNewRoute({ ...newRoute, amountMin: e.target.value }), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "amountMax", children: "Maximum Amount (Optional)" }), _jsx(Input, { id: "amountMax", type: "number", step: "0.01", placeholder: "0.00", value: newRoute.amountMax, onChange: (e) => setNewRoute({ ...newRoute, amountMax: e.target.value }), className: "mt-1" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Input, { id: "description", placeholder: "Describe when this route should be used", value: newRoute.description, onChange: (e) => setNewRoute({ ...newRoute, description: e.target.value }), className: "mt-1" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { onClick: handleCreateRoute, className: "bg-green-600 hover:bg-green-700", children: "Create Route" }), _jsx(Button, { variant: "outline", onClick: () => setIsCreating(false), children: "Cancel" })] })] })] })), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Navigation, { className: "w-5 h-5 mr-2" }), "Active Transaction Routes"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Configure where different types of transactions should navigate after creation" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: routes.map((route) => (_jsx("div", { className: "border rounded-lg p-4 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h3", { className: "font-medium text-gray-900", children: route.name }), _jsxs(Badge, { variant: "outline", className: "text-blue-600 border-blue-200", children: [_jsx(MapPin, { className: "w-3 h-3 mr-1" }), route.targetPage] })] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: route.description }), route.conditions && Object.keys(route.conditions).length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [route.conditions.accountType && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: ["Account: ", route.conditions.accountType] })), route.conditions.transactionType && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: ["Type: ", route.conditions.transactionType] })), route.conditions.amountMin && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: ["Min: $", route.conditions.amountMin] })), route.conditions.amountMax && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: ["Max: $", route.conditions.amountMax] }))] }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleTestRoute(route.targetPage), children: [_jsx(ArrowRight, { className: "w-4 h-4 mr-1" }), "Test"] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleDeleteRoute(route.id), className: "text-red-600 hover:text-red-700", children: "Delete" })] })] }) }, route.id))) }) })] }), _jsxs(Card, { className: "bg-blue-50 border-blue-200", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-blue-800", children: "How to Use Transaction Routing" }) }), _jsxs(CardContent, { className: "text-sm text-blue-700 space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "1. Create Routes:" }), " Define where transactions should navigate based on conditions"] }), _jsxs("p", { children: [_jsx("strong", { children: "2. Set Conditions:" }), " Filter by account type, transaction type, or amount ranges"] }), _jsxs("p", { children: [_jsx("strong", { children: "3. Test Routes:" }), " Click \"Test\" to navigate to the target page and verify routing"] }), _jsxs("p", { children: [_jsx("strong", { children: "4. Use in Transaction Creator:" }), " Select destination page when creating transactions"] }), _jsxs("p", { children: [_jsx("strong", { children: "5. Automatic Routing:" }), " Transactions will automatically navigate to specified pages after creation"] })] })] })] }) }));
}
