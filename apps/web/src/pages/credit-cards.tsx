import type { User } from "@packages/shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Eye, EyeOff, Settings, ArrowLeft, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { authenticatedFetch } from "@/lib/queryClient";

interface CreditCardData {
  id: string;
  cardNumber: string;
  cardType: string;
  status: string;
  creditLimit: string;
  availableCredit: string;
  expiryDate: string;
}

interface CardTransaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  status: string;
}

export default function CreditCards() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error: userError } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const { data: creditCards = [], isLoading: cardsLoading, error: cardsError } = useQuery<CreditCardData[]>({
    queryKey: ['/api/cards'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/cards');
      if (!response.ok) throw new Error('Failed to fetch cards');
      return response.json();
    },
    staleTime: 30000
  });

  const { data: recentTransactions = [], error: transactionsError } = useQuery<CardTransaction[]>({
    queryKey: ['/api/card-transactions'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/card-transactions');
      if (!response.ok) throw new Error('Failed to fetch card transactions');
      return response.json();
    },
    staleTime: 30000
  });

  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [selectedCard, setSelectedCard] = useState(0);
  const { toast } = useToast();

  const queryError = userError || cardsError || transactionsError;
  useEffect(() => {
    if (queryError) toast({ title: 'Error loading data', variant: 'destructive' });
  }, [queryError, toast]);

  if (isLoading || cardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentCard = creditCards[selectedCard];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Credit Cards</h1>
        </div>

        {creditCards.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No credit cards yet</p>
              <Button onClick={() => setLocation('/cards')}>
                <Plus className="w-4 h-4 mr-1" /> Apply for a Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative mb-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-sm opacity-80">{currentCard?.cardType || 'Credit Card'}</p>
                    <p className="text-2xl font-bold">World Bank</p>
                  </div>
                  <CreditCard className="w-8 h-8" />
                </div>
                <div className="mb-4">
                  <p className="text-lg font-mono tracking-wider">
                    {showCardNumbers ? currentCard?.cardNumber : '**** **** **** ' + (currentCard?.cardNumber?.slice(-4) || '0000')}
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="opacity-60 text-xs">Credit Limit</p>
                    <p className="font-semibold">${parseFloat(currentCard?.creditLimit || '0').toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="opacity-60 text-xs">Available</p>
                    <p className="font-semibold">${parseFloat(currentCard?.availableCredit || '0').toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="opacity-60 text-xs">Expires</p>
                    <p className="font-semibold">{currentCard?.expiryDate || 'N/A'}</p>
                  </div>
                </div>
              </div>
              {creditCards.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {creditCards.map((card, idx) => (
                    <button key={card.id} onClick={() => setSelectedCard(idx)}
                      className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${idx === selectedCard ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                      {card.cardType}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setShowCardNumbers(!showCardNumbers)}>
                {showCardNumbers ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showCardNumbers ? 'Hide' : 'Show'} Numbers
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLocation('/cards')}>
                <Settings className="w-4 h-4 mr-1" /> Manage
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No recent transactions</p>
                ) : (
                  <div className="space-y-2">
                    {recentTransactions.map((tx: CardTransaction) => (
                      <div key={tx.id} className="flex justify-between items-center p-2 border-b">
                        <div>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">${parseFloat(tx.amount).toFixed(2)}</p>
                          <Badge variant="outline" className="text-xs">{tx.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}
