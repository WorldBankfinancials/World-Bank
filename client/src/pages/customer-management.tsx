import type { User } from "@shared/schema";
import { useState, useEffect } from "react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Edit3, UserCheck, AlertTriangle, Save, X } from "lucide-react";
import { useOnlineUsers } from "@/hooks/usePresence";


interface Customer {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  profession: string;
  annualIncome: string;
  idType: string;
  idNumber: string;
  isVerified: boolean;
  isOnline: boolean;
  accountNumber: string;
  accountId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  // Subscribe to real-time presence updates
  useOnlineUsers((onlineUsers) => {
    const userIds = new Set(onlineUsers.map((u: any) => u.user_id));
    setOnlineUserIds(userIds);
  });

  // Fetch customers
  const { data: customersData = [], isLoading } = useQuery<Customer[]>({
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
    mutationFn: async (data: { customerId: number; updates: Partial<Customer> }) => {
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer information",
        variant: "destructive"
      });
    }
  });

  // Verify customer mutation
  const verifyCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
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
  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.accountNumber.includes(searchTerm) ||
    customer.phone.includes(searchTerm)
  );

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setShowEditDialog(true);
  };

  const handleSaveCustomer = () => {
    if (!editingCustomer) return;
    
    updateCustomerMutation.mutate({
      customerId: editingCustomer.id,
      updates: editingCustomer
    });
  };

  const handleVerifyCustomer = (customerId: number) => {
    verifyCustomerMutation.mutate(customerId);
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-600">Access Denied - Admin Only</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage customer information and verification status</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers by name, email, account number, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-600">Loading customers...</p>
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-600">No customers found</p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer: Customer) => (
              <Card key={customer.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{customer.fullName}</h3>
                        <Badge variant={customer.isVerified ? "default" : "secondary"}>
                          {customer.isVerified ? "Verified" : "Unverified"}
                        </Badge>
                        <Badge variant={customer.isOnline ? "default" : "outline"}>
                          {customer.isOnline ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Email:</strong> {customer.email}
                        </div>
                        <div>
                          <strong>Phone:</strong> {customer.phone}
                        </div>
                        <div>
                          <strong>Account:</strong> {customer.accountNumber}
                        </div>
                        <div>
                          <strong>Balance:</strong> ${customer.balance?.toLocaleString() || "0"}
                        </div>
                        <div>
                          <strong>Profession:</strong> {customer.profession}
                        </div>
                        <div>
                          <strong>Location:</strong> {customer.city}, {customer.country}
                        </div>
                        <div>
                          <strong>ID Type:</strong> {customer.idType}
                        </div>
                        <div>
                          <strong>Joined:</strong> {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      {!customer.isVerified && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleVerifyCustomer(customer.id)}
                          disabled={verifyCustomerMutation.isPending}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Customer Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Customer Information</DialogTitle>
            </DialogHeader>
            
            {editingCustomer && (
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="verification">Verification</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={editingCustomer.fullName}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          fullName: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={editingCustomer.username}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          username: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="profession">Profession</Label>
                      <Input
                        id="profession"
                        value={editingCustomer.profession}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          profession: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="annualIncome">Annual Income</Label>
                      <Select
                        value={editingCustomer.annualIncome}
                        onValueChange={(value) => setEditingCustomer({
                          ...editingCustomer,
                          annualIncome: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under_25k">Under $25,000</SelectItem>
                          <SelectItem value="25k_50k">$25,000 - $50,000</SelectItem>
                          <SelectItem value="50k_100k">$50,000 - $100,000</SelectItem>
                          <SelectItem value="100k_250k">$100,000 - $250,000</SelectItem>
                          <SelectItem value="250k_500k">$250,000 - $500,000</SelectItem>
                          <SelectItem value="over_500k">Over $500,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editingCustomer.email}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          email: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editingCustomer.phone}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          phone: e.target.value
                        })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={editingCustomer.address}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editingCustomer.city}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          city: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={editingCustomer.state}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          state: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={editingCustomer.country}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          country: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={editingCustomer.postalCode}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          postalCode: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={editingCustomer.accountNumber}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          accountNumber: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountId">Account ID</Label>
                      <Input
                        id="accountId"
                        value={editingCustomer.accountId}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          accountId: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="balance">Account Balance</Label>
                      <Input
                        id="balance"
                        type="number"
                        value={editingCustomer.balance}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          balance: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="verification" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="idType">ID Type</Label>
                      <Select
                        value={editingCustomer.idType}
                        onValueChange={(value) => setEditingCustomer({
                          ...editingCustomer,
                          idType: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="drivers_license">Driver's License</SelectItem>
                          <SelectItem value="national_id">National ID</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="idNumber">ID Number</Label>
                      <Input
                        id="idNumber"
                        value={editingCustomer.idNumber}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          idNumber: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="isVerified">Verification Status</Label>
                      <Select
                        value={editingCustomer.isVerified ? "verified" : "unverified"}
                        onValueChange={(value) => setEditingCustomer({
                          ...editingCustomer,
                          isVerified: value === "verified"
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="unverified">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveCustomer}
                    disabled={updateCustomerMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {updateCustomerMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
