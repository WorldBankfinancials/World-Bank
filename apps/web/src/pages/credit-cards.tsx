import type { User } from "@packages/shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Eye, EyeOff, Settings, MoreHorizontal, ArrowLeft, Lock, Smartphone, DollarSign, Wallet, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";


export default function CreditCards() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  
  // CRITICAL FIX: Move ALL hooks before ANY conditional returns
  // Prevents "Rendered more hooks than during the previous render" error
  const { data: user, isLoading, error: userError } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const { data: creditCards, isLoading: cardsLoading, error: cardsError } = useQuery({
    queryKey: ['/api/cards'],
    staleTime: 30000
  });

  const { data: recentTransactions, error: transactionsError } = useQuery({
    queryKey: ['/api/card-transactions'],
    staleTime: 30000
  });

  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [selectedCard, setSelectedCard] = useState(0);
  const [showTransactions, setShowTransactions] = useState(true);

  const { toast } = useToast();

  const queryError = userError || cardsError || transactionsError;
  useEffect(() => {
    if (queryError) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
  }, [queryError]);

  // NOW safe to return early - all hooks are called
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  const quickActions = [
    { icon: Lock, label: t('lock_card'), action: () => setLocation('/card-management') },
    { icon: Settings, label: t('card_settings'), action: () => setLocation('/card-management') },
    { icon: Smartphone, label: t('mobile_payment'), action: () => setLocation('/card-management') },
    { icon: Plus, label: t('request_new_card'), action: () => setLocation('/card-management') },
  ];

  const cards = (creditCards as Array<Record<string, unknown>>) || [];
  const transactions = (recentTransactions as Array<Record<string, unknown>>) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header user={user as unknown as User || undefined} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('credit_cards')}</h1>
          <Button variant="outline" size="sm" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>
        </div>

        {/* Credit Cards Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {cards.length > 0 ? (
            cards.map((card, index) => (
              <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-sm opacity-80">{t('card_holder')}</p>
                      <p className="font-semibold">{String(card.cardHolder || user?.firstName + ' ' + user?.lastName || 'Card Holder')}</p>
                    </div>
                    <CreditCard className="w-8 h-8" />
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-lg font-mono tracking-wider">
                      {showCardNumbers ? String(card.cardNumber || '**** **** **** ****') : '**** **** **** ****'}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs opacity-80">{t('expires')}</p>
                      <p className="text-sm font-medium">{String(card.expiryDate || 'MM/YY')}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-80">{t('cvv')}</p>
                      <p className="text-sm font-medium">{showCardNumbers ? String(card.cvv || '***') : '***'}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-80">{t('balance')}</p>
                      <p className="text-sm font-medium">${String(card.balance || '0.00')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">{t('no_cards_yet')}</p>
                <Button onClick={() => setLocation('/card-management')}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('request_new_card')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
              <CardContent className="p-4 text-center">
                <action.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">{action.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Show/Hide Card Numbers Toggle */}
        <div className="flex items-center justify-center mb-6">
          <Button variant="outline" onClick={() => setShowCardNumbers(!showCardNumbers)}>
            {showCardNumbers ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                {t('hide_card_numbers')}
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                {t('show_card_numbers')}
              </>
            )}
          </Button>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('recent_transactions')}</span>
              <Button variant="ghost" size="sm" onClick={() => setShowTransactions(!showTransactions)}>
                {showTransactions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          {showTransactions && (
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((txn, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{String(txn.description || 'Transaction')}</p>
                          <p className="text-xs text-gray-500">{String(txn.date || '')}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${String(txn.amount || '').startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                        {String(txn.amount || '$0.00')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">{t('no_recent_transactions')}</p>
              )}
            </CardContent>
          )}
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
