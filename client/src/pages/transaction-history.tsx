import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, ArrowUpRight, ArrowDownRight, Calendar, FileText, TrendingUp, RefreshCw, Plus, DollarSign, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import type { User, Transaction } from "@/lib/schema";
import { TransactionData, CustomerData } from "@/types";

interface TransactionFormData {
  amount: string;
  type: 'credit' | 'debit';
  description: string;
  category: string;
  adminNotes: string;
}

export default function TransactionHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
