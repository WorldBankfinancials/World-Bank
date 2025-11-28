import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, MoreVertical, Zap, Shield, Smartphone, Lock, Unlock, Settings, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import QuickActions from '@/components/QuickActions';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';
export default function Cards() {
    const { userProfile } = useAuth();
    const { t } = useLanguage();
    const [showBalance, setShowBalance] = useState(false);
    const [lockDialogOpen, setLockDialogOpen] = useState(false);
    const [mobilePayDialogOpen, setMobilePayDialogOpen] = useState(false);
    const [payBillDialogOpen, setPayBillDialogOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [pin, setPin] = useState('');
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [billProvider, setBillProvider] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const queryClient = useQueryClient();
    const [creditCards, setCreditCards] = useState([]);
    const [cardsLoading, setCardsLoading] = useState(true);
    const [cardsError, setCardsError] = useState(null);
    useEffect(() => {
        async function fetchCards() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser)
                    return;
                const { data: bankUser } = await supabase
                    .from('bank_users')
                    .select('id')
                    .eq('supabase_user_id', authUser.id)
                    .single();
                if (bankUser) {
                    const { data: cards, error } = await supabase
                        .from('cards')
                        .select('*')
                        .eq('user_id', bankUser.id);
                    if (error)
                        throw error;
                    setCreditCards(cards?.map(card => ({
                        id: card.id,
                        name: card.card_name,
                        number: card.card_number,
                        type: card.card_type,
                        balance: parseFloat(card.balance || '0'),
                        limit: parseFloat(card.credit_limit || '0'),
                        expiry: card.expiry_date,
                        isLocked: card.is_locked,
                        color: card.card_type === 'Platinum' ? 'bg-gradient-to-br from-gray-800 to-gray-900' :
                            card.card_type === 'Business' ? 'bg-gradient-to-br from-blue-600 to-blue-800' :
                                'bg-gradient-to-br from-yellow-600 to-yellow-800',
                        dailyLimit: parseFloat(card.daily_limit || '5000'),
                        contactlessEnabled: card.contactless_enabled
                    })) || []);
                }
            }
            catch (error) {
                console.error('Error fetching cards:', error);
                setCardsError(error);
            }
            finally {
                setCardsLoading(false);
            }
        }
        fetchCards();
    }, []);
    // Real-time subscription for card updates (row-level filtered)
    useEffect(() => {
        if (!userProfile)
            return;
        async function setupRealtimeWithFilter() {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser)
                return;
            const { data: bankUser } = await supabase
                .from('bank_users')
                .select('id')
                .eq('supabase_user_id', authUser.id)
                .single();
            if (!bankUser)
                return;
            // Subscribe with row-level filter to only receive updates for this user's cards
            const channel = supabase
                .channel(`card-updates-${bankUser.id}`)
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'cards',
                filter: `user_id=eq.${bankUser.id}`
            }, () => {
                console.log('🔄 Card data changed, refreshing...');
                // Refetch cards when data changes
                async function refetchCards() {
                    try {
                        const { data: { user: authUser } } = await supabase.auth.getUser();
                        if (!authUser)
                            return;
                        const { data: bankUser } = await supabase
                            .from('bank_users')
                            .select('id')
                            .eq('supabase_user_id', authUser.id)
                            .single();
                        if (bankUser) {
                            const { data: cards, error } = await supabase
                                .from('cards')
                                .select('*')
                                .eq('user_id', bankUser.id);
                            if (!error) {
                                setCreditCards(cards?.map(card => ({
                                    id: card.id,
                                    name: card.card_name,
                                    number: card.card_number,
                                    type: card.card_type,
                                    balance: parseFloat(card.balance || '0'),
                                    limit: parseFloat(card.credit_limit || '0'),
                                    expiry: card.expiry_date,
                                    isLocked: card.is_locked,
                                    color: card.card_type === 'Platinum' ? 'bg-gradient-to-br from-gray-800 to-gray-900' :
                                        card.card_type === 'Business' ? 'bg-gradient-to-br from-blue-600 to-blue-800' :
                                            'bg-gradient-to-br from-yellow-600 to-yellow-800',
                                    dailyLimit: parseFloat(card.daily_limit || '5000'),
                                    contactlessEnabled: card.contactless_enabled
                                })) || []);
                            }
                        }
                    }
                    catch (error) {
                        console.error('Error refetching cards:', error);
                    }
                }
                refetchCards();
            })
                .subscribe();
            return () => {
                channel.unsubscribe();
            };
        }
        const cleanup = setupRealtimeWithFilter();
        return () => {
            cleanup.then(cleanupFn => cleanupFn?.());
        };
    }, [userProfile]);
    // Show error message if cards fail to load
    useEffect(() => {
        if (cardsError) {
            toast({
                title: t('error') || 'Error',
                description: 'Failed to load cards. Please refresh the page.',
                variant: 'destructive'
            });
        }
    }, [cardsError]);
    const handleLockCard = async () => {
        if (!selectedCard)
            return;
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userProfile?.email || 'user@worldbank.com', pin })
            });
            if (response.ok) {
                // Update card lock status in database (PROTECTED - needs auth)
                await apiRequest('POST', '/api/cards/lock', {
                    cardId: selectedCard.id,
                    isLocked: !selectedCard.isLocked
                });
                // Refresh cards data
                queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
                toast({
                    title: selectedCard.isLocked ? t('card_unlocked') || 'Card Unlocked' : t('card_locked') || 'Card Locked',
                    description: selectedCard.isLocked
                        ? t('card_unlocked_desc') || 'Your card has been unlocked successfully'
                        : t('card_locked_desc') || 'Your card has been locked for security',
                });
                setLockDialogOpen(false);
                setPin('');
            }
            else {
                toast({
                    title: t('invalid_pin') || 'Invalid PIN',
                    description: t('please_enter_correct_pin') || 'Please enter your correct 4-digit PIN',
                    variant: 'destructive'
                });
            }
        }
        catch (error) {
            toast({
                title: t('error') || 'Error',
                description: t('operation_failed') || 'Operation failed. Please try again.',
                variant: 'destructive'
            });
        }
    };
    const handleMobilePay = async () => {
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userProfile?.email || 'user@worldbank.com', pin })
            });
            if (response.ok) {
                toast({
                    title: t('mobile_payment_sent') || 'Mobile Payment Sent',
                    description: `${t('sent') || 'Sent'} $${amount} ${t('to') || 'to'} ${phoneNumber}`,
                });
                setMobilePayDialogOpen(false);
                setPin('');
                setAmount('');
                setPhoneNumber('');
            }
            else {
                toast({
                    title: t('invalid_pin') || 'Invalid PIN',
                    description: t('please_enter_correct_pin') || 'Please enter your correct 4-digit PIN',
                    variant: 'destructive'
                });
            }
        }
        catch (error) {
            toast({
                title: t('error') || 'Error',
                description: t('payment_failed') || 'Payment failed. Please try again.',
                variant: 'destructive'
            });
        }
    };
    const handlePayBill = async () => {
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userProfile?.email || 'user@worldbank.com', pin })
            });
            if (response.ok) {
                toast({
                    title: t('bill_payment_successful') || 'Bill Payment Successful',
                    description: `${t('paid') || 'Paid'} $${amount} ${t('to') || 'to'} ${billProvider}`,
                });
                setPayBillDialogOpen(false);
                setPin('');
                setAmount('');
                setBillProvider('');
                setAccountNumber('');
            }
            else {
                toast({
                    title: t('invalid_pin') || 'Invalid PIN',
                    description: t('please_enter_correct_pin') || 'Please enter your correct 4-digit PIN',
                    variant: 'destructive'
                });
            }
        }
        catch (error) {
            toast({
                title: t('error') || 'Error',
                description: t('payment_failed') || 'Payment failed. Please try again.',
                variant: 'destructive'
            });
        }
    };
    const handleUpdateSettings = async () => {
        try {
            await apiRequest('POST', '/api/cards/settings', {
                cardId: selectedCard?.id,
                dailyLimit: parseInt(amount) || selectedCard?.dailyLimit,
                contactlessEnabled: selectedCard?.contactlessEnabled
            });
            // Refresh cards data
            queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
            toast({
                title: t('settings_updated') || 'Settings Updated',
                description: t('card_settings_updated') || 'Your card settings have been updated successfully',
            });
            setSettingsDialogOpen(false);
            setAmount('');
        }
        catch (error) {
            toast({
                title: t('error') || 'Error',
                description: t('operation_failed') || 'Failed to update settings',
                variant: 'destructive'
            });
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: userProfile }), _jsxs("div", { className: "container mx-auto px-4 py-6 max-w-4xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: t('my_cards') || 'My Cards' }), _jsx("p", { className: "text-gray-600", children: t('manage_cards') || 'Manage your credit and debit cards' })] }), _jsxs(Button, { className: "bg-blue-600 hover:bg-blue-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), t('add_card') || 'Add Card'] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: [cardsLoading && _jsx("div", { className: "text-center py-8", children: "Loading cards..." }), creditCards && creditCards.map((card) => (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs("div", { className: `${card.color} text-white p-6 relative`, children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm opacity-80", children: card.name }), _jsx("p", { className: "text-lg font-mono", children: card.number })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Badge, { variant: "secondary", className: "bg-white/20 text-white", children: card.type }), _jsx("button", { onClick: () => {
                                                                    setSelectedCard(card);
                                                                    setSettingsDialogOpen(true);
                                                                }, className: "p-1 rounded hover:bg-white/20 transition-colors", children: _jsx(MoreVertical, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "flex justify-between items-end", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs opacity-80", children: "Available Credit" }), _jsx("p", { className: "text-xl font-bold", children: showBalance ? `$${(card.limit - card.balance).toLocaleString()}` : '••••••' })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xs opacity-80", children: "Expires" }), _jsx("p", { className: "text-sm", children: card.expiry })] })] }), _jsx("div", { className: "absolute top-16 left-6 w-8 h-6 bg-yellow-400 rounded opacity-80" })] }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Current Balance" }), _jsx("span", { className: "font-semibold", children: showBalance ? `$${card.balance.toLocaleString()}` : '••••••' })] }), _jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Credit Limit" }), _jsxs("span", { className: "font-semibold", children: ["$", card.limit.toLocaleString()] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mb-3", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                            setSelectedCard(card);
                                                            setLockDialogOpen(true);
                                                        }, className: card.isLocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200', children: [card.isLocked ? _jsx(Unlock, { className: "w-4 h-4 mr-1" }) : _jsx(Lock, { className: "w-4 h-4 mr-1" }), card.isLocked ? (t('unlock_card') || 'Unlock') : (t('lock_card') || 'Lock')] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setMobilePayDialogOpen(true), className: "bg-blue-50 border-blue-200", children: [_jsx(Smartphone, { className: "w-4 h-4 mr-1" }), t('mobile_pay') || 'Mobile Pay'] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setPayBillDialogOpen(true), className: "bg-yellow-50 border-yellow-200", children: [_jsx(DollarSign, { className: "w-4 h-4 mr-1" }), t('pay_bill') || 'Pay Bill'] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                            setSelectedCard(card);
                                                            setSettingsDialogOpen(true);
                                                        }, className: "bg-gray-50 border-gray-200", children: [_jsx(Settings, { className: "w-4 h-4 mr-1" }), t('settings') || 'Settings'] })] })] })] }, card.id)))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx(Zap, { className: "w-8 h-8 text-yellow-500 mx-auto mb-3" }), _jsx("h3", { className: "font-semibold mb-2", children: t('instant_payments') || 'Instant Payments' }), _jsx("p", { className: "text-sm text-gray-600", children: t('instant_payments_desc') || 'Make instant payments worldwide' })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx(Shield, { className: "w-8 h-8 text-green-500 mx-auto mb-3" }), _jsx("h3", { className: "font-semibold mb-2", children: t('secure_transactions') || 'Secure Transactions' }), _jsx("p", { className: "text-sm text-gray-600", children: t('secure_transactions_desc') || 'Bank-grade security for all transactions' })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx(Smartphone, { className: "w-8 h-8 text-blue-500 mx-auto mb-3" }), _jsx("h3", { className: "font-semibold mb-2", children: t('mobile_wallet') || 'Mobile Wallet' }), _jsx("p", { className: "text-sm text-gray-600", children: t('mobile_wallet_desc') || 'Use your phone for contactless payments' })] }) })] }), _jsx("div", { className: "flex justify-center mb-8", children: _jsxs(Button, { variant: "outline", onClick: () => setShowBalance(!showBalance), className: "flex items-center space-x-2", children: [showBalance ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }), _jsx("span", { children: showBalance ? (t('hide_balances') || 'Hide Balances') : (t('show_balances') || 'Show Balances') })] }) }), _jsx(QuickActions, {})] }), _jsx(Dialog, { open: lockDialogOpen, onOpenChange: setLockDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: selectedCard?.isLocked ? (t('unlock_card') || 'Unlock Card') : (t('lock_card') || 'Lock Card') }) }), _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: selectedCard?.isLocked
                                        ? (t('unlock_card_desc') || 'Enter your PIN to unlock this card for transactions')
                                        : (t('lock_card_desc') || 'Enter your PIN to lock this card for security') }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "pin", children: t('transfer_pin') || 'Transfer PIN' }), _jsx(Input, { id: "pin", type: "password", placeholder: "\u2022\u2022\u2022\u2022", value: pin, onChange: (e) => setPin(e.target.value), maxLength: 4 })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => setLockDialogOpen(false), className: "flex-1", children: t('cancel') || 'Cancel' }), _jsx(Button, { onClick: handleLockCard, className: "flex-1", children: selectedCard?.isLocked ? (t('unlock') || 'Unlock') : (t('lock') || 'Lock') })] })] })] }) }), _jsx(Dialog, { open: mobilePayDialogOpen, onOpenChange: setMobilePayDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: t('mobile_pay') || 'Mobile Pay' }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: t('phone_number') || 'Phone Number' }), _jsx(Input, { id: "phone", placeholder: "+1 234 567 8900", value: phoneNumber, onChange: (e) => setPhoneNumber(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "amount", children: t('amount') || 'Amount' }), _jsx(Input, { id: "amount", type: "number", placeholder: "0.00", value: amount, onChange: (e) => setAmount(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "pin", children: t('transfer_pin') || 'Transfer PIN' }), _jsx(Input, { id: "pin", type: "password", placeholder: "\u2022\u2022\u2022\u2022", value: pin, onChange: (e) => setPin(e.target.value), maxLength: 4 })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => setMobilePayDialogOpen(false), className: "flex-1", children: t('cancel') || 'Cancel' }), _jsx(Button, { onClick: handleMobilePay, className: "flex-1", children: t('send_payment') || 'Send Payment' })] })] })] }) }), _jsx(Dialog, { open: payBillDialogOpen, onOpenChange: setPayBillDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: t('pay_bill') || 'Pay Bill' }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "provider", children: t('bill_provider') || 'Bill Provider' }), _jsx(Input, { id: "provider", placeholder: "Electric Company, Gas, Internet...", value: billProvider, onChange: (e) => setBillProvider(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "account", children: t('account_number') || 'Account Number' }), _jsx(Input, { id: "account", placeholder: "Account Number", value: accountNumber, onChange: (e) => setAccountNumber(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "amount", children: t('amount') || 'Amount' }), _jsx(Input, { id: "amount", type: "number", placeholder: "0.00", value: amount, onChange: (e) => setAmount(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "pin", children: t('transfer_pin') || 'Transfer PIN' }), _jsx(Input, { id: "pin", type: "password", placeholder: "\u2022\u2022\u2022\u2022", value: pin, onChange: (e) => setPin(e.target.value), maxLength: 4 })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => setPayBillDialogOpen(false), className: "flex-1", children: t('cancel') || 'Cancel' }), _jsx(Button, { onClick: handlePayBill, className: "flex-1", children: t('pay_now') || 'Pay Now' })] })] })] }) }), _jsx(Dialog, { open: settingsDialogOpen, onOpenChange: setSettingsDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: t('card_settings') || 'Card Settings' }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("h4", { className: "font-semibold mb-2", children: selectedCard?.name }), _jsx("p", { className: "text-sm text-gray-600", children: selectedCard?.number })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "dailyLimit", children: t('daily_spending_limit') || 'Daily Spending Limit' }), _jsx(Input, { id: "dailyLimit", type: "number", placeholder: selectedCard?.dailyLimit?.toString(), value: amount, onChange: (e) => setAmount(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: t('contactless_payments') || 'Contactless Payments' }), _jsx(Badge, { variant: selectedCard?.contactlessEnabled ? "default" : "secondary", children: selectedCard?.contactlessEnabled ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled') })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: t('card_status') || 'Card Status' }), _jsx(Badge, { variant: selectedCard?.isLocked ? "destructive" : "default", children: selectedCard?.isLocked ? (t('locked') || 'Locked') : (t('active') || 'Active') })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => setSettingsDialogOpen(false), className: "flex-1", children: t('cancel') || 'Cancel' }), _jsx(Button, { onClick: handleUpdateSettings, className: "flex-1", children: t('save_changes') || 'Save Changes' })] })] })] }) }), _jsx(BottomNavigation, {})] }));
}
