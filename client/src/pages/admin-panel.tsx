import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Users, DollarSign, CreditCard, MessageSquare, FileText, TrendingUp,
  Search, Edit, CheckCircle, XCircle, Plus, Minus, RefreshCw, Send,
  Upload, Shield, AlertTriangle, Clock, LogOut, Activity, Eye,
  ArrowUpRight, ArrowDownLeft, Wallet, Ban, UserCheck
} from 'lucide-react';

interface Customer {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  profession: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  balance: number | string;
  accountNumber: string;
  accountId: string;
  createdAt: string;
}

interface Transaction {
  id: number;
  amount: string;
  type: string;
  status: string;
  description: string;
  currency: string;
  fromAccountId: number;
  toAccountId: number;
  recipientName: string;
  createdAt: string;
}

interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  description: string;
  priority: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: 'admin' | 'customer';
  text: string;
  timestamp: Date;
  customerName?: string;
}

export default function AdminPanel() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Auth guard with loading state
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    if (!user) { setLocation('/admin-login'); return; }
    // Check stored profile first (set immediately after login)
    const storedProfile = localStorage.getItem('userProfile');
    const profile = storedProfile ? JSON.parse(storedProfile) : null;
    const role = profile?.role || userProfile?.role;
    if (role && role !== 'admin') {
      toast({ title: 'Access Denied', description: 'Admin role required.', variant: 'destructive' });
      setLocation('/login');
    }
  }, [user, userProfile, authLoading]);

  // ─── Customer Management State ───────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [fundAmount, setFundAmount] = useState('');
  const [fundType, setFundType] = useState<'credit' | 'debit'>('credit');
  const [fundNote, setFundNote] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

  // ─── Transaction State ───────────────────────────────────────────────────
  const [txSearch, setTxSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showTxEdit, setShowTxEdit] = useState(false);
  const [txNewStatus, setTxNewStatus] = useState('');
  const [showCreateTx, setShowCreateTx] = useState(false);
  const [newTx, setNewTx] = useState({ customerId: '', amount: '', type: 'credit', description: '', currency: 'USD' });

  // ─── Live Chat State ─────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedChatCustomer, setSelectedChatCustomer] = useState<Customer | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Support Ticket State ────────────────────────────────────────────────
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: customers = [], isLoading: customersLoading, refetch: refetchCustomers } = useQuery<Customer[]>({
    queryKey: ['/api/admin/customers'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch('/api/admin/customers');
      return r.ok ? r.json() : [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch('/api/admin/transactions');
      return r.ok ? r.json() : [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: tickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useQuery<SupportTicket[]>({
    queryKey: ['/api/admin/support-tickets'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch('/api/admin/support-tickets');
      return r.ok ? r.json() : [];
    },
    enabled: !!user,
    refetchInterval: 20000,
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch('/api/admin/stats');
      return r.ok ? r.json() : {};
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const { data: pendingTransfers = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/pending-transfers'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch('/api/admin/pending-transfers');
      return r.ok ? r.json() : [];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // ─── Realtime Subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    // Listen to all table changes for real-time admin view
    const txChannel = supabase.channel('admin-transactions-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        refetchTx();
        queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      }).subscribe();

    const userChannel = supabase.channel('admin-users-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_users' }, () => {
        refetchCustomers();
      }).subscribe();

    const msgChannel = supabase.channel('admin-messages-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new && payload.new.sender_role === 'customer') {
          const msg: ChatMessage = {
            id: String(payload.new.id),
            sender: 'customer',
            text: payload.new.content,
            timestamp: new Date(payload.new.created_at),
            customerName: `Customer ${payload.new.sender_id}`
          };
          setChatMessages(prev => [...prev, msg]);
        }
      }).subscribe();

    const ticketChannel = supabase.channel('admin-tickets-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        refetchTickets();
      }).subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(userChannel);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─── Customer Mutations ───────────────────────────────────────────────────
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Customer> }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/customers/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates)
      });
      if (!r.ok) throw new Error('Failed to update customer');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      setShowEditDialog(false);
      toast({ title: 'Customer Updated', description: 'Profile saved successfully.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const fundCustomerMutation = useMutation({
    mutationFn: async (data: { id: number; amount: number; type: string; description: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/customers/${data.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: data.amount, type: data.type, description: data.description })
      });
      if (!r.ok) { const err = await r.json(); throw new Error(err.error || 'Failed'); }
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      setFundAmount('');
      setFundNote('');
      toast({ title: '✅ Balance Updated', description: data.message });
      refetchCustomers();
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const verifyCustomerMutation = useMutation({
    mutationFn: async (data: { id: number; verified: boolean }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/customers/${data.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: data.verified })
      });
      if (!r.ok) throw new Error('Failed to verify customer');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      toast({ title: 'Verification Updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (data: { id: number; isActive: boolean }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/customers/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: data.isActive })
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      toast({ title: 'Account Status Updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const uploadProfilePicMutation = useMutation({
    mutationFn: async (data: { id: number; file: File }) => {
      // Convert file to base64 data URL
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(data.file);
      });
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/customers/${data.id}/profile-picture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhoto: base64 })
      });
      if (!r.ok) throw new Error('Failed to upload');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      setProfilePicFile(null);
      toast({ title: 'Profile Picture Updated' });
    },
    onError: (e: any) => toast({ title: 'Upload Failed', description: e.message, variant: 'destructive' })
  });

  // ─── Transaction Mutations ────────────────────────────────────────────────
  const updateTxMutation = useMutation({
    mutationFn: async (data: { id: number; status: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/transactions/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: data.status })
      });
      if (!r.ok) throw new Error('Failed to update transaction');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      setShowTxEdit(false);
      toast({ title: 'Transaction Updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const approveTxMutation = useMutation({
    mutationFn: async (txId: number) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/transfers/${txId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved by admin' })
      });
      if (!r.ok) throw new Error('Failed to approve');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-transfers'] });
      toast({ title: '✅ Transfer Approved', description: 'Transaction has been approved.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const rejectTxMutation = useMutation({
    mutationFn: async (txId: number) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/transfers/${txId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by admin' })
      });
      if (!r.ok) throw new Error('Failed to reject');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-transfers'] });
      toast({ title: '❌ Transfer Rejected' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const createTxMutation = useMutation({
    mutationFn: async (data: typeof newTx) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch('/api/admin/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(data.customerId),
          amount: parseFloat(data.amount),
          type: data.type,
          description: data.description,
          currency: data.currency
        })
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed'); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      setShowCreateTx(false);
      setNewTx({ customerId: '', amount: '', type: 'credit', description: '', currency: 'USD' });
      toast({ title: '✅ Transaction Created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  // ─── Support Ticket Mutations ─────────────────────────────────────────────
  const replyTicketMutation = useMutation({
    mutationFn: async (data: { id: number; response: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/tickets/${data.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: data.response })
      });
      if (!r.ok) throw new Error('Failed to reply');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
      setTicketReply('');
      setSelectedTicket(null);
      toast({ title: '✅ Reply Sent' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const closeTicketMutation = useMutation({
    mutationFn: async (id: number) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const r = await authenticatedFetch(`/api/admin/support-tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
      toast({ title: 'Ticket Closed' });
    }
  });

  // ─── Live Chat ────────────────────────────────────────────────────────────
  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim() || !selectedChatCustomer) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'admin',
      text: chatInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, msg]);
    const text = chatInput;
    setChatInput('');
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      await authenticatedFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          recipientId: selectedChatCustomer.id,
          sessionId: `session_${selectedChatCustomer.id}`
        })
      });
    } catch (_) {}
  }, [chatInput, selectedChatCustomer]);

  // Load chat history when customer is selected
  useEffect(() => {
    if (!selectedChatCustomer) return;
    const loadChat = async () => {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const r = await authenticatedFetch(`/api/messages/session/session_${selectedChatCustomer.id}`);
        if (r.ok) {
          const msgs = await r.json();
          if (Array.isArray(msgs)) {
            setChatMessages(msgs.map((m: any) => ({
              id: String(m.id),
              sender: m.senderRole === 'admin' ? 'admin' : 'customer',
              text: m.content,
              timestamp: new Date(m.createdAt || m.created_at)
            })));
          }
        }
      } catch (_) {}
    };
    loadChat();
  }, [selectedChatCustomer]);

  // ─── Filters ──────────────────────────────────────────────────────────────
  const filteredCustomers = (customers as Customer[]).filter(c =>
    !customerSearch || c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.accountNumber?.includes(customerSearch)
  );

  const filteredTransactions = (transactions as Transaction[]).filter(t =>
    !txSearch || t.description?.toLowerCase().includes(txSearch.toLowerCase()) ||
    String(t.amount).includes(txSearch) || t.status?.includes(txSearch)
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': case 'completed': case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatBalance = (bal: any) => {
    const n = parseFloat(String(bal || 0));
    return isNaN(n) ? '$0.00' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (d: any) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const totalBalance = (customers as Customer[]).reduce((s, c) => s + parseFloat(String(c.balance || 0)), 0);
  const activeCustomers = (customers as Customer[]).filter(c => c.isActive).length;
  const pendingTickets = (tickets as SupportTicket[]).filter(t => t.status === 'open').length;
  const pendingTxCount = (pendingTransfers as Transaction[]).length;

  if (!user) return null;
  if (userProfile && userProfile.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">World Bank Admin</h1>
            <p className="text-slate-400 text-sm">Banking Control Center</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {pendingTxCount > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">
              {pendingTxCount} Pending
            </Badge>
          )}
          <span className="text-slate-300 text-sm">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-300 hover:text-white">
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border border-slate-700 mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              <Activity className="w-4 h-4 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-blue-600">
              <Users className="w-4 h-4 mr-1" /> Customers
              {pendingTxCount > 0 && <Badge className="ml-1 bg-red-500 text-xs">{pendingTxCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600">
              <DollarSign className="w-4 h-4 mr-1" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="funding" className="data-[state=active]:bg-blue-600">
              <Wallet className="w-4 h-4 mr-1" /> Fund Management
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-blue-600">
              <MessageSquare className="w-4 h-4 mr-1" /> Live Chat
            </TabsTrigger>
            <TabsTrigger value="tickets" className="data-[state=active]:bg-blue-600">
              <FileText className="w-4 h-4 mr-1" /> Support
              {pendingTickets > 0 && <Badge className="ml-1 bg-orange-500 text-xs">{pendingTickets}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW ────────────────────────────────────────────── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Customers', value: (customers as Customer[]).length, icon: Users, color: 'text-blue-400' },
                { label: 'Active Customers', value: activeCustomers, icon: UserCheck, color: 'text-green-400' },
                { label: 'Total Balance', value: formatBalance(totalBalance), icon: DollarSign, color: 'text-yellow-400' },
                { label: 'Pending Transfers', value: pendingTxCount, icon: Clock, color: 'text-red-400' },
              ].map((stat) => (
                <Card key={stat.label} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                      <stat.icon className={`w-8 h-8 ${stat.color} opacity-70`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pending Transfers */}
            {(pendingTransfers as Transaction[]).length > 0 && (
              <Card className="bg-slate-800 border-slate-700 mb-4">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                    Pending Transfers Requiring Approval ({pendingTxCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(pendingTransfers as Transaction[]).map((t: Transaction) => (
                      <div key={t.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-white">{t.description || 'Transfer'}</p>
                          <p className="text-slate-400 text-sm">{formatDate(t.createdAt)}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-yellow-400 font-bold">${t.amount}</span>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs"
                            onClick={() => approveTxMutation.mutate(t.id)} disabled={approveTxMutation.isPending}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs"
                            onClick={() => rejectTxMutation.mutate(t.id)} disabled={rejectTxMutation.isPending}>
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(transactions as Transaction[]).slice(0, 8).map((t: Transaction) => (
                    <div key={t.id} className="flex items-center justify-between p-2 border-b border-slate-700">
                      <div className="flex items-center space-x-3">
                        {t.type === 'credit' || t.type === 'deposit' ?
                          <ArrowDownLeft className="w-4 h-4 text-green-400" /> :
                          <ArrowUpRight className="w-4 h-4 text-red-400" />
                        }
                        <div>
                          <p className="text-white text-sm">{t.description || t.type}</p>
                          <p className="text-slate-400 text-xs">{formatDate(t.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-sm ${t.type === 'credit' || t.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.type === 'credit' || t.type === 'deposit' ? '+' : '-'}${t.amount}
                        </span>
                        <Badge className={`text-xs ${getStatusColor(t.status)}`}>{t.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── CUSTOMERS ────────────────────────────────────────────── */}
          <TabsContent value="customers">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Customer Management ({filteredCustomers.length})</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => refetchCustomers()} className="border-slate-600 text-slate-300">
                    <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                  </Button>
                </div>
                <Input
                  placeholder="Search by name, email, or account number..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <p className="text-slate-400 text-center py-8">Loading customers...</p>
                ) : (
                  <div className="space-y-3">
                    {filteredCustomers.map((customer: Customer) => (
                      <div key={customer.id} className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {(customer.fullName || customer.firstName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{customer.fullName || `${customer.firstName} ${customer.lastName}`}</p>
                              <p className="text-slate-400 text-sm">{customer.email}</p>
                              <p className="text-slate-500 text-xs">Acc: {customer.accountNumber}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold text-lg">{formatBalance(customer.balance)}</p>
                            <div className="flex space-x-1 mt-1">
                              {customer.isVerified ?
                                <Badge className="bg-green-900 text-green-300 text-xs">Verified</Badge> :
                                <Badge className="bg-yellow-900 text-yellow-300 text-xs">Unverified</Badge>
                              }
                              {customer.isActive ?
                                <Badge className="bg-blue-900 text-blue-300 text-xs">Active</Badge> :
                                <Badge className="bg-red-900 text-red-300 text-xs">Inactive</Badge>
                              }
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs"
                            onClick={() => { setEditForm({ ...customer }); setSelectedCustomer(customer); setShowEditDialog(true); }}>
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button size="sm" className={`text-xs ${customer.isVerified ? 'bg-yellow-700 hover:bg-yellow-800' : 'bg-green-600 hover:bg-green-700'}`}
                            onClick={() => verifyCustomerMutation.mutate({ id: customer.id, verified: !customer.isVerified })}
                            disabled={verifyCustomerMutation.isPending}>
                            <UserCheck className="w-3 h-3 mr-1" /> {customer.isVerified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button size="sm" className={`text-xs ${customer.isActive ? 'bg-red-700 hover:bg-red-800' : 'bg-green-600 hover:bg-green-700'}`}
                            onClick={() => toggleActiveMutation.mutate({ id: customer.id, isActive: !customer.isActive })}
                            disabled={toggleActiveMutation.isPending}>
                            <Ban className="w-3 h-3 mr-1" /> {customer.isActive ? 'Suspend' : 'Activate'}
                          </Button>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs"
                            onClick={() => { setSelectedChatCustomer(customer); setActiveTab('chat'); }}>
                            <MessageSquare className="w-3 h-3 mr-1" /> Chat
                          </Button>
                          <Button size="sm" className="bg-slate-600 hover:bg-slate-500 text-xs"
                            onClick={() => { setSelectedCustomer(customer); setActiveTab('funding'); }}>
                            <Wallet className="w-3 h-3 mr-1" /> Fund
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TRANSACTIONS ─────────────────────────────────────────── */}
          <TabsContent value="transactions">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Transaction Management</h2>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowCreateTx(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create Transaction
              </Button>
            </div>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Input
                  placeholder="Search transactions..."
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </CardHeader>
              <CardContent>
                {txLoading ? (
                  <p className="text-slate-400 text-center py-8">Loading transactions...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Description</th>
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.slice(0, 50).map((t: Transaction) => (
                          <tr key={t.id} className="border-b border-slate-700 hover:bg-slate-700">
                            <td className="p-2 text-slate-400">#{t.id}</td>
                            <td className="p-2 font-bold text-white">${t.amount}</td>
                            <td className="p-2"><Badge className="text-xs bg-slate-600 text-white">{t.type}</Badge></td>
                            <td className="p-2"><Badge className={`text-xs ${getStatusColor(t.status)}`}>{t.status}</Badge></td>
                            <td className="p-2 text-slate-300">{t.description || '-'}</td>
                            <td className="p-2 text-slate-400 text-xs">{formatDate(t.createdAt)}</td>
                            <td className="p-2">
                              <div className="flex space-x-1">
                                <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 text-xs p-1"
                                  onClick={() => { setSelectedTx(t); setTxNewStatus(t.status); setShowTxEdit(true); }}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                {t.status === 'pending' || t.status === 'processing' ? (
                                  <>
                                    <Button size="sm" variant="ghost" className="text-green-400 text-xs p-1"
                                      onClick={() => approveTxMutation.mutate(t.id)}>
                                      <CheckCircle className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-400 text-xs p-1"
                                      onClick={() => rejectTxMutation.mutate(t.id)}>
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  </>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                      <p className="text-slate-400 text-center py-8">No transactions found</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── FUNDING ──────────────────────────────────────────────── */}
          <TabsContent value="funding">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer selector */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-400" />
                    Select Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Search customer..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mb-3"
                  />
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredCustomers.map((c: Customer) => (
                      <div key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium text-sm">{c.fullName || c.email}</p>
                            <p className="text-slate-400 text-xs">{c.email}</p>
                          </div>
                          <span className="text-green-400 font-bold text-sm">{formatBalance(c.balance)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fund operations */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                    Fund Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCustomer ? (
                    <>
                      <div className="bg-slate-700 p-3 rounded-lg">
                        <p className="text-slate-300 text-sm">Selected Customer</p>
                        <p className="text-white font-bold">{selectedCustomer.fullName || selectedCustomer.email}</p>
                        <p className="text-green-400 text-xl font-bold mt-1">{formatBalance(selectedCustomer.balance)}</p>
                      </div>

                      <div>
                        <Label className="text-slate-300">Operation Type</Label>
                        <div className="flex gap-2 mt-1">
                          <Button
                            className={`flex-1 ${fundType === 'credit' ? 'bg-green-600' : 'bg-slate-600'}`}
                            onClick={() => setFundType('credit')}>
                            <Plus className="w-4 h-4 mr-1" /> Credit (Add)
                          </Button>
                          <Button
                            className={`flex-1 ${fundType === 'debit' ? 'bg-red-600' : 'bg-slate-600'}`}
                            onClick={() => setFundType('debit')}>
                            <Minus className="w-4 h-4 mr-1" /> Debit (Remove)
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-300">Amount (USD)</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount..."
                          value={fundAmount}
                          onChange={e => setFundAmount(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-1"
                          min="0.01"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-300">Note / Description</Label>
                        <Textarea
                          placeholder="Reason for balance adjustment..."
                          value={fundNote}
                          onChange={e => setFundNote(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-1"
                          rows={2}
                        />
                      </div>

                      {/* Preview */}
                      {fundAmount && parseFloat(fundAmount) > 0 && (
                        <div className={`p-3 rounded-lg ${fundType === 'credit' ? 'bg-green-900' : 'bg-red-900'}`}>
                          <p className="text-slate-300 text-sm">Preview:</p>
                          <p className="text-white">
                            Current: {formatBalance(selectedCustomer.balance)} →
                            New: {formatBalance(parseFloat(String(selectedCustomer.balance || 0)) + (fundType === 'credit' ? parseFloat(fundAmount) : -parseFloat(fundAmount)))}
                          </p>
                        </div>
                      )}

                      <Button
                        className={`w-full ${fundType === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        onClick={() => {
                          const amt = parseFloat(fundAmount);
                          if (!amt || amt <= 0) { toast({ title: 'Invalid Amount', variant: 'destructive' }); return; }
                          if (!fundNote.trim()) { toast({ title: 'Note required', variant: 'destructive' }); return; }
                          fundCustomerMutation.mutate({
                            id: selectedCustomer.id, amount: amt, type: fundType,
                            description: fundNote
                          });
                        }}
                        disabled={fundCustomerMutation.isPending || !fundAmount}>
                        {fundCustomerMutation.isPending ? 'Processing...' : `${fundType === 'credit' ? '💰 Add' : '💸 Remove'} $${fundAmount || '0'}`}
                      </Button>

                      {/* Profile picture upload */}
                      <div className="border-t border-slate-600 pt-4">
                        <Label className="text-slate-300">Upload Profile Picture</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={e => setProfilePicFile(e.target.files?.[0] || null)}
                            className="bg-slate-700 border-slate-600 text-white text-sm"
                          />
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 shrink-0"
                            onClick={() => profilePicFile && uploadProfilePicMutation.mutate({ id: selectedCustomer.id, file: profilePicFile })}
                            disabled={!profilePicFile || uploadProfilePicMutation.isPending}>
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a customer to manage their balance</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── LIVE CHAT ────────────────────────────────────────────── */}
          <TabsContent value="chat">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
              {/* Customer list */}
              <Card className="bg-slate-800 border-slate-700 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Customers</CardTitle>
                  <Input
                    placeholder="Search..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2">
                  {(customers as Customer[]).map((c: Customer) => (
                    <div key={c.id}
                      onClick={() => setSelectedChatCustomer(c)}
                      className={`p-2 rounded cursor-pointer mb-1 ${selectedChatCustomer?.id === c.id ? 'bg-blue-700' : 'hover:bg-slate-700'}`}>
                      <p className="text-white text-sm font-medium">{c.fullName || c.email}</p>
                      <p className="text-slate-400 text-xs">{c.email}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Chat area */}
              <div className="md:col-span-2 flex flex-col">
                <Card className="bg-slate-800 border-slate-700 flex-1 flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">
                      {selectedChatCustomer ? `Chat with ${selectedChatCustomer.fullName || selectedChatCustomer.email}` : 'Select a customer to chat'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto space-y-2 min-h-0">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-2 rounded-lg text-sm ${msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}`}>
                          <p>{msg.text}</p>
                          <p className="text-xs opacity-60 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </CardContent>
                  {selectedChatCustomer && (
                    <div className="p-3 border-t border-slate-700 flex gap-2">
                      <Input
                        placeholder="Type message..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Button onClick={sendChatMessage} disabled={!chatInput.trim()} className="bg-blue-600">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ─── SUPPORT TICKETS ──────────────────────────────────────── */}
          <TabsContent value="tickets">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Support Tickets ({(tickets as SupportTicket[]).length})</CardTitle>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <p className="text-slate-400 text-center py-8">Loading tickets...</p>
                ) : (
                  <div className="space-y-3">
                    {(tickets as SupportTicket[]).map((ticket: SupportTicket) => (
                      <div key={ticket.id} className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</Badge>
                              <Badge className={`text-xs ${ticket.priority === 'high' ? 'bg-red-900 text-red-300' : 'bg-slate-600 text-white'}`}>{ticket.priority}</Badge>
                            </div>
                            <p className="text-white font-medium">{ticket.subject}</p>
                            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{ticket.description}</p>
                            <p className="text-slate-500 text-xs mt-1">{formatDate(ticket.createdAt)}</p>
                            {ticket.adminNotes && (
                              <p className="text-blue-300 text-sm mt-1 italic">Admin note: {ticket.adminNotes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs"
                            onClick={() => { setSelectedTicket(ticket); setTicketReply(''); }}>
                            <MessageSquare className="w-3 h-3 mr-1" /> Reply
                          </Button>
                          {ticket.status !== 'closed' && (
                            <Button size="sm" className="bg-slate-600 hover:bg-slate-500 text-xs"
                              onClick={() => closeTicketMutation.mutate(ticket.id)}
                              disabled={closeTicketMutation.isPending}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Close
                            </Button>
                          )}
                        </div>
                        {/* Inline reply */}
                        {selectedTicket?.id === ticket.id && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              placeholder="Type your reply..."
                              value={ticketReply}
                              onChange={e => setTicketReply(e.target.value)}
                              className="bg-slate-600 border-slate-500 text-white"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs"
                                onClick={() => replyTicketMutation.mutate({ id: ticket.id, response: ticketReply })}
                                disabled={replyTicketMutation.isPending || !ticketReply.trim()}>
                                <Send className="w-3 h-3 mr-1" /> Send Reply
                              </Button>
                              <Button size="sm" variant="ghost" className="text-slate-400 text-xs"
                                onClick={() => setSelectedTicket(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {(tickets as SupportTicket[]).length === 0 && (
                      <p className="text-slate-400 text-center py-8">No support tickets</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Edit Customer Dialog ─────────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer: {selectedCustomer?.fullName || selectedCustomer?.email}</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'First Name', key: 'firstName' },
                { label: 'Last Name', key: 'lastName' },
                { label: 'Email', key: 'email' },
                { label: 'Phone', key: 'phone' },
                { label: 'Address', key: 'address' },
                { label: 'City', key: 'city' },
                { label: 'State', key: 'state' },
                { label: 'Country', key: 'country' },
                { label: 'Postal Code', key: 'postalCode' },
                { label: 'Profession', key: 'profession' },
              ].map(field => (
                <div key={field.key}>
                  <Label className="text-slate-300 text-sm">{field.label}</Label>
                  <Input
                    value={(editForm as any)[field.key] || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
              ))}
              <div>
                <Label className="text-slate-300 text-sm">Verified Status</Label>
                <Select value={editForm.isVerified ? 'true' : 'false'}
                  onValueChange={v => setEditForm(prev => ({ ...prev, isVerified: v === 'true' }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="true">Verified</SelectItem>
                    <SelectItem value="false">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Account Status</Label>
                <Select value={editForm.isActive ? 'true' : 'false'}
                  onValueChange={v => setEditForm(prev => ({ ...prev, isActive: v === 'true' }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex gap-3 mt-2">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => selectedCustomer && updateCustomerMutation.mutate({ id: selectedCustomer.id, updates: editForm })}
                  disabled={updateCustomerMutation.isPending}>
                  {updateCustomerMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Edit Transaction Dialog ──────────────────────────────────────── */}
      <Dialog open={showTxEdit} onOpenChange={setShowTxEdit}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Transaction #{selectedTx?.id}</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="bg-slate-700 p-3 rounded">
                <p className="text-slate-300 text-sm">Amount: <span className="text-white font-bold">${selectedTx.amount}</span></p>
                <p className="text-slate-300 text-sm">Type: <span className="text-white">{selectedTx.type}</span></p>
                <p className="text-slate-300 text-sm">Description: <span className="text-white">{selectedTx.description || 'N/A'}</span></p>
              </div>
              <div>
                <Label className="text-slate-300">Update Status</Label>
                <Select value={txNewStatus} onValueChange={setTxNewStatus}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600"
                  onClick={() => selectedTx && updateTxMutation.mutate({ id: selectedTx.id, status: txNewStatus })}
                  disabled={updateTxMutation.isPending}>
                  Update Status
                </Button>
                {(selectedTx.status === 'pending' || selectedTx.status === 'processing') && (
                  <>
                    <Button className="bg-green-600"
                      onClick={() => { approveTxMutation.mutate(selectedTx.id); setShowTxEdit(false); }}>
                      Approve
                    </Button>
                    <Button className="bg-red-600"
                      onClick={() => { rejectTxMutation.mutate(selectedTx.id); setShowTxEdit(false); }}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Create Transaction Dialog ────────────────────────────────────── */}
      <Dialog open={showCreateTx} onOpenChange={setShowCreateTx}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Create Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Customer</Label>
              <Select value={newTx.customerId} onValueChange={v => setNewTx(p => ({ ...p, customerId: v }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white max-h-48 overflow-y-auto">
                  {(customers as Customer[]).map((c: Customer) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.fullName || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Type</Label>
              <Select value={newTx.type} onValueChange={v => setNewTx(p => ({ ...p, type: v }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  <SelectItem value="credit">Credit (Add to balance)</SelectItem>
                  <SelectItem value="debit">Debit (Remove from balance)</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="interest">Interest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Amount (USD)</Label>
              <Input type="number" placeholder="0.00" value={newTx.amount}
                onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Input placeholder="Transaction description..." value={newTx.description}
                onChange={e => setNewTx(p => ({ ...p, description: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white mt-1" />
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => createTxMutation.mutate(newTx)}
              disabled={createTxMutation.isPending || !newTx.customerId || !newTx.amount || !newTx.description}>
              {createTxMutation.isPending ? 'Creating...' : 'Create Transaction'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
