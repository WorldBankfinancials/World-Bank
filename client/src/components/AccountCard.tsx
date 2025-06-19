import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Account {
  id: string;
  account_number: string;
  account_name?: string;
  account_type: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
}

interface AccountCardProps {
  account?: Account;
  transactions?: Transaction[];
  showBalance?: boolean;
  onToggleBalance?: () => void;
}

export default function AccountCard({ 
  account, 
  transactions = [], 
  showBalance = true, 
  onToggleBalance 
}: AccountCardProps) {
  const { userProfile } = useAuth();
  if (!account) {
    return (
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Loading account information...
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const recentTransactions = transactions.slice(0, 3);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>{account.account_name || `${account.account_type} Account`}</span>
          </div>
          <Badge variant={account.is_active ? "default" : "secondary"}>
            {account.is_active ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Account Number</p>
            <p className="font-mono text-lg">****{account.account_number.slice(-4)}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-2xl font-bold text-green-600">
                {showBalance ? formatCurrency(userProfile?.balance || account.balance, account.currency) : "••••••"}
              </p>
            </div>
            {onToggleBalance && (
              <button
                onClick={onToggleBalance}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>

          {recentTransactions.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Recent Transactions</p>
              <div className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{transaction.description}</span>
                    <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}