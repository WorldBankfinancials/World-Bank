import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Camera
} from "lucide-react";
import Header from "@/components/Header";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Transaction, SupportTicket, User } from "@shared/schema";

interface PendingTransfer extends Transaction {
  userInfo?: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("transfers");
  const [adminNotes, setAdminNotes] = useState<{ [key: number]: string }>({});
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch pending transfers with real-time updates
  const { data: pendingTransfers = [], isLoading: transfersLoading, refetch: refetchTransfers } = useQuery<PendingTransfer[]>({
    queryKey: ['/api/admin/pending-transfers'],
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  // Fetch support tickets
  const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/admin/support-tickets'],
  });

  // Fetch admin statistics
  const { data: adminStats = {} } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  // Fetch customers dynamically
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/admin/customers'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Profile picture upload mutation
  const uploadProfilePicMutation = useMutation({
    mutationFn: async ({ userId, imageFile }: { userId: number; imageFile: File }) => {
      const formData = new FormData();
      formData.append('profilePic', imageFile);

      const response = await fetch(`/api/admin/customers/${userId}/profile-picture`, {
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
      return apiRequest(`/api/admin/tickets/${ticketId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
    },
  });

  // Customer verification mutation
  const verifyCustomerMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: number; verified: boolean }) => {
      return apiRequest(`/api/admin/customers/${userId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ verified }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
    },
  });

  // Transfer approval mutation
  const approveTransferMutation = useMutation({
    mutationFn: async ({ transferId, notes }: { transferId: number; notes?: string }) => {
      const response = await fetch(`/api/admin/transfers/${transferId}/approve`, {
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
      const response = await fetch(`/api/admin/transfers/${transferId}/reject`, {
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
      const response = await fetch(`/api/admin/support-tickets/${ticketId}`, {
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

  const handleApprove = (transferId: number) => {
    approveTransferMutation.mutate({
      transferId,
      notes: adminNotes[transferId] || undefined
    });
    setAdminNotes(prev => ({ ...prev, [transferId]: '' }));
  };

  const handleReject = (transferId: number) => {
    const notes = adminNotes[transferId];
    if (!notes) {
      alert('Please provide a reason for rejection');
      return;
    }
    rejectTransferMutation.mutate({ transferId, notes });
    setAdminNotes(prev => ({ ...prev, [transferId]: '' }));
  };

  const handleTicketUpdate = (ticketId: number, status: string, resolution?: string) => {
    updateTicketMutation.mutate({ ticketId, status, resolution });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={{
        id: 1,
        username: "admin",
        fullName: "System Administrator",
        accountNumber: "ADMIN-001",
        accountId: "WB-ADMIN-001",
        profession: "System Administrator",
        isVerified: true,
        isOnline: true,
        avatarUrl: null
      }} />

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
                  <p className="text-xl font-bold">{adminStats?.totalCustomers || 0}</p>
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
                  <p className="text-xl font-bold">${adminStats?.todayVolume || 0}</p>
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

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transfers">Transfer Approvals</TabsTrigger>
            <TabsTrigger value="support">Customer Support</TabsTrigger>
            <TabsTrigger value="profiles">Profile Management</TabsTrigger>
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
                            <p className="text-sm text-gray-600">From: {transfer.userInfo?.fullName || 'Unknown User'}</p>
                            <p className="text-sm text-gray-600">Amount: ${transfer.amount}</p>
                            <p className="text-sm text-gray-600">To: {transfer.recipientName}</p>
                            <p className="text-sm text-gray-600">Country: {transfer.recipientCountry}</p>
                            <p className="text-sm text-gray-600">Bank: {transfer.bankName}</p>
                            <p className="text-sm text-gray-600">SWIFT: {transfer.swiftCode}</p>
                            <p className="text-sm text-gray-600">Purpose: {transfer.transferPurpose}</p>
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
                            value={adminNotes[transfer.id] || ''}
                            onChange={(e) => setAdminNotes(prev => ({ ...prev, [transfer.id]: e.target.value }))}
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}