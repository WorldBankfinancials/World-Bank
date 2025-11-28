import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface Account {
  id: number;
  accountType: string;
  accountName: string;
  accountNumber: string;
  balance: string;
}

export default function AdminTransactionCreator() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/accounts');
      return response.ok ? response.json() : [];
    }
  });
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionType, setTransactionType] = useState("deposit");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateTransaction = async () => {
    if (!selectedAccountId || !amount || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: parseInt(selectedAccountId),
          amount: parseFloat(amount),
          description,
          type: transactionType
        })
      });

      if (!response.ok) throw new Error('Failed to create transaction');

      toast({
        title: "Success",
        description: `Transaction created successfully`,
      });
      setAmount("");
      setDescription("");
      setSelectedAccountId("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Create Transaction</h1>
          <p className="text-gray-600">Manually create transactions for customer accounts</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <span>New Transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose account..." />
                </SelectTrigger>
                <SelectContent>
                  {(accounts as Account[]).map((acc: Account) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.accountName} - {acc.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Transaction Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                placeholder="Transaction description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button
              onClick={handleCreateTransaction}
              disabled={isProcessing}
              className="w-full bg-blue-600 text-white"
            >
              {isProcessing ? "Creating..." : "Create Transaction"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
