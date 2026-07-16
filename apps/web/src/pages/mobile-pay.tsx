import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/queryClient";
import { Smartphone, Send, Plus } from "lucide-react";
import { useState } from "react";

interface Merchant {
  id: number;
  name: string;
  logo: string;
  category: string;
}

interface MobilePayment {
  id: number;
  amount: string;
  description: string;
  status: string;
  created_at: string;
}

export default function MobilePay() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');

  const { data: merchants = [] } = useQuery<Merchant[]>({
    queryKey: ['/api/mobile-pay/merchants'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/mobile-pay/merchants');
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: payments = [] } = useQuery<MobilePayment[]>({
    queryKey: ['/api/mobile-payments'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/mobile-payments');
      if (!response.ok) return [];
      return response.json();
    }
  });

  const handleSendPayment = async () => {
    if (!amount || !phoneNumber || !pin) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (numAmount > 10000) { alert('Maximum mobile payment is $10,000'); return; }

    try {
      const verifyRes = await authenticatedFetch('/api/verify-pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile?.email, pin })
      });
      if (!verifyRes.ok) { alert('Invalid PIN'); return; }

      const txnRes = await authenticatedFetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, currency: 'USD', transaction_type: 'payment', description: `Mobile payment to ${phoneNumber}`, recipient_name: phoneNumber, status: 'completed' })
      });
      if (txnRes.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/mobile-payments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        setAmount(''); setPhoneNumber(''); setPin('');
      }
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as User | undefined} />
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('mobile_pay')}</h1>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4"><Smartphone className="w-6 h-6 text-blue-600" /><h2 className="text-lg font-semibold">Send Payment</h2></div>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('phone_number')}</label><input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 234 567 8900" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('amount')}</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" max="10000" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('transfer_pin')}</label><input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" maxLength={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <button onClick={handleSendPayment} disabled={!amount || !phoneNumber || !pin} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"><Send className="w-4 h-4" />{t('send_payment')}</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow mb-6">
          <div className="p-4 border-b"><h2 className="text-lg font-semibold">Merchants</h2></div>
          <div className="p-4">
            {merchants.length === 0 ? <p className="text-center text-gray-500 py-4">No merchants available</p> : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {merchants.map((merchant: Merchant) => (
                  <div key={merchant.id} className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"><span className="text-3xl mb-2">{merchant.logo}</span><p className="font-medium text-sm">{merchant.name}</p><p className="text-xs text-gray-500">{merchant.category}</p></div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow">
          <div className="p-4 border-b"><h2 className="text-lg font-semibold">Recent Payments</h2></div>
          <div className="p-4">
            {payments.length === 0 ? <p className="text-center text-gray-500 py-4">No recent payments</p> : (
              <div className="space-y-2">
                {payments.map((payment: MobilePayment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg"><div><p className="font-medium">{payment.description}</p><p className="text-sm text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</p></div><p className="font-semibold">${payment.amount}</p></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
