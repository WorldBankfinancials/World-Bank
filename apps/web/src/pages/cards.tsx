import { useState, useEffect } from 'react';
import { CreditCard, Plus, Eye, EyeOff, MoreVertical, Zap, Shield, Smartphone, Lock, Unlock, CreditCard as CreditCardIcon, Settings, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import QuickActions from '@/components/QuickActions';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card as CardType, ApiError } from '@/types';

export default function Cards() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [mobilePayDialogOpen, setMobilePayDialogOpen] = useState(false);
  const [payBillDialogOpen, setPayBillDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [pin, setPin] = useState('');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [billProvider, setBillProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [createCardDialogOpen, setCreateCardDialogOpen] = useState(false);
  const [newCardType, setNewCardType] = useState('debit');
  const [newCardholderName, setNewCardholderName] = useState('');
  const [creatingCard, setCreatingCard] = useState(false);

  const queryClient = useQueryClient();

  // Fetch cards with React Query
  const { data: creditCards = [], isLoading: cardsLoading, error: cardsError } = useQuery<CardType[]>({
    queryKey: ['/api/cards'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/cards');
      if (!response.ok) throw new Error('Failed to load cards');
      return response.json();
    }
  });

  // Fetch transaction history
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const response = await authenticatedFetch('/api/transactions?limit=5');
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    }
  });

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
    if (!selectedCard) return;
    
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile?.email || 'user@worldbank.com', pin })
      });

      if (!response.ok) {
        throw new Error('PIN verification failed');
      }

      if (response.ok) {
        // Update card lock status in database (PROTECTED - needs auth)
        try {
          await apiRequest('POST', '/api/cards/lock', {
            cardId: selectedCard.id,
            isLocked: !selectedCard.isLocked
          });
        } catch (apiError) {
          throw new Error(apiError instanceof Error ? apiError.message : 'Failed to update card lock status');
        }
        
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
      } else {
        toast({
          title: t('invalid_pin') || 'Invalid PIN',
          description: t('please_enter_correct_pin') || 'Please enter your correct 4-digit PIN',
          variant: 'destructive'
        });
      }
    } catch (error) {
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
        body: JSON.stringify({ email: userProfile?.email || 'user@worldbank.com', pin })
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
      } else {
        toast({
          title: t('invalid_pin') || 'Invalid PIN',
          description: t('please_enter_correct_pin') || 'Please enter your correct 4-digit PIN',
          variant: 'destructive'
        });
      }
    } catch (error) {
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
      } else {
        toast({
          title: t('invalid_pin') || 'Invalid PIN',
          description: t('please_enter_correct_pin') || 'Please enter your correct 4-digit PIN',
          variant: 'destructive'
        });
      }
    } catch (error) {
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
    } catch (error) {
      toast({
        title: t('error') || 'Error',
        description: t('operation_failed') || 'Failed to update settings',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as any || { id: 0, email: '', firstName: '', lastName: '', username: '', password: '', role: 'customer', isVerified: false, isActive: true, fullName: '', profession: '', accountId: 0, accountNumber: '', idType: null, idNumber: null, transferPin: null, annualIncome: null, address: null, city: null, state: null, postalCode: null, country: null, dateOfBirth: null, mothersMaidenName: null, citizenship: null, taxId: null, industry: null, phone: null, createdAt: new Date(), updatedAt: null }} />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('my_cards') || 'My Cards'}</h1>
            <p className="text-gray-600">{t('manage_cards') || 'Manage your credit and debit cards'}</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setCreateCardDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('add_card') || 'Add Card'}
          </Button>
        </div>

        {/* Credit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {cardsLoading && <div className="text-center py-8">Loading cards...</div>}
          {creditCards && creditCards.map((card: typeof creditCards[0]) => (
            <Card key={card.id} className="overflow-hidden">
              <div className={`${(card as any).color || 'bg-gradient-to-br from-blue-600 to-blue-800'} text-white p-6 relative`}>
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
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-80">Available Credit</p>
                    <p className="text-xl font-bold">
                      {showBalance ? `$${(((card as any).limit || 0) - ((card as any).balance || 0)).toLocaleString()}` : '••••••'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-80">Expires</p>
                    <p className="text-sm">{(card as any).expiry || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Card Chip */}
                <div className="absolute top-16 left-6 w-8 h-6 bg-yellow-400 rounded opacity-80"></div>
              </div>
              
              <CardContent className="p-5 space-y-4">
                {/* Balance Info */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Current Balance</p>
                    <p className="text-lg font-bold text-gray-900">{showBalance ? `$${(((card as any).balance || 0).toLocaleString())}` : '••••••'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Credit Limit</p>
                    <p className="text-lg font-bold text-gray-900">${(((card as any).limit || 0).toLocaleString())}</p>
                  </div>
                </div>
                
                {/* Action Buttons - All full width, stacked */}
                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      setSelectedCard(card);
                      setLockDialogOpen(true);
                    }}
                    className={`w-full font-semibold ${card.isLocked ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  >
                    {card.isLocked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    {card.isLocked ? (t('unlock_card') || 'Unlock') : (t('lock_card') || 'Lock')}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => setMobilePayDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      size="sm"
                    >
                      <Smartphone className="w-4 h-4 mr-1" />
                      Mobile Pay
                    </Button>
                    <Button 
                      onClick={() => setPayBillDialogOpen(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                      size="sm"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Pay Bill
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      setSelectedCard(card);
                      setSettingsDialogOpen(true);
                    }}
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-100 font-semibold"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Card Settings
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
              <h3 className="font-semibold mb-2">{t('instant_payments') || 'Instant Payments'}</h3>
              <p className="text-sm text-gray-600">{t('instant_payments_desc') || 'Make instant payments worldwide'}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{t('secure_transactions') || 'Secure Transactions'}</h3>
              <p className="text-sm text-gray-600">{t('secure_transactions_desc') || 'Bank-grade security for all transactions'}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Smartphone className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{t('mobile_wallet') || 'Mobile Wallet'}</h3>
              <p className="text-sm text-gray-600">{t('mobile_wallet_desc') || 'Use your phone for contactless payments'}</p>
            </CardContent>
          </Card>
        </div>

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
          </Button>
        </div>

        {/* Transaction History */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction: any, idx: number) => (
                  <div key={`txn-${transaction.id || idx}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${transaction.type === 'debit' ? 'bg-red-100' : 'bg-green-100'}`}>
                        {transaction.type === 'debit' ? (
                          <ArrowUpRight className={`w-5 h-5 ${transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'}`} />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description || 'Transaction'}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.date || transaction.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'debit' ? '-' : '+'}${Math.abs(transaction.amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.status || 'Completed'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent transactions available</p>
              </div>
            )}
          </CardContent>
        </Card>

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
            <DialogDescription>Enter your PIN to lock or unlock your card</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {selectedCard?.isLocked 
                ? (t('unlock_card_desc') || 'Enter your PIN to unlock this card for transactions')
                : (t('lock_card_desc') || 'Enter your PIN to lock this card for security')
              }
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
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Pay Dialog */}
      <Dialog open={mobilePayDialogOpen} onOpenChange={setMobilePayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('mobile_pay') || 'Mobile Pay'}</DialogTitle>
            <DialogDescription>Send mobile payment by entering phone number and amount</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">{t('phone_number') || 'Phone Number'}</Label>
              <Input
                id="phone"
                placeholder="+1 234 567 8900"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="amount">{t('amount') || 'Amount'}</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
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
              <Button variant="outline" onClick={() => setMobilePayDialogOpen(false)} className="flex-1">
                {t('cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleMobilePay} className="flex-1">
                {t('send_payment') || 'Send Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Bill Dialog */}
      <Dialog open={payBillDialogOpen} onOpenChange={setPayBillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pay_bill') || 'Pay Bill'}</DialogTitle>
            <DialogDescription>Pay bill by entering provider, account number, and amount</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">{t('bill_provider') || 'Bill Provider'}</Label>
              <Input
                id="provider"
                placeholder="Electric Company, Gas, Internet..."
                value={billProvider}
                onChange={(e) => setBillProvider(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="account">{t('account_number') || 'Account Number'}</Label>
              <Input
                id="account"
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="amount">{t('amount') || 'Amount'}</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
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
              <Button variant="outline" onClick={() => setPayBillDialogOpen(false)} className="flex-1">
                {t('cancel') || 'Cancel'}
              </Button>
              <Button onClick={handlePayBill} className="flex-1">
                {t('pay_now') || 'Pay Now'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('card_settings') || 'Card Settings'}</DialogTitle>
            <DialogDescription>Update daily spending limit and card preferences</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">{selectedCard?.name}</h4>
              <p className="text-sm text-gray-600">{selectedCard?.number}</p>
            </div>
            <div>
              <Label htmlFor="dailyLimit">{t('daily_spending_limit') || 'Daily Spending Limit'}</Label>
              <Input
                id="dailyLimit"
                type="number"
                placeholder={selectedCard?.dailyLimit?.toString()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('contactless_payments') || 'Contactless Payments'}</span>
                <Badge variant={selectedCard?.contactlessEnabled ? "default" : "secondary"}>
                  {selectedCard?.contactlessEnabled ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('card_status') || 'Card Status'}</span>
                <Badge variant={selectedCard?.isLocked ? "destructive" : "default"}>
                  {selectedCard?.isLocked ? (t('locked') || 'Locked') : (t('active') || 'Active')}
                </Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setSettingsDialogOpen(false)} className="flex-1">
                {t('cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleUpdateSettings} className="flex-1">
                {t('save_changes') || 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Card Dialog */}
      <Dialog open={createCardDialogOpen} onOpenChange={setCreateCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Card</DialogTitle>
            <DialogDescription>Choose a card type and enter the cardholder name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">Card Type</Label>
              <select
                value={newCardType}
                onChange={(e) => setNewCardType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white"
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
                <option value="prepaid">Prepaid</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Cardholder Name</Label>
              <Input
                value={newCardholderName}
                onChange={(e) => setNewCardholderName(e.target.value)}
                placeholder="Enter cardholder name"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setCreateCardDialogOpen(false)} className="flex-1">
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              className="flex-1"
              disabled={creatingCard || !newCardholderName}
              onClick={async () => {
                setCreatingCard(true);
                try {
                  const { authenticatedFetch } = await import('@/lib/queryClient');
                  const res = await authenticatedFetch('/api/cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cardType: newCardType, cardholderName: newCardholderName })
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'Failed to create card');
                  }
                  toast({ title: 'Success', description: 'Card created successfully' });
                  queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
                  setCreateCardDialogOpen(false);
                  setNewCardholderName('');
                  setNewCardType('debit');
                } catch (err) {
                  toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create card', variant: 'destructive' });
                } finally {
                  setCreatingCard(false);
                }
              }}
            >
              {creatingCard ? 'Creating...' : 'Create Card'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}