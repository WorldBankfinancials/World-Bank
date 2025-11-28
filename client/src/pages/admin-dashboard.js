import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Users, CreditCard, AlertTriangle, MessageSquare, FileText, Globe, Shield, UserCog, Edit3, Verified, Camera } from "lucide-react";
import Header from "@/components/Header";
import { useRealtimeTransactions, useRealtimeSupportTickets } from "@/hooks/useRealtimeTransactions";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
export default function AdminDashboard() {
    const { toast } = useToast();
    const [selectedTab, setSelectedTab] = useState("transfers");
    const [adminNotes, setAdminNotes] = useState({});
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    // Enable real-time updates for transactions and support tickets
    useRealtimeTransactions(true);
    useRealtimeSupportTickets(true);
    // Fetch real customer data from API
    const { data: customers = [], isLoading: customersLoading } = useQuery({
        queryKey: ['/api/admin/customers'],
        staleTime: 30000,
    });
    // Fetch pending transfers
    const { data: pendingTransfers = [], isLoading: transfersLoading } = useQuery({
        queryKey: ['/api/admin/pending-transfers'],
    });
    // Fetch support tickets
    const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery({
        queryKey: ['/api/admin/support-tickets'],
    });
    // Fetch admin statistics
    const { data: adminStats = {} } = useQuery({
        queryKey: ['/api/admin/stats'],
    });
    // Profile picture upload mutation
    const uploadProfilePicMutation = useMutation({
        mutationFn: async ({ userId, imageFile }) => {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const formData = new FormData();
            formData.append('profilePic', imageFile);
            const response = await authenticatedFetch(`/api/admin/customers/${userId}/profile-picture`, {
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
        mutationFn: async ({ ticketId, response }) => {
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
        mutationFn: async ({ userId, verified }) => {
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
        mutationFn: async ({ transferId, notes }) => {
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
        mutationFn: async ({ transferId, notes }) => {
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
        mutationFn: async ({ ticketId, status, resolution }) => {
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
    const handleApprove = (transferId) => {
        approveTransferMutation.mutate({
            transferId,
            notes: adminNotes[transferId] || undefined
        });
        setAdminNotes(prev => ({ ...prev, [transferId]: '' }));
    };
    const handleReject = (transferId) => {
        const notes = adminNotes[transferId];
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
    const handleTicketUpdate = (ticketId, status, resolution) => {
        updateTicketMutation.mutate({ ticketId, status, resolution });
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: {
                    id: 1,
                    username: "admin",
                    fullName: "System Administrator",
                    accountNumber: "ADMIN-001",
                    accountId: "WB-ADMIN-001",
                    profession: "System Administrator",
                    isVerified: true,
                    isOnline: true,
                    avatarUrl: null
                } }), _jsxs("div", { className: "px-4 py-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Admin Dashboard" }), _jsx("p", { className: "text-sm text-gray-600", children: "Manage transfers and customer support" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Badge, { className: "bg-red-100 text-red-800", children: [_jsx(Shield, { className: "w-3 h-3 mr-1" }), "Admin Access"] }), _jsxs(Badge, { className: "bg-blue-100 text-blue-800", children: [_jsx(Globe, { className: "w-3 h-3 mr-1" }), "Global Operations"] })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Clock, { className: "w-5 h-5 text-orange-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Pending" }), _jsx("p", { className: "text-xl font-bold", children: pendingTransfers.length })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Users, { className: "w-5 h-5 text-blue-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Customers" }), _jsx("p", { className: "text-xl font-bold", children: adminStats?.totalCustomers || 0 })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(CreditCard, { className: "w-5 h-5 text-green-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Today's Volume" }), _jsxs("p", { className: "text-xl font-bold", children: ["$", adminStats?.todayVolume || 0] })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(MessageSquare, { className: "w-5 h-5 text-purple-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Open Tickets" }), _jsx("p", { className: "text-xl font-bold", children: supportTickets.filter(t => t.status === 'open').length })] })] }) }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", onClick: () => setLocation("/customer-management"), children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(UserCog, { className: "w-8 h-8 text-blue-600" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Customer Management" }), _jsx("p", { className: "text-sm text-gray-600", children: "Edit customer information" })] })] }) }) }), _jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Shield, { className: "w-8 h-8 text-green-600" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Security Center" }), _jsx("p", { className: "text-sm text-gray-600", children: "Monitor security events" })] })] }) }) }), _jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(FileText, { className: "w-8 h-8 text-purple-600" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Reports" }), _jsx("p", { className: "text-sm text-gray-600", children: "Generate admin reports" })] })] }) }) })] }), _jsxs(Tabs, { value: selectedTab, onValueChange: setSelectedTab, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "transfers", children: "Transfer Approvals" }), _jsx(TabsTrigger, { value: "support", children: "Customer Support" }), _jsx(TabsTrigger, { value: "profiles", children: "Profile Management" })] }), _jsx(TabsContent, { value: "transfers", className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Clock, { className: "w-5 h-5" }), _jsx("span", { children: "Pending International Transfers" }), _jsxs(Badge, { variant: "outline", children: [pendingTransfers.length, " pending"] })] }) }), _jsx(CardContent, { children: transfersLoading ? (_jsx("div", { className: "text-center py-8", children: "Loading transfers..." })) : pendingTransfers.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No pending transfers" })) : (_jsx("div", { className: "space-y-4", children: pendingTransfers.map((transfer) => (_jsxs("div", { className: "border rounded-lg p-4 bg-white", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-semibold text-lg", children: ["Transfer #", transfer.id] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["From: ", transfer.userInfo?.fullName || 'Unknown User'] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Amount: $", transfer.amount] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["To: ", transfer.recipientName] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Country: ", transfer.recipientCountry] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Bank: ", transfer.bankName] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["SWIFT: ", transfer.swiftCode] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Purpose: ", transfer.transferPurpose] })] }), _jsxs(Badge, { className: "bg-orange-100 text-orange-800", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), "Pending Review"] })] }), _jsxs("div", { className: "mb-4", children: [_jsx(Label, { htmlFor: `notes-${transfer.id}`, children: "Admin Notes" }), _jsx(Textarea, { id: `notes-${transfer.id}`, placeholder: "Add notes about this transfer...", value: adminNotes[transfer.id] || '', onChange: (e) => setAdminNotes(prev => ({ ...prev, [transfer.id]: e.target.value })), className: "mt-1" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs(Button, { onClick: () => handleApprove(transfer.id), disabled: approveTransferMutation.isPending, className: "bg-green-600 hover:bg-green-700 text-white", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Approve Transfer"] }), _jsxs(Button, { onClick: () => handleReject(transfer.id), disabled: rejectTransferMutation.isPending, variant: "destructive", children: [_jsx(XCircle, { className: "w-4 h-4 mr-2" }), "Reject Transfer"] })] })] }, transfer.id))) })) })] }) }), _jsx(TabsContent, { value: "support", className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(MessageSquare, { className: "w-5 h-5" }), _jsx("span", { children: "Support Tickets" }), _jsxs(Badge, { variant: "outline", children: [supportTickets.length, " total"] })] }) }), _jsx(CardContent, { children: ticketsLoading ? (_jsx("div", { className: "text-center py-8", children: "Loading tickets..." })) : supportTickets.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No support tickets" })) : (_jsx("div", { className: "space-y-4", children: supportTickets.map((ticket) => (_jsxs("div", { className: "border rounded-lg p-4 bg-white", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-semibold text-lg", children: ["Ticket #", ticket.id] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Subject: ", ticket.subject] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Category: ", ticket.category || 'General'] }), _jsx("p", { className: "text-sm text-gray-600 mt-2", children: ticket.description })] }), _jsxs("div", { className: "flex flex-col space-y-2", children: [_jsx(Badge, { className: ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                                                                                ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                                    'bg-green-100 text-green-800', children: ticket.status }), _jsxs(Badge, { variant: "outline", className: ticket.priority === 'urgent' ? 'border-red-500 text-red-700' :
                                                                                ticket.priority === 'high' ? 'border-orange-500 text-orange-700' :
                                                                                    'border-gray-500 text-gray-700', children: [ticket.priority, " priority"] })] })] }), ticket.status !== 'resolved' && ticket.status !== 'closed' && (_jsxs("div", { className: "flex space-x-3", children: [_jsxs(Button, { onClick: () => handleTicketUpdate(ticket.id, 'in_progress'), disabled: updateTicketMutation.isPending, variant: "outline", children: [_jsx(Clock, { className: "w-4 h-4 mr-2" }), "In Progress"] }), _jsxs(Button, { onClick: () => handleTicketUpdate(ticket.id, 'resolved', 'Issue resolved by admin'), disabled: updateTicketMutation.isPending, className: "bg-green-600 hover:bg-green-700 text-white", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Resolve"] })] }))] }, ticket.id))) })) })] }) }), _jsx(TabsContent, { value: "profiles", className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(UserCog, { className: "w-5 h-5" }), _jsx("span", { children: "Customer Profile Management" }), _jsxs(Badge, { variant: "outline", children: [customers.length, " customers"] })] }) }), _jsx(CardContent, { children: customersLoading ? (_jsx("div", { className: "text-center py-8", children: "Loading customers..." })) : customers.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No customers found" })) : (_jsx("div", { className: "space-y-4", children: customers.map((customer) => (_jsxs("div", { className: "border rounded-lg p-4 bg-white", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "relative", children: [customer.avatarUrl ? (_jsx("img", { src: customer.avatarUrl, alt: customer.fullName, className: "w-16 h-16 rounded-full object-cover" })) : (_jsx("div", { className: "w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center", children: _jsx(UserCog, { className: "w-8 h-8 text-gray-400" }) })), _jsxs("label", { className: "absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700", children: [_jsx(Camera, { className: "w-3 h-3" }), _jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                                                                                                const file = e.target.files?.[0];
                                                                                                if (file) {
                                                                                                    uploadProfilePicMutation.mutate({
                                                                                                        userId: customer.id,
                                                                                                        imageFile: file
                                                                                                    });
                                                                                                }
                                                                                            } })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg", children: customer.fullName }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Email: ", customer.email || customer.username || 'Not provided'] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Phone: ", customer.phone || 'Not provided'] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Account: ", customer.accountNumber || customer.accountId || 'Not specified'] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Profession: ", customer.profession || 'Not specified'] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [customer.isVerified ? (_jsxs(Badge, { className: "bg-green-100 text-green-800", children: [_jsx(Verified, { className: "w-3 h-3 mr-1" }), "Verified"] })) : (_jsxs(Badge, { className: "bg-yellow-100 text-yellow-800", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), "Unverified"] })), customer.isOnline && (_jsx(Badge, { className: "bg-blue-100 text-blue-800", children: "Online" }))] })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs(Button, { onClick: () => verifyCustomerMutation.mutate({
                                                                        userId: customer.id,
                                                                        verified: !customer.isVerified
                                                                    }), disabled: verifyCustomerMutation.isPending, className: customer.isVerified ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700", children: [_jsx(Verified, { className: "w-4 h-4 mr-2" }), customer.isVerified ? 'Remove Verification' : 'Verify Customer'] }), _jsxs(Button, { variant: "outline", onClick: () => setLocation(`/customer-management?customer=${customer.id}`), children: [_jsx(Edit3, { className: "w-4 h-4 mr-2" }), "Edit Profile"] })] })] }, customer.id))) })) })] }) })] })] })] }));
}
