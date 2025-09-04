import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  recipient_name?: string;
  status: string;
  transaction_type?: string;
  created_at: string;
}

interface RecentActivityProps {
  transactions?: Transaction[];
}

export default function RecentActivity({ transactions }: RecentActivityProps) {
  if (!transactions) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.description}
                  </p>
                  {transaction.recipient_name && (
                    <p className="text-sm text-gray-600">
                      To: {transaction.recipient_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </p>
                <span className="text-xs text-gray-500">
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
