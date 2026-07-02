import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, DollarSign, Search } from "lucide-react";

interface Customer {
  id: number;
  fullName: string;
  email: string;
  accountNumber: string;
  balance: number;
}

export default function FundManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/admin/customers'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/customers');
      return response.ok ? response.json() : [];
    }
  });

  const handleAdjustBalance = async (type: 'add' | 'subtract') => {
    if (!selectedCustomer || !adjustAmount) {
      toast({
        title: "Missing Information",
        description: "Please select a customer and enter an amount.",
        variant: "destructive",
      });
      return;
    }

    const parsedAmount = parseFloat(adjustAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/customers/${selectedCustomer.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          type: type === 'add' ? 'deposit' : 'withdrawal'
        })
      });

      if (!response.ok) throw new Error('Failed to adjust balance');

      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      toast({
        title: "Success",
        description: `Balance ${type === 'add' ? 'added' : 'subtracted'} successfully`,
      });
      setAdjustAmount("");
      setSelectedCustomer(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to adjust balance",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fund Management</h1>
          <p className="text-gray-600">Manage customer funds and balances</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Find Customer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        {selectedCustomer && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedCustomer.fullName}</span>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCustomer(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Account</Label>
                  <p className="font-medium">{selectedCustomer.accountNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Balance</Label>
                  <p className="font-medium text-green-600">${selectedCustomer.balance}</p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label>Adjust Amount ($)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAdjustBalance('add')}
                    className="flex-1 bg-green-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Funds
                  </Button>
                  <Button
                    onClick={() => handleAdjustBalance('subtract')}
                    className="flex-1 bg-red-600 text-white"
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Subtract Funds
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span>Customers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(customers as Customer[]).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No customers found</p>
              ) : (
                (customers as Customer[]).map((customer: Customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{customer.fullName}</div>
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      </div>
                      <Badge variant="outline">${customer.balance}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
