import { useLocation } from 'wouter';
import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import type { User } from '@packages/shared/schema';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/queryClient';
import { ArrowLeftRight, Send, Check, AlertCircle, Loader2 } from 'lucide-react';

interface UserAccount {
  id: string | number;
  accountNumber: string;
  balance: string;
  accountType: string;
}

export default function TransferFunds() {
  const [location, setLocation] = useLocation();
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'details' | 'processing' | 'success' | 'error'>('details');
  const [transferType, setTransferType] = useState<'domestic' | 'international'>('domestic');
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [description, setDescription] = useState('');
  const [transferPin, setTransferPin] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: accounts = [], isLoading, error } = useQuery<UserAccount[]>({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    }
  });

  useEffect(() => {
    if (error) {
      toast({ title: 'Error loading accounts', variant: 'destructive' });
    }
  }, [error, toast]);

  const handleTransfer = async () => {
    if (!amount || !recipientAccount || !recipientName || !transferPin) {
      toast({ title: 'Missing required fields', variant: 'destructive' });
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    setStep('processing');
    try {
      const response = await authenticatedFetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAccount,
          recipientName,
          amount: parsedAmount,
          description,
          transferPin,
          transferType,
          ...(transferType === 'international' && recipientBank ? { recipientBank } : {}),
          ...(transferType === 'international' && swiftCode ? { swiftCode } : {}),
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Transfer failed');
      setReferenceNumber(data.referenceNumber || data.reference_number || 'N/A');
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Transfer failed');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('details');
    setAmount('');
    setRecipientName('');
    setRecipientAccount('');
    setRecipientBank('');
    setSwiftCode('');
    setDescription('');
    setTransferPin('');
    setReferenceNumber('');
    setErrorMessage('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as User | undefined} />
      <div className="container mx-auto px-4 py-6 max-w-2xl pb-20">
        {step === 'details' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t('transfer_funds') || 'Transfer Funds'}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setTransferType('domestic')}
                className={`flex-1 py-2 rounded-lg font-medium ${transferType === 'domestic' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
              >
                {t('domestic') || 'Domestic'}
              </button>
              <button
                onClick={() => setTransferType('international')}
                className={`flex-1 py-2 rounded-lg font-medium ${transferType === 'international' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
              >
                {t('international') || 'International'}
              </button>
            </div>
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('amount') || 'Amount'}</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('recipient_name') || 'Recipient Name'}</label>
                <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('recipient_account') || 'Recipient Account'}</label>
                <input type="text" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              {transferType === 'international' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('recipient_bank') || 'Recipient Bank'}</label>
                    <input type="text" value={recipientBank} onChange={(e) => setRecipientBank(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SWIFT Code</label>
                    <input type="text" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{t('description') || 'Description'}</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('transfer_pin') || 'Transfer PIN'}</label>
                <input type="password" maxLength={6} value={transferPin} onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 border rounded-lg" placeholder="4-6 digits" />
              </div>
              <button onClick={handleTransfer} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                {t('send_transfer') || 'Send Transfer'}
              </button>
            </div>
          </div>
        )}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">{t('processing_transfer') || 'Processing your transfer...'}</p>
          </div>
        )}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Check className="w-16 h-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('transfer_successful') || 'Transfer Successful'}</h2>
            <p className="text-gray-600 mb-1">{t('reference_number') || 'Reference'}: {referenceNumber}</p>
            <button onClick={() => { reset(); setLocation('/dashboard'); }} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg">
              {t('back_to_dashboard') || 'Back to Dashboard'}
            </button>
          </div>
        )}
        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('transfer_failed') || 'Transfer Failed'}</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <button onClick={reset} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg">
              {t('try_again') || 'Try Again'}
            </button>
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}
