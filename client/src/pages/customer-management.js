import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Edit3, UserCheck, AlertTriangle, Save, X } from "lucide-react";
import { useOnlineUsers } from "@/hooks/usePresence";
export default function CustomerManagement() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState(new Set());
    // Subscribe to real-time presence updates
    useOnlineUsers((onlineUsers) => {
        const userIds = new Set(onlineUsers.map((u) => u.user_id));
        setOnlineUserIds(userIds);
    });
    // Fetch customers
    const { data: customersData = [], isLoading } = useQuery({
        queryKey: ["/api/admin/customers"],
        enabled: user?.role === "admin"
    });
    // Merge customer data with real-time online status
    const customers = customersData.map(customer => ({
        ...customer,
        isOnline: onlineUserIds.has(customer.id)
    }));
    // Update customer mutation
    const updateCustomerMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest(`/api/admin/customers/${data.customerId}`, "PUT", data.updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
            setShowEditDialog(false);
            setEditingCustomer(null);
            toast({
                title: "Success",
                description: "Customer information updated successfully"
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update customer information",
                variant: "destructive"
            });
        }
    });
    // Verify customer mutation
    const verifyCustomerMutation = useMutation({
        mutationFn: async (customerId) => {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch(`/api/admin/customers/${customerId}/verify`, {
                method: "POST"
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
            toast({
                title: "Success",
                description: "Customer verification status updated"
            });
        }
    });
    // Filter customers based on search
    const filteredCustomers = customers.filter((customer) => customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.accountNumber.includes(searchTerm) ||
        customer.phone.includes(searchTerm));
    const handleEditCustomer = (customer) => {
        setEditingCustomer({ ...customer });
        setShowEditDialog(true);
    };
    const handleSaveCustomer = () => {
        if (!editingCustomer)
            return;
        updateCustomerMutation.mutate({
            customerId: editingCustomer.id,
            updates: editingCustomer
        });
    };
    const handleVerifyCustomer = (customerId) => {
        verifyCustomerMutation.mutate(customerId);
    };
    if (user?.role !== "admin") {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: user }), _jsx("div", { className: "container mx-auto px-4 py-8", children: _jsx(Card, { children: _jsx(CardContent, { className: "flex items-center justify-center h-32", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertTriangle, { className: "w-12 h-12 text-yellow-500 mx-auto mb-2" }), _jsx("p", { className: "text-gray-600", children: "Access Denied - Admin Only" })] }) }) }) })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Customer Management" }), _jsx("p", { className: "text-gray-600", children: "Manage customer information and verification status" })] }), _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { placeholder: "Search customers by name, email, account number, or phone...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] }) }) }), _jsx("div", { className: "grid gap-4", children: isLoading ? (_jsx(Card, { children: _jsx(CardContent, { className: "flex items-center justify-center h-32", children: _jsx("p", { className: "text-gray-600", children: "Loading customers..." }) }) })) : filteredCustomers.length === 0 ? (_jsx(Card, { children: _jsx(CardContent, { className: "flex items-center justify-center h-32", children: _jsx("p", { className: "text-gray-600", children: "No customers found" }) }) })) : (filteredCustomers.map((customer) => (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold", children: customer.fullName }), _jsx(Badge, { variant: customer.isVerified ? "default" : "secondary", children: customer.isVerified ? "Verified" : "Unverified" }), _jsx(Badge, { variant: customer.isOnline ? "default" : "outline", children: customer.isOnline ? "Online" : "Offline" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600", children: [_jsxs("div", { children: [_jsx("strong", { children: "Email:" }), " ", customer.email] }), _jsxs("div", { children: [_jsx("strong", { children: "Phone:" }), " ", customer.phone] }), _jsxs("div", { children: [_jsx("strong", { children: "Account:" }), " ", customer.accountNumber] }), _jsxs("div", { children: [_jsx("strong", { children: "Balance:" }), " $", customer.balance?.toLocaleString() || "0"] }), _jsxs("div", { children: [_jsx("strong", { children: "Profession:" }), " ", customer.profession] }), _jsxs("div", { children: [_jsx("strong", { children: "Location:" }), " ", customer.city, ", ", customer.country] }), _jsxs("div", { children: [_jsx("strong", { children: "ID Type:" }), " ", customer.idType] }), _jsxs("div", { children: [_jsx("strong", { children: "Joined:" }), " ", new Date(customer.createdAt).toLocaleDateString()] })] })] }), _jsxs("div", { className: "flex gap-2 ml-4", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditCustomer(customer), children: [_jsx(Edit3, { className: "w-4 h-4 mr-1" }), "Edit"] }), !customer.isVerified && (_jsxs(Button, { variant: "default", size: "sm", onClick: () => handleVerifyCustomer(customer.id), disabled: verifyCustomerMutation.isPending, children: [_jsx(UserCheck, { className: "w-4 h-4 mr-1" }), "Verify"] }))] })] }) }) }, customer.id)))) }), _jsx(Dialog, { open: showEditDialog, onOpenChange: setShowEditDialog, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Edit Customer Information" }) }), editingCustomer && (_jsxs(Tabs, { defaultValue: "personal", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "personal", children: "Personal" }), _jsx(TabsTrigger, { value: "contact", children: "Contact" }), _jsx(TabsTrigger, { value: "financial", children: "Financial" }), _jsx(TabsTrigger, { value: "verification", children: "Verification" })] }), _jsx(TabsContent, { value: "personal", className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "fullName", children: "Full Name" }), _jsx(Input, { id: "fullName", value: editingCustomer.fullName, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    fullName: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "username", children: "Username" }), _jsx(Input, { id: "username", value: editingCustomer.username, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    username: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "profession", children: "Profession" }), _jsx(Input, { id: "profession", value: editingCustomer.profession, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    profession: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "annualIncome", children: "Annual Income" }), _jsxs(Select, { value: editingCustomer.annualIncome, onValueChange: (value) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    annualIncome: value
                                                                }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "under_25k", children: "Under $25,000" }), _jsx(SelectItem, { value: "25k_50k", children: "$25,000 - $50,000" }), _jsx(SelectItem, { value: "50k_100k", children: "$50,000 - $100,000" }), _jsx(SelectItem, { value: "100k_250k", children: "$100,000 - $250,000" }), _jsx(SelectItem, { value: "250k_500k", children: "$250,000 - $500,000" }), _jsx(SelectItem, { value: "over_500k", children: "Over $500,000" })] })] })] })] }) }), _jsx(TabsContent, { value: "contact", className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", value: editingCustomer.email, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    email: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: "Phone" }), _jsx(Input, { id: "phone", value: editingCustomer.phone, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    phone: e.target.value
                                                                }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { htmlFor: "address", children: "Address" }), _jsx(Textarea, { id: "address", value: editingCustomer.address, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    address: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "city", children: "City" }), _jsx(Input, { id: "city", value: editingCustomer.city, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    city: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "state", children: "State/Province" }), _jsx(Input, { id: "state", value: editingCustomer.state, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    state: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "country", children: "Country" }), _jsx(Input, { id: "country", value: editingCustomer.country, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    country: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "postalCode", children: "Postal Code" }), _jsx(Input, { id: "postalCode", value: editingCustomer.postalCode, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    postalCode: e.target.value
                                                                }) })] })] }) }), _jsx(TabsContent, { value: "financial", className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "accountNumber", children: "Account Number" }), _jsx(Input, { id: "accountNumber", value: editingCustomer.accountNumber, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    accountNumber: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "accountId", children: "Account ID" }), _jsx(Input, { id: "accountId", value: editingCustomer.accountId, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    accountId: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "balance", children: "Account Balance" }), _jsx(Input, { id: "balance", type: "number", value: editingCustomer.balance, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    balance: parseFloat(e.target.value) || 0
                                                                }) })] })] }) }), _jsx(TabsContent, { value: "verification", className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "idType", children: "ID Type" }), _jsxs(Select, { value: editingCustomer.idType, onValueChange: (value) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    idType: value
                                                                }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "passport", children: "Passport" }), _jsx(SelectItem, { value: "drivers_license", children: "Driver's License" }), _jsx(SelectItem, { value: "national_id", children: "National ID" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "idNumber", children: "ID Number" }), _jsx(Input, { id: "idNumber", value: editingCustomer.idNumber, onChange: (e) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    idNumber: e.target.value
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "isVerified", children: "Verification Status" }), _jsxs(Select, { value: editingCustomer.isVerified ? "verified" : "unverified", onValueChange: (value) => setEditingCustomer({
                                                                    ...editingCustomer,
                                                                    isVerified: value === "verified"
                                                                }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "verified", children: "Verified" }), _jsx(SelectItem, { value: "unverified", children: "Unverified" })] })] })] })] }) }), _jsxs("div", { className: "flex justify-end gap-2 mt-6", children: [_jsxs(Button, { variant: "outline", onClick: () => setShowEditDialog(false), children: [_jsx(X, { className: "w-4 h-4 mr-1" }), "Cancel"] }), _jsxs(Button, { onClick: handleSaveCustomer, disabled: updateCustomerMutation.isPending, children: [_jsx(Save, { className: "w-4 h-4 mr-1" }), updateCustomerMutation.isPending ? "Saving..." : "Save Changes"] })] })] }))] }) })] })] }));
}
