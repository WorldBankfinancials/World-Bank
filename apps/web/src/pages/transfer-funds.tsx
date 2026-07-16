import { useLocation } from 'wouter';
import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch, apiRequest } from '@/lib/queryClient';
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

  const { data: accounts = [] } = useQuery<UserAccount[]>({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/accounts');
      if (!response.ok) return [];
      return response.json();
    }
  });

  const handleSubmit = async () => {
    // Validate
    if (!amount || !recipientName || !recipientAccount || !transferPin) {
      toast({ title: t('missing_information'), description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    // Max transfer validation
    const MAX_TRANSFER = transferType === 'domestic' ? 1000000 : 500000;
    if (numAmount > MAX_TRANSFER) {
      toast({ title: 'Amount Too High', description: `Maximum ${transferType} transfer is $${MAX_TRANSFER.toLocaleString()}`, variant: 'destructive' });
      return;
    }

    setStep('processing');

    try {
      const endpoint = transferType === 'international' ? '/api/transfers/international' : '/api/transfers';
      const body = transferType === 'international'
        ? { recipientAccount, recipientName, recipientBank, swiftCode, amount: numAmount, currency: 'USD', description, transferPin }
        : { recipientAccount, recipientName, amount: numAmount, currency: 'USD', description, transferPin };

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReferenceNumber(data.reference || `TRF${Date.now()}`);
        setStep('success');
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      } else {
        setErrorMessage(data.error || 'Transfer failed');
        setStep('error');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Transfer failed');
      setStep('error');
    }
  };

  const resetForm = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as any || undefined} />
      <main className="container mx-auto px-4 py-6 max-w-2xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('transfer')}</h1>

        {step === 'details' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex gap-2 mb-6">
              <button onClick={() => setTransferType('domestic')} className={`flex-1 py-2 rounded-lg font-medium ${transferType === 'domestic' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{t('domestic_transfer')}</button>
              <button onClick={() => setTransferType('international')} className={`flex-1 py-2 rounded-lg font-medium ${transferType === 'international' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{t('international_transfer')}</button>
            </div>

            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('amount')}</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" max={transferType === 'domestic' ? 1000000 : 500000} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('recipient_name')}</label><input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('account_number')}</label><input type="text" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="Account number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              {transferType === 'international' && (<><div><label className="block text-sm font-medium text-gray-700 mb-2">{t('bank_name')}</label><input type="text" value={recipientBank} onChange={(e) => setRecipientBank(e.target.value)} placeholder="Bank name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">{t('swift_code')}</label><input type="text" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} placeholder="SWIFT code" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div></>)}
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('description')}</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Transfer description (optional)" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('transfer_pin')}</label><input type="password" value={transferPin} onChange={(e) => setTransferPin(e.target.value)} placeholder="••••" maxLength={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <button onClick={handleSubmit} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"><Send className="w-4 h-4" />{t('transfer.submit')}</button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="bg-white rounded-xl shadow p-8 text-center"><Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" /><h2 className="text-lg font-semibold mb-2">{t('transfer_processing')}</h2><p className="text-sm text-gray-600">{t('transfer_processing_secure')}</p></div>
        )}

        {step === 'success' && (
          <div className="bg-white rounded-xl shadow p-8 text-center"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-600" /></div><h2 className="text-lg font-semibold mb-2">{t('transfer.success')}</h2><p className="text-sm text-gray-600 mb-4">{t('reference_id')} {referenceNumber}</p><button onClick={resetForm} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('continue')}</button></div>
        )}

        {step === 'error' && (
          <div className="bg-white rounded-xl shadow p-8 text-center"><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div><h2 className="text-lg font-semibold mb-2">{t('failed')}</h2><p className="text-sm text-gray-600 mb-4">{errorMessage}</p><button onClick={() => setStep('details')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('back')}</button></div>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
}
