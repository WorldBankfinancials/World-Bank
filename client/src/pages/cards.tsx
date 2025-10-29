import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/queryClient';
import { CreditCard, Plus, Eye, EyeOff, MoreVertical, Zap, Shield, Smartphone, Lock, Unlock, CreditCard as CreditCardIcon, Settings, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest ,authenticatedFetch} from '@/lib/queryClient';

export default function Cards() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const [showBalance, setShowBalance] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [mobilePayDialogOpen, setMobilePayDialogOpen] = useState(false);
  const [payBillDialogOpen, setPayBillDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [billProvider, setBillProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const queryClient = useQueryClient();
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsError, setCardsError] = useState<any>(null);
  useEffect(() => {
    async function fetchCards() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
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
          if (error) throw error;
          
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
      } catch (error) {
        console.error('Error fetching cards:', error);
        setCardsError(error);
      } finally {
        setCardsLoading(false);
      }
    }
    fetchCards();
  }, []);
  // Real-time subscription for card updates (row-level filtered)
    if (!userProfile) return;
    async function setupRealtimeWithFilter() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: bankUser } = await supabase
        .from('bank_users')
        .select('id')
        .eq('supabase_user_id', authUser.id)
        .single();
      if (!bankUser) return;
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
            if (!authUser) return;
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
          } catch (error) {
            console.error('Error refetching cards:', error);
          }
          refetchCards();
        })
        .subscribe();
      return () => {
        channel.unsubscribe();
      };
    const cleanup = setupRealtimeWithFilter();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [userProfile]);
  // Show error message if cards fail to load
    if (cardsError) {
      toast({
        title: t('error') || 'Error',
        description: 'Failed to load cards. Please refresh the page.',
        variant: 'destructive'
      });
  }, [cardsError]);
  
  const handleLockCard = async () => {
    if (!selectedCard) return;
    
    try {
      const response = await authenticatedFetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userProfile?.email || 'user@worldbank.com', pin })
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
        setLockDialogOpen(false);
        setPin('');
      } else {
          title: t('invalid_pin') || 'Invalid PIN',
          description: t('please_enter_correct_pin') || 'Please enter your correct 4-digit PIN',
          variant: 'destructive'
    } catch (error) {
        description: t('operation_failed') || 'Operation failed. Please try again.',
  };
  const handleMobilePay = async () => {
          title: t('mobile_payment_sent') || 'Mobile Payment Sent',
          description: `${t('sent') || 'Sent'} $${amount} ${t('to') || 'to'} ${phoneNumber}`,
        setMobilePayDialogOpen(false);
        setAmount('');
        setPhoneNumber('');
        description: t('payment_failed') || 'Payment failed. Please try again.',
  const handlePayBill = async () => {
          title: t('bill_payment_successful') || 'Bill Payment Successful',
          description: `${t('paid') || 'Paid'} $${amount} ${t('to') || 'to'} ${billProvider}`,
        setPayBillDialogOpen(false);
        setBillProvider('');
        setAccountNumber('');
  const handleUpdateSettings = async () => {
      await apiRequest('POST', '/api/cards/settings', {
        cardId: selectedCard?.id,
        dailyLimit: parseInt(amount) || selectedCard?.dailyLimit,
        contactlessEnabled: selectedCard?.contactlessEnabled
      
      // Refresh cards data
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
        title: t('settings_updated') || 'Settings Updated',
        description: t('card_settings_updated') || 'Your card settings have been updated successfully',
      setSettingsDialogOpen(false);
      setAmount('');
        description: t('operation_failed') || 'Failed to update settings',
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile} />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('my_cards') || 'My Cards'}</h1>
            <p className="text-gray-600">{t('manage_cards') || 'Manage your credit and debit cards'}</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('add_card') || 'Add Card'}
          </Button>
        </div>
        {/* Credit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {cardsLoading && <div className="text-center py-8">Loading cards...</div>}
          {creditCards && creditCards.map((card: any) => (
            <Card key={card.id} className="overflow-hidden">
              <div className={`${card.color} text-white p-6 relative`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm opacity-80">{card.name}</p>
                    <p className="text-lg font-mono">{card.number}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {card.type}
                    </Badge>
                    <button 
                      onClick={() => {
                        setSelectedCard(card);
                        setSettingsDialogOpen(true);
                      }}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex justify-between items-end">
                    <p className="text-xs opacity-80">Available Credit</p>
                    <p className="text-xl font-bold">
                      {showBalance ? `$${(card.limit - card.balance).toLocaleString()}` : '••••••'}
                    </p>
                  <div className="text-right">
                    <p className="text-xs opacity-80">Expires</p>
                    <p className="text-sm">{card.expiry}</p>
                {/* Card Chip */}
                <div className="absolute top-16 left-6 w-8 h-6 bg-yellow-400 rounded opacity-80"></div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Current Balance</span>
                  <span className="font-semibold">
                    {showBalance ? `$${card.balance.toLocaleString()}` : '••••••'}
                  </span>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">Credit Limit</span>
                  <span className="font-semibold">${card.limit.toLocaleString()}</span>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedCard(card);
                      setLockDialogOpen(true);
                    }}
                    className={card.isLocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}
                  >
                    {card.isLocked ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                    {card.isLocked ? (t('unlock_card') || 'Unlock') : (t('lock_card') || 'Lock')}
                  </Button>
                    size="sm"
                    onClick={() => setMobilePayDialogOpen(true)}
                    className="bg-blue-50 border-blue-200"
                    <Smartphone className="w-4 h-4 mr-1" />
                    {t('mobile_pay') || 'Mobile Pay'}
                    onClick={() => setPayBillDialogOpen(true)}
                    className="bg-yellow-50 border-yellow-200"
                    <DollarSign className="w-4 h-4 mr-1" />
                    {t('pay_bill') || 'Pay Bill'}
                      setSettingsDialogOpen(true);
                    className="bg-gray-50 border-gray-200"
                    <Settings className="w-4 h-4 mr-1" />
                    {t('settings') || 'Settings'}
              </CardContent>
            </Card>
          ))}
        {/* Card Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{t('instant_payments') || 'Instant Payments'}</h3>
              <p className="text-sm text-gray-600">{t('instant_payments_desc') || 'Make instant payments worldwide'}</p>
            </CardContent>
          </Card>
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{t('secure_transactions') || 'Secure Transactions'}</h3>
              <p className="text-sm text-gray-600">{t('secure_transactions_desc') || 'Bank-grade security for all transactions'}</p>
              <Smartphone className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{t('mobile_wallet') || 'Mobile Wallet'}</h3>
              <p className="text-sm text-gray-600">{t('mobile_wallet_desc') || 'Use your phone for contactless payments'}</p>
        {/* Balance Toggle */}
        <div className="flex justify-center mb-8">
          <Button
            variant="outline"
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center space-x-2"
          >
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>
              {showBalance ? (t('hide_balances') || 'Hide Balances') : (t('show_balances') || 'Show Balances')}
            </span>
        {/* Quick Actions */}
        <QuickActions />
      </div>
      {/* Lock/Unlock Card Dialog */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCard?.isLocked ? (t('unlock_card') || 'Unlock Card') : (t('lock_card') || 'Lock Card')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {selectedCard?.isLocked 
                ? (t('unlock_card_desc') || 'Enter your PIN to unlock this card for transactions')
                : (t('lock_card_desc') || 'Enter your PIN to lock this card for security')
            </p>
            <div>
              <Label htmlFor="pin">{t('transfer_pin') || 'Transfer PIN'}</Label>
              <Input
                id="pin"
                type="password"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setLockDialogOpen(false)} className="flex-1">
                {t('cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleLockCard} className="flex-1">
                {selectedCard?.isLocked ? (t('unlock') || 'Unlock') : (t('lock') || 'Lock')}
        </DialogContent>
      </Dialog>
      {/* Mobile Pay Dialog */}
      <Dialog open={mobilePayDialogOpen} onOpenChange={setMobilePayDialogOpen}>
            <DialogTitle>{t('mobile_pay') || 'Mobile Pay'}</DialogTitle>
              <Label htmlFor="phone">{t('phone_number') || 'Phone Number'}</Label>
                id="phone"
                placeholder="+1 234 567 8900"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              <Label htmlFor="amount">{t('amount') || 'Amount'}</Label>
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              <Button variant="outline" onClick={() => setMobilePayDialogOpen(false)} className="flex-1">
              <Button onClick={handleMobilePay} className="flex-1">
                {t('send_payment') || 'Send Payment'}
      {/* Pay Bill Dialog */}
      <Dialog open={payBillDialogOpen} onOpenChange={setPayBillDialogOpen}>
            <DialogTitle>{t('pay_bill') || 'Pay Bill'}</DialogTitle>
              <Label htmlFor="provider">{t('bill_provider') || 'Bill Provider'}</Label>
                id="provider"
                placeholder="Electric Company, Gas, Internet..."
                value={billProvider}
                onChange={(e) => setBillProvider(e.target.value)}
              <Label htmlFor="account">{t('account_number') || 'Account Number'}</Label>
                id="account"
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              <Button variant="outline" onClick={() => setPayBillDialogOpen(false)} className="flex-1">
              <Button onClick={handlePayBill} className="flex-1">
                {t('pay_now') || 'Pay Now'}
      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogTitle>{t('card_settings') || 'Card Settings'}</DialogTitle>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">{selectedCard?.name}</h4>
              <p className="text-sm text-gray-600">{selectedCard?.number}</p>
              <Label htmlFor="dailyLimit">{t('daily_spending_limit') || 'Daily Spending Limit'}</Label>
                id="dailyLimit"
                placeholder={selectedCard?.dailyLimit?.toString()}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('contactless_payments') || 'Contactless Payments'}</span>
                <Badge variant={selectedCard?.contactlessEnabled ? "default" : "secondary"}>
                  {selectedCard?.contactlessEnabled ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}
                </Badge>
                <span className="text-sm">{t('card_status') || 'Card Status'}</span>
                <Badge variant={selectedCard?.isLocked ? "destructive" : "default"}>
                  {selectedCard?.isLocked ? (t('locked') || 'Locked') : (t('active') || 'Active')}
              <Button variant="outline" onClick={() => setSettingsDialogOpen(false)} className="flex-1">
              <Button onClick={handleUpdateSettings} className="flex-1">
                {t('save_changes') || 'Save Changes'}
      <BottomNavigation />
    </div>
  );
}
