// client/src/pages/dashboard.tsx
import { useEffect, useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar } from "@/components/Avatar";
import LiveChat from "@/components/LiveChat";
import RealtimeAlerts from "@/components/RealtimeAlerts";
import { 
  useUser, 
  useAccount, 
  useTransactions, 
  useRealtimeAccount, 
  useRealtimeTransactions 
} from "@/hooks/useSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { data: authUser } = useUser();
  const userId = authUser?.id ?? null;

  const { data: account } = useAccount(userId);
  const { data: transactions = [] } = useTransactions(userId);

  // Live sync for account + transactions
  useRealtimeAccount(userId);
  useRealtimeTransactions(userId);

  const [showBalance, setShowBalance] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const onToggle = () => setIsChatOpen((s) => !s);
    window.addEventListener("toggleLiveChat", onToggle);
    return () => window.removeEventListener("toggleLiveChat", onToggle);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Header */}
      <div className="bg-white px-4 py-3 shadow-sm relative">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img src="/world-bank-logo.jpeg" alt="World Bank Logo" className="w-8 h-8 object-contain" />
            <div>
              <div className="text-gray-900 font-semibold text-sm">WORLD BANK</div>
              <div className="text-xs text-gray-500">International Banking</div>
            </div>
          </div>

          {/* Alerts + Profile */}
          <div className="flex items-center space-x-3">
            <RealtimeAlerts />
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
              >
                <Avatar size={40} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <Avatar size={64} />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {authUser?.user_metadata?.full_name ?? authUser?.email ?? "User"}
                        </div>
                        <div className="text-sm text-gray-600">{authUser?.email}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="text-xs bg-green-100 text-green-800 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Verified Account</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500">Account ID: {account?.id ?? "-"}</div>
                    <div className="text-xs text-gray-500">Last Login: {authUser ? new Date().toLocaleDateString() : "-"}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Welcome, {authUser?.user_metadata?.full_name ?? authUser?.email ?? "Guest"}
                </h1>
                <p className="text-sm text-gray-600">Account: {account?.account_number ?? "—"}</p>
              </div>
              <Avatar size={80} />
            </div>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm">Total balance</p>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">
                    {showBalance ? `$${Number(account?.balance ?? 0).toLocaleString()}` : "****"}
                  </h2>
                  <button onClick={() => setShowBalance((s) => !s)}>
                    {showBalance ? (
                      <EyeOff className="w-5 h-5 text-blue-100" />
                    ) : (
                      <Eye className="w-5 h-5 text-blue-100" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Account</p>
                <p className="text-sm font-medium">
                  {account?.account_number 
                    ? `****${String(account.account_number).slice(-4)}` 
                    : "****0000"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="w-4 h-4 text-green-300" />
                <span className="text-sm">+2.5%</span>
              </div>
              <span className="text-blue-100 text-sm">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My accounts</h3>
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <WalletIcon />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Primary Account</h4>
                    <p className="text-sm text-gray-500">{account?.account_number ?? "****0000"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    {showBalance ? `$${Number(account?.balance ?? 0).toLocaleString()}` : "****"}
                  </p>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 && (
                <div className="text-sm text-gray-500">No recent transactions.</div>
              )}
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.description ?? (tx.type === "credit" ? "Credit" : "Debit")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={
                      tx.type === "credit"
                        ? "font-medium text-green-600"
                        : "font-medium text-red-600"
                    }
                  >
                    {tx.type === "credit" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation + Chat */}
      <BottomNavigation />
      <LiveChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

/** Placeholder Wallet icon (replace if you have your own) */
function WalletIcon() {
  return (
    <svg
      className="w-6 h-6 text-blue-600"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3 7h18v10H3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
