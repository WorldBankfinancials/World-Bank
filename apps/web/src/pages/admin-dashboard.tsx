import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  FileText,
  Globe,
  Shield,
  UserCog,
  Upload,
  Image,
  Search,
  Edit3,
  Verified,
  Camera,
  KeyRound,
  Trash2,
  RotateCcw,
  Crown
} from "lucide-react";
import Header from "@/components/Header";
import { apiRequest } from "@/lib/queryClient";
import type { Transaction, User } from "@packages/shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import { CustomerData } from "@/types";


interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  description: string;
  priority: string;
  status: string;
  category?: string;
  assignedTo?: number;
  adminNotes?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface PendingTransfer extends Transaction {
  userInfo?: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("transfers");
  const [adminNotes, setAdminNotes] = useState<{ [key: number]: string }>({});
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Admin user-management + transaction-reversal dialog state
  const [resetPasswordTarget, setResetPasswordTarget] = useState<CustomerData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [setRoleTarget, setSetRoleTarget] = useState<CustomerData | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("customer");
  const [deleteUserTarget, setDeleteUserTarget] = useState<CustomerData | null>(null);
  const [reverseTxnTarget, setReverseTxnTarget] = useState<Transaction | null>(null);
  const [reverseReason, setReverseReason] = useState("");

  // Real-time updates via Supabase Realtime
  useRealtimeTransactions();

  // Fetch real customer data from API
  const { data: customers = [], isLoading: customersLoading } = useQuery<CustomerData[]>({
    queryKey: ['/api/admin/customers'],
    staleTime: 30000,
  });

  // Fetch pending transfers
  const { data: pendingTransfers = [], isLoading: transfersLoading } = useQuery<PendingTransfer[]>({
    queryKey: ['/api/admin/pending-transfers'],
  });

  // Fetch support tickets
  const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/admin/support-tickets'],
  });

  // Fetch admin statistics
  const { data: adminStats = {} } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  // Fetch all transactions (admin) for the reversal feature
  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transaction-routes'],
    staleTime: 30000,
  });


  // Profile picture upload mutation
  const uploadProfilePicMutation = useMutation({
    mutationFn: async ({ userId, imageFile }: { userId: number | string; imageFile: File }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const formData = new FormData();
      formData.append('profilePic', imageFile);
      
      const response = await authenticatedFetch(`/api/admin/users/${userId}/profile-photo`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
    },
  });

  // Customer query response mutation
  const respondToQueryMutation = useMutation({
    mutationFn: async ({ ticketId, response }: { ticketId: number; response: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const resp = await authenticatedFetch(`/api/admin/tickets/${ticketId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response }),
        headers: { 'Content-Type': 'application/json' },
      });
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
    },
  });

  // Customer verification mutation
  const verifyCustomerMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: number | string; verified: boolean }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/customers/${userId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ verified }),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
    },
  });

  // Transfer approval mutation
  const approveTransferMutation = useMutation({
    mutationFn: async ({ transferId, notes }: { transferId: number; notes?: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/transfers/${transferId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
  });

  // Transfer rejection mutation
  const rejectTransferMutation = useMutation({
    mutationFn: async ({ transferId, notes }: { transferId: number; notes: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/transfers/${transferId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
  });

  // Support ticket update mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, status, resolution }: { ticketId: number; status: string; resolution?: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/support-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
    },
  });

  // Admin: reset a user's password
  const resetUserPasswordMutation = useMutation({
    mutationFn: async ({ email, newPassword }: { email: string; newPassword: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to reset password (${response.status})`);
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Password reset",
        description: `Password updated for ${variables.email}.`,
      });
      setResetPasswordTarget(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Admin: set a user's role (customer/admin)
  const setUserRoleMutation = useMutation({
    mutationFn: async ({ userId, email, role }: { userId?: string | number; email?: string; role: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/set-user-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, role }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to set role (${response.status})`);
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Role updated",
        description: `User role set to ${variables.role}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      setSetRoleTarget(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to set role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Admin: delete a user by email
  const deleteUserMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/delete-user/${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to delete user (${response.status})`);
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "User deleted",
        description: `${variables.email} has been removed from authentication.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setDeleteUserTarget(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Admin: reverse a transaction
  const reverseTransactionMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string | number; reason?: string }) => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/transactions/${id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to reverse transaction (${response.status})`);
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Transaction reversed",
        description: `Transaction #${variables.id} has been reversed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transaction-routes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setReverseTxnTarget(null);
      setReverseReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reverse transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (transferId: any) => {
    approveTransferMutation.mutate({
      transferId,
      notes: (adminNotes as any)[transferId] || undefined
    });
    setAdminNotes(prev => ({ ...prev, [transferId]: '' }));
  };

  const handleReject = (transferId: any) => {
    const notes = (adminNotes as any)[transferId];
    if (!notes) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this transfer.',
        variant: 'destructive',
      });
      return;
    }
    rejectTransferMutation.mutate({ transferId, notes });
    setAdminNotes(prev => ({ ...prev, [transferId]: '' }));
  };

  const handleTicketUpdate = (ticketId: number, status: string, resolution?: string) => {
    updateTicketMutation.mutate({ ticketId, status, resolution });
  };

  const adminUser: any = {
    id: 1,
    username: "admin",
    firstName: "World",
    lastName: "Bank",
    email: "admin@worldbank.com",
    password: "",
    accountNumber: "ADMIN-001",
    accountId: 1,
    profession: "Banking Administrator",
    isVerified: true,
    role: "admin",
    fullName: "World Bank",
    idType: null,
    idNumber: null,
    transferPin: null,
    annualIncome: null,
    address: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    dateOfBirth: null,
    mothersMaidenName: null,
    citizenship: null,
    taxId: null,
    industry: null,
    phone: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: null
  };

  // Show loading state
  if (customersLoading || transfersLoading || ticketsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={adminUser} />
      
      <div className="px-4 py-6">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Manage transfers and customer support</p>
          </div>
          <div className="flex space-x-2">
            <Badge className="bg-red-100 text-red-800">
              <Shield className="w-3 h-3 mr-1" />
              Admin Access
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              <Globe className="w-3 h-3 mr-1" />
              Global Operations
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-xl font-bold">{pendingTransfers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Customers</p>
                  <p className="text-xl font-bold">{(adminStats as any)?.totalCustomers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Today's Volume</p>
                  <p className="text-xl font-bold">${(adminStats as any)?.todayVolume || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Open Tickets</p>
                  <p className="text-xl font-bold">{supportTickets.filter(t => t.status === 'open').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/customer-management")}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <UserCog className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Customer Management</h3>
                  <p className="text-sm text-gray-600">Edit customer information</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/security-center")}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Security Center</h3>
                  <p className="text-sm text-gray-600">Monitor security events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/statements-reports")}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Reports</h3>
                  <p className="text-sm text-gray-600">Generate admin reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transfers">Transfer Approvals</TabsTrigger>
            <TabsTrigger value="support">Customer Support</TabsTrigger>
            <TabsTrigger value="profiles">Profile Management</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Transfer Approvals Tab */}
          <TabsContent value="transfers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Pending International Transfers</span>
                  <Badge variant="outline">{pendingTransfers.length} pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transfersLoading ? (
                  <div className="text-center py-8">Loading transfers...</div>
                ) : pendingTransfers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No pending transfers</div>
                ) : (
                  <div className="space-y-4">
                    {pendingTransfers.map((transfer) => (
                      <div key={transfer.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">Transfer #{transfer.id}</h3>
                            <p className="text-sm text-gray-600">Amount: ${transfer.amount} {transfer.currency}</p>
                            <p className="text-sm text-gray-600">Type: {transfer.type}</p>
                            <p className="text-sm text-gray-600">Description: {transfer.description}</p>
                            <p className="text-sm text-gray-600">Status: {transfer.status}</p>
                            <p className="text-sm text-gray-600">Reference: {transfer.referenceNumber}</p>
                            <p className="text-sm text-gray-600">Fee: ${transfer.fee}</p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Review
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <Label htmlFor={`notes-${transfer.id}`}>Admin Notes</Label>
                          <Textarea
                            id={`notes-${transfer.id}`}
                            placeholder="Add notes about this transfer..."
                            value={(adminNotes as any)[transfer.id] || ''}
                            onChange={(e) => setAdminNotes(prev => ({ ...prev, [transfer.id]: e.target.value } as any))}
                            className="mt-1"
                          />
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            onClick={() => handleApprove(transfer.id)}
                            disabled={approveTransferMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Transfer
                          </Button>
                          <Button
                            onClick={() => handleReject(transfer.id)}
                            disabled={rejectTransferMutation.isPending}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Transfer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Support Tab */}
          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Support Tickets</span>
                  <Badge variant="outline">{supportTickets.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="text-center py-8">Loading tickets...</div>
                ) : supportTickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No support tickets</div>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">Ticket #{ticket.id}</h3>
                            <p className="text-sm text-gray-600">Subject: {ticket.subject}</p>
                            <p className="text-sm text-gray-600">Category: {ticket.category || 'General'}</p>
                            <p className="text-sm text-gray-600 mt-2">{ticket.description}</p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Badge className={
                              ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                              ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {ticket.status}
                            </Badge>
                            <Badge variant="outline" className={
                              ticket.priority === 'urgent' ? 'border-red-500 text-red-700' :
                              ticket.priority === 'high' ? 'border-orange-500 text-orange-700' :
                              'border-gray-500 text-gray-700'
                            }>
                              {ticket.priority} priority
                            </Badge>
                          </div>
                        </div>

                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => handleTicketUpdate(ticket.id, 'in_progress')}
                              disabled={updateTicketMutation.isPending}
                              variant="outline"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              In Progress
                            </Button>
                            <Button
                              onClick={() => handleTicketUpdate(ticket.id, 'resolved', 'Issue resolved by admin')}
                              disabled={updateTicketMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Management Tab */}
          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCog className="w-5 h-5" />
                  <span>Customer Profile Management</span>
                  <Badge variant="outline">{customers.length} customers</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="text-center py-8">Loading customers...</div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No customers found</div>
                ) : (
                  <div className="space-y-4">
                    {customers.map((customer) => (
                      <div key={customer.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              {customer.avatarUrl ? (
                                <img 
                                  src={customer.avatarUrl} 
                                  alt={customer.fullName}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserCog className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700">
                                <Camera className="w-3 h-3" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      uploadProfilePicMutation.mutate({ 
                                        userId: customer.id, 
                                        imageFile: file 
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{customer.fullName}</h3>
                              <p className="text-sm text-gray-600">Email: {customer.email || customer.username || 'Not provided'}</p>
                              <p className="text-sm text-gray-600">Phone: {customer.phone || 'Not provided'}</p>
                              <p className="text-sm text-gray-600">Account: {customer.accountNumber || customer.accountId || 'Not specified'}</p>
                              <p className="text-sm text-gray-600">Profession: {customer.profession || 'Not specified'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {customer.isVerified ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Verified className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                            {customer.isOnline && (
                              <Badge className="bg-blue-100 text-blue-800">Online</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            onClick={() => verifyCustomerMutation.mutate({ 
                              userId: customer.id, 
                              verified: !customer.isVerified 
                            })}
                            disabled={verifyCustomerMutation.isPending}
                            className={customer.isVerified ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}
                          >
                            <Verified className="w-4 h-4 mr-2" />
                            {customer.isVerified ? 'Remove Verification' : 'Verify Customer'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setLocation(`/customer-management?customer=${customer.id}`)}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setResetPasswordTarget(customer);
                              setNewPassword("");
                            }}
                          >
                            <KeyRound className="w-4 h-4 mr-2" />
                            Reset Password
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSetRoleTarget(customer);
                              setSelectedRole(customer.role === 'admin' ? 'admin' : 'customer');
                            }}
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Set Role
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => setDeleteUserTarget(customer)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions tab — transaction reversal feature */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  All Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading transactions…</div>
                ) : allTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No transactions found.</div>
                ) : (
                  <div className="space-y-3">
                    {allTransactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex flex-col gap-3 border rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">#{txn.id}</span>
                            <Badge variant="outline">{txn.transactionType || txn.type || 'transfer'}</Badge>
                            <Badge
                              variant={
                                txn.status === 'reversed' ? 'destructive'
                                  : txn.status === 'completed' ? 'default'
                                  : 'secondary'
                              }
                            >
                              {txn.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {txn.amount} {txn.currency}
                            {txn.description ? ` — ${txn.description}` : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Ref: {txn.referenceNumber || '—'}
                            {txn.createdAt ? ` • ${new Date(String(txn.createdAt)).toLocaleString()}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            disabled={txn.status === 'reversed' || reverseTransactionMutation.isPending}
                            onClick={() => {
                              setReverseTxnTarget(txn);
                              setReverseReason("");
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reverse
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Password dialog */}
        <Dialog
          open={!!resetPasswordTarget}
          onOpenChange={(open) => {
            if (!open) {
              setResetPasswordTarget(null);
              setNewPassword("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset user password</DialogTitle>
              <DialogDescription>
                Set a new password for{" "}
                <span className="font-medium text-foreground">{resetPasswordTarget?.email}</span>.
                Must be at least 12 characters with uppercase, lowercase, and a number.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordTarget(null);
                  setNewPassword("");
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!newPassword || resetUserPasswordMutation.isPending}
                onClick={() => {
                  if (!resetPasswordTarget?.email) return;
                  resetUserPasswordMutation.mutate({
                    email: resetPasswordTarget.email,
                    newPassword,
                  });
                }}
              >
                {resetUserPasswordMutation.isPending ? "Resetting…" : "Reset Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Set Role dialog */}
        <Dialog
          open={!!setRoleTarget}
          onOpenChange={(open) => {
            if (!open) setSetRoleTarget(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set user role</DialogTitle>
              <DialogDescription>
                Change the role for{" "}
                <span className="font-medium text-foreground">{setRoleTarget?.email}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="role-select">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSetRoleTarget(null)}>
                Cancel
              </Button>
              <Button
                disabled={setUserRoleMutation.isPending}
                onClick={() => {
                  if (!setRoleTarget) return;
                  setUserRoleMutation.mutate({
                    userId: setRoleTarget.id,
                    email: setRoleTarget.email,
                    role: selectedRole,
                  });
                }}
              >
                {setUserRoleMutation.isPending ? "Updating…" : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User confirmation */}
        <AlertDialog
          open={!!deleteUserTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteUserTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete user?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove{" "}
                <span className="font-medium text-foreground">{deleteUserTarget?.email}</span> from the
                authentication system. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteUserMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  if (!deleteUserTarget?.email) return;
                  deleteUserMutation.mutate({ email: deleteUserTarget.email });
                }}
              >
                {deleteUserMutation.isPending ? "Deleting…" : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reverse Transaction confirmation */}
        <AlertDialog
          open={!!reverseTxnTarget}
          onOpenChange={(open) => {
            if (!open) {
              setReverseTxnTarget(null);
              setReverseReason("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reverse transaction?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reverse transaction{" "}
                <span className="font-medium text-foreground">#{reverseTxnTarget?.id}</span> and refund the
                sender. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="reverse-reason">Reason (optional)</Label>
              <Textarea
                id="reverse-reason"
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="Reason for reversal"
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={reverseTransactionMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={reverseTransactionMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  if (!reverseTxnTarget?.id) return;
                  reverseTransactionMutation.mutate({
                    id: reverseTxnTarget.id,
                    reason: reverseReason || undefined,
                  });
                }}
              >
                {reverseTransactionMutation.isPending ? "Reversing…" : "Reverse Transaction"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
