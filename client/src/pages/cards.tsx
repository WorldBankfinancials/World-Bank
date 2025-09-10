import { useState } from 'react';
import { CreditCard, Plus, Eye, EyeOff, MoreVertical, Zap, Shield, Smartphone, Lock, Unlock, Settings, DollarSign } from 'lucide-react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

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

  // Fetch user's cards
  const { data: creditCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['cards', userProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userProfile?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.id,
  });

  // Verify PIN from Supabase users table
  const verifyPin = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('pin')
      .eq('id', userProfile?.id)
      .single();
    if (error || !data) return false;
    return pin === data.pin;
  };

  // Lock or unlock a card
  const handleLockCard = async () => {
    if (!selectedCard) return;
    const valid = await verifyPin();
    if (!valid) return toast({ title: t('invalid_pin'), variant: 'destructive' });

    const { error } = await supabase
      .from('cards')
      .update({ isLocked: !selectedCard.isLocked })
      .eq('id', selectedCard.id);

    if (error) return toast({ title: t('operation_failed'), variant: 'destructive' });

    queryClient.invalidateQueries(['cards', userProfile?.id]);
    toast({
      title: selectedCard.isLocked ? t('card_unlocked') : t('card_locked'),
      description: selectedCard.isLocked ? t('card_unlocked_desc') : t('card_locked_desc'),
    });
    setLockDialogOpen(false);
    setPin('');
  };

  // Mobile payment
  const handleMobilePay = async () => {
    if (!selectedCard) return toast({ title: t('select_card_first'), variant: 'destructive' });
    const valid = await verifyPin();
    if (!valid) return toast({ title: t('invalid_pin'), variant: 'destructive' });

    const { error } = await supabase.from('mobile_payments').insert([{
      user_id: userProfile?.id,
      card_id: selectedCard.id,
      amount: parseFloat(amount),
      phone_number: phoneNumber,
    }]);

    if (error) return toast({ title: t('payment_failed'), variant: 'destructive' });

    toast({
      title: t('mobile_payment_sent'),
      description: `${t('sent')} $${amount} ${t('to')} ${phoneNumber}`,
    });
    setMobilePayDialogOpen(false);
    setPin('');
    setAmount('');
    setPhoneNumber('');
  };

  // Pay a bill
  const handlePayBill = async () => {
    if (!selectedCard) return toast({ title: t('select_card_first'), variant: 'destructive' });
    const valid = await verifyPin();
    if (!valid) return toast({ title: t('invalid_pin'), variant: 'destructive' });

    const { error } = await supabase.from('bill_payments').insert([{
      user_id: userProfile?.id,
      card_id: selectedCard.id,
      amount: parseFloat(amount),
      provider: billProvider,
      account_number: accountNumber,
    }]);

    if (error) return toast({ title: t('payment_failed'), variant: 'destructive' });

    toast({
      title: t('bill_payment_successful'),
      description: `${t('paid')} $${amount} ${t('to')} ${billProvider}`,
    });
    setPayBillDialogOpen(false);
    setPin('');
    setAmount('');
    setBillProvider('');
    setAccountNumber('');
  };

  // Update card settings
  const handleUpdateSettings = async () => {
    if (!selectedCard) return;
    const { error } = await supabase
      .from('cards')
      .update({ dailyLimit: parseFloat(amount) || selectedCard.dailyLimit })
      .eq('id', selectedCard.id);

    if (error) return toast({ title: t('operation_failed'), variant: 'destructive' });

    queryClient.invalidateQueries(['cards', userProfile?.id]);
    toast({ title: t('settings_updated'), description: t('card_settings_updated') });
    setSettingsDialogOpen(false);
    setAmount('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('my_cards')}</h1>
            <p className="text-gray-600">{t('manage_cards')}</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> {t('add_card')}
          </Button>
        </div>

        {/* Credit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {cardsLoading && <div className="text-center py-8">Loading cards...</div>}
          {creditCards?.map((card) => (
            <Card key={card.id} className="overflow-hidden">
              <div className={`${card.color} text-white p-6 relative`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm opacity-80">{card.name}</p>
                    <p className="text-lg font-mono">{card.number}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-white/20 text-white">{card.type}</Badge>
                    <button
                      onClick={() => { setSelectedCard(card); setSettingsDialogOpen(true); }}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-80">Available Credit</p>
                    <p className="text-xl font-bold">{showBalance ? `$${(card.limit - card.balance).toLocaleString()}` : '••••••'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-80">Expires</p>
                    <p className="text-sm">{card.expiry}</p>
                  </div>
                </div>
                <div className="absolute top-16 left-6 w-8 h-6 bg-yellow-400 rounded opacity-80"></div>
              </div>

              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Current Balance</span>
                  <span className="font-semibold">{showBalance ? `$${card.balance.toLocaleString()}` : '••••••'}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">Credit Limit</span>
                  <span className="font-semibold">${card.limit.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedCard(card); setLockDialogOpen(true); }}
                    className={card.isLocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}
                  >
                    {card.isLocked ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                    {card.isLocked ? t('unlock_card') : t('lock_card')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedCard(card); setMobilePayDialogOpen(true); }}
                    className="bg-blue-50 border-blue-200"
                  >
                    <Smartphone className="w-4 h-4 mr-1" /> {t('mobile_pay')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedCard(card); setPayBillDialogOpen(true); }}
                    className="bg-yellow-50 border-yellow-200"
                  >
                    <DollarSign className="w-4 h-4 mr-1" /> {t('pay_bill')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedCard(card); setSettingsDialogOpen(true); }}
                    className="bg-gray-50 border-gray-200"
                  >
                    <Settings className="w-4 h-4 mr-1" /> {t('settings')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Card Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{t('instant_payments')}</h3>
              <p className="text-sm text-gray-600">{t('instant_payments_desc')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{t('secure_transactions')}</h3>
              <p className="text-sm text-gray-600">{t('secure_transactions_desc')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Smartphone className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{t('mobile_wallet')}</h3>
              <p className="text-sm text-gray-600">{t('mobile_wallet_desc')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Balance Toggle */}
        <div className="flex justify-center mb-8">
          <Button variant="outline" onClick={() => setShowBalance(!showBalance)} className="flex items-center space-x-2">
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showBalance ? t('hide_balances') : t('show_balances')}</span>
          </Button>
        </div>

        <QuickActions />
      </div>

      <BottomNavigation />
    </div>
  );
}
