import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Settings, User, LogOut, Shield, Check, Download, Building2, RotateCcw, TrendingUp, HelpCircle, CreditCard, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from "wouter";
import NavigationMenu from "./NavigationMenu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from './Avatar';
export default function Header({}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { userProfile } = useAuth();
    const [freshUserData, setFreshUserData] = useState(null);
    // Fetch fresh user data once only
    useEffect(() => {
        const fetchFreshUserData = async () => {
            try {
                const { authenticatedFetch } = await import('@/lib/queryClient');
                const response = await authenticatedFetch('/api/user', {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                if (response.ok) {
                    const userData = await response.json();
                    setFreshUserData(userData);
                }
            }
            catch (error) {
                // Silent error handling
            }
        };
        fetchFreshUserData();
    }, []);
    const profileMenuItems = [
        {
            category: "ACCOUNT MANAGEMENT",
            items: [
                { icon: User, label: "Profile Settings", href: "/profile-settings" },
                { icon: Shield, label: "Security Settings", href: "/security-settings" },
                { icon: Settings, label: "Account Preferences", href: "/account-preferences" },
                { icon: Check, label: "Verification Center", href: "/verification" }
            ]
        },
        {
            category: "BANKING SERVICES",
            items: [
                { icon: CreditCard, label: "Credit Cards", href: "/credit-cards" },
                { icon: ArrowUpRight, label: "Transaction History", href: "/transaction-history" },
                { icon: Download, label: "Statements & Reports", href: "/statements-reports" },
                { icon: Building2, label: "Banking Services", href: "/banking-services" },
                { icon: RotateCcw, label: "Transfer Funds", href: "/transfer-funds" }
            ]
        },
        {
            category: "INVESTMENT & WEALTH",
            items: [
                { icon: TrendingUp, label: "Investment Portfolio", href: "/investment-portfolio" },
                { icon: Building2, label: "Wealth Management", href: "/wealth-management" },
                { icon: TrendingUp, label: "Investment Trading", href: "/investment-trading" },
                { icon: Building2, label: "Business Banking", href: "/business-banking" }
            ]
        },
        {
            category: "DIGITAL SERVICES",
            items: [
                { icon: CreditCard, label: "Digital Wallet", href: "/digital-wallet" },
                { icon: User, label: "Mobile Pay", href: "/mobile-pay" },
                { icon: ArrowUpRight, label: "International Transfer", href: "/international-transfer" }
            ]
        },
        {
            category: "SUPPORT & HELP",
            items: [
                { icon: HelpCircle, label: "Support Center", href: "/support-center" },
                { icon: User, label: "Customer Support", href: "/customer-support" },
                { icon: Shield, label: "Security Center", href: "/security-center" },
                { icon: Building2, label: "Find Branches", href: "/find-branches" },
                { icon: LogOut, label: "Sign Out", href: "/login" }
            ]
        }
    ];
    return (_jsxs("div", { className: "relative", children: [_jsx("header", { className: "bg-white px-4 py-4 relative z-40", children: _jsxs("div", { className: "flex items-center justify-between mb-0", children: [_jsx(Link, { href: "/", children: _jsxs("div", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("img", { src: "/world-bank-logo.jpeg", alt: "World Bank Logo", className: "w-8 h-8 object-contain", onError: (e) => {
                                            const target = e.target;
                                            target.src = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/World_Bank_Group_logo.svg/1200px-World_Bank_Group_logo.svg.png";
                                        } }), _jsx("div", { className: "text-gray-900 font-bold text-sm tracking-wide", children: "WORLD BANK" })] }) }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowProfileMenu(!showProfileMenu), className: "flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors", children: _jsx(Avatar, { size: 40 }) }), showProfileMenu && (_jsxs("div", { className: "absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50", children: [_jsx("div", { className: "p-4 border-b border-gray-100", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Avatar, { size: 64 }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-semibold text-gray-900", children: freshUserData?.fullName || userProfile?.fullName || 'Banking Customer' }), _jsx("div", { className: "text-sm text-gray-600", children: freshUserData?.profession || userProfile?.profession || 'Account Holder' }), _jsx("div", { className: "text-sm text-gray-600", children: freshUserData?.email || userProfile?.email || '' }), _jsx("div", { className: "flex items-center space-x-2 mt-1", children: _jsxs(Badge, { variant: "default", className: "text-xs bg-green-100 text-green-800 flex items-center space-x-1", children: [_jsx(Check, { className: "w-3 h-3" }), _jsx("span", { children: "Verified Account" })] }) })] })] }) }), _jsx("div", { className: "max-h-64 overflow-y-auto", children: profileMenuItems.map((section, sectionIndex) => (_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide", children: section.category }), section.items.map((item, itemIndex) => (_jsx(Link, { href: item.href, children: _jsxs("div", { onClick: () => setShowProfileMenu(false), className: "w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer", children: [_jsx(item.icon, { className: "w-5 h-5 text-gray-500" }), _jsx("span", { className: "text-sm text-gray-700", children: item.label })] }) }, itemIndex)))] }, sectionIndex))) }), _jsxs("div", { className: "p-4 border-t border-gray-100 bg-gray-50", children: [_jsxs("div", { className: "text-xs text-gray-500", children: ["Account ID: ", freshUserData?.accountId || userProfile?.accountId || 'Loading...'] }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Last Login: ", freshUserData?.lastLogin ? new Date(freshUserData.lastLogin).toLocaleDateString() : userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : 'Loading...'] })] })] }))] })] }) }), _jsx(NavigationMenu, { isOpen: isMenuOpen, onClose: () => setIsMenuOpen(false) })] }));
}
