// client/src/pages/transaction-history.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthUser } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Button, Input } from "@/components/ui/button";
import { RefreshCw, Download, Calendar, Search } from "lucide-react";

interface Account {
  id: string;
  accountName: string;
  accountNumber: string;
}

interface Transaction {
  id: string;
  accountId: string;
  type: "credit" | "debit";
  amount: string;
  description: string;
  category: string;
  created_at: string;
  recipientName?: string;
  bankName?: string;
}

export default function TransactionHistoryPage() {
  const { data: authUser } = useAuthUser();
  const userId = authUser?.id ?? null;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch accounts for the logged-in user
  const fetchAccounts = async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    setAccounts(data || []);
  };

  // Fetch transactions for all accounts
  const fetchTransactions = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let query = supabase.from("transactions").select("*").eq("user_id", userId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [userId]);

  useEffect(() => {
    if (accounts.length > 0) fetchTransactions();
  }, [accounts]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.recipientName && tx.recipientName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAccount = selectedAccount === "all" || tx.accountId === selectedAccount;
    const matchesCategory = selectedCategory === "all" || tx.category === selectedCategory;
    return matchesSearch && matchesAccount && matchesCategory;
  });

  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? account.accountName : `Account ${accountId}`;
  };

  const formatAmount = (amount: string, type: "credit" | "debit") => {
    const num = parseFloat(amount);
    return `${type === "credit" ? "+" : "-"}$${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "transfer":
        return "bg-blue-100 text-blue-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "dividend":
        return "bg-green-100 text-green-800";
      case "fee":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const categories = ["all", ...Array.from(new Set(transactions.map((t) => t.category)))];

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <div className="flex gap-2">
            <Button onClick={fetchTransactions} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName} (****{acc.accountNumber.slice(-4)})
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Recent Transactions <Badge variant="outline">{filteredTransactions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No transactions found.</div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{tx.description}</span>
                          <Badge className={getCategoryColor(tx.category)}>{tx.category}</Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Account: {getAccountName(tx.accountId)} | Date: {new Date(tx.created_at).toLocaleString()}
                          {tx.recipientName && ` | Recipient: ${tx.recipientName}`}
                          {tx.bankName && ` | Bank: ${tx.bankName}`}
                        </div>
                      </div>
                      <div className={`text-lg font-semibold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {formatAmount(tx.amount, tx.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
