import type { User } from "@/lib/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  CreditCard, 
  Banknote, 
  Building, 
  Smartphone, 
  Plus, 
  CheckCircle, 
  Shield,
  Clock,
  Wallet,
  ArrowUpRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function AddMoney() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading} = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  const quickAmounts = ["$50", "$100", "$250", "$500", "$1,000", "$2,500"];

  const addMoneyMethods = [
    {
      id: "debit_card",
      name: "Debit Card",
      description: "Instant transfer from your debit card",
      icon: CreditCard,
      fee: "Free",
      time: "Instant",
      color: "bg-blue-500"
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      description: "Transfer from your bank account",
      icon: Building,
      fee: "Free",
      time: "1-3 business days",
      color: "bg-green-500"
    },
    {
      id: "cash_deposit",
      name: "Cash Deposit",
      description: "Deposit cash at World Bank branches",
      icon: Banknote,
      fee: "Free",
      time: "Instant",
      color: "bg-yellow-500"
    },
    {
      id: "mobile_money",
      name: "Mobile Money",
      description: "Transfer from mobile money services",
      icon: Smartphone,
      fee: "1.5%",
      time: "Instant",
      color: "bg-purple-500"
    }
  ];

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="px-4 py-6 pb-20">
        <h1 className="text-2xl font-bold mb-6">Add Money</h1>
      </div>
      <BottomNavigation />
    </div>
  );
