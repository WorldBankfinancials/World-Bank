import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Minus, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Search,
  Calendar,
  CreditCard
} from "lucide-react";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  category: string;
  reference: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
  customerName: string;
  customerId: number;
}

interface Customer {
  id: number;
  fullName: string;
  email: string;
  accountNumber: string;
  accountId: string;
  balance: number;
}

export default function FundManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");

  useEffect(() => {
    fetchCustomers();
    fetchTransactions();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      // Silent customer fetching
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      // console.error('Failed to fetch transactions:', error);
    }
  };

  const generateReference = () => {
    const prefix = transactionType === "credit" ? "CR" : "DR";
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  const handleAddFunds = async () => {
    if (!selectedCustomer || !amount || !description) {
      alert("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    
    try {
      const transactionData = {
        customerId: selectedCustomer.id,
        type: transactionType,
        amount: parseFloat(amount),
        description,
        category: category || "Manual Adjustment",
        reference: reference || generateReference(),
        status: "completed"
      };

      // Create transaction record
      const transactionResponse = await fetch('/api/admin/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });

      if (transactionResponse.ok) {
        // Update customer balance
        const balanceChange = transactionType === "credit" ? 
          parseFloat(amount) : -parseFloat(amount);
        
        const balanceResponse = await fetch('/api/admin/update-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: selectedCustomer.id,
            amount: balanceChange,
            description: `${transactionType.toUpperCase()}: ${description}`
          })
        });

        if (balanceResponse.ok) {
          // Reset form
          setAmount("");
          setDescription("");
          setCategory("");
          setReference("");
          
          // Refresh data
          fetchCustomers();
          fetchTransactions();
          
          // Update selected customer balance
          if (selectedCustomer) {
            setSelectedCustomer({
              ...selectedCustomer,
              balance: selectedCustomer.balance + balanceChange
            });
          }

          alert(`${transactionType === "credit" ? "Funds added" : "Funds deducted"} successfully!`);
        }
      }
    } catch (error) {
      // console.error('Failed to process transaction:', error);
      alert('Failed to process transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    const matchesDate = !dateFilter || transaction.createdAt.includes(dateFilter);
    
    return matchesSearch && matchesType && matchesDate;
  });

  const transactionCategories = [
    "Manual Adjustment",
    "Interest Payment",
    "Fee Refund",
    "Bonus Credit",
    "Account Correction",
    "Promotional Credit",
    "Administrative Fee",
    "Service Charge",
    "Penalty",
    "Maintenance Fee"
  ];

  const totalCredits = transactions
    .filter(t => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter(t => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fund Management System</h1>
          <p className="text-gray-600">Add funds to customer accounts and manage detailed transaction records</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalCredits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time credit transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalDebits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time debit transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Position</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${(totalCredits - totalDebits).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Net credit/debit difference</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="add-funds" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add-funds">Add/Remove Funds</TabsTrigger>
            <TabsTrigger value="transaction-history">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="add-funds" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select onValueChange={(value) => {
                      const customer = customers.find(c => c.id.toString() === value);
                      setSelectedCustomer(customer || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.fullName} - {customer.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCustomer && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-900">{selectedCustomer.fullName}</h3>
                      <p className="text-sm text-blue-700">Account: {selectedCustomer.accountNumber}</p>
                      <p className="text-sm text-blue-700">Account ID: {selectedCustomer.accountId}</p>
                      <p className="text-lg font-bold text-blue-900 mt-2">
                        Current Balance: ${selectedCustomer.balance.toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Transaction Type</Label>
                    <Select value={transactionType} onValueChange={(value: "credit" | "debit") => setTransactionType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">
                          <div className="flex items-center">
                            <Plus className="w-4 h-4 mr-2 text-green-600" />
                            Credit (Add Funds)
                          </div>
                        </SelectItem>
                        <SelectItem value="debit">
                          <div className="flex items-center">
                            <Minus className="w-4 h-4 mr-2 text-red-600" />
                            Debit (Remove Funds)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Reason for transaction"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Reference (Optional)</Label>
                    <Input
                      placeholder="Auto-generated if empty"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleAddFunds} 
                    disabled={isLoading || !selectedCustomer}
                    className="w-full"
                  >
                    {isLoading ? "Processing..." : 
                     transactionType === "credit" ? "Add Funds" : "Remove Funds"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transaction-history" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={typeFilter} onValueChange={(value: "all" | "credit" | "debit") => setTypeFilter(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="credit">Credits Only</SelectItem>
                        <SelectItem value="debit">Debits Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions ({filteredTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="mx-auto h-12 w-12 mb-4" />
                      <p>No transactions found</p>
                    </div>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${
                              transaction.type === "credit" ? "bg-green-100" : "bg-red-100"
                            }`}>
                              {transaction.type === "credit" ? 
                                <Plus className="h-4 w-4 text-green-600" /> :
                                <Minus className="h-4 w-4 text-red-600" />
                              }
                            </div>
                            <div>
                              <h3 className="font-medium">{transaction.customerName}</h3>
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline">{transaction.category}</Badge>
                                <Badge variant="outline">{transaction.reference}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              transaction.type === "credit" ? "text-green-600" : "text-red-600"
                            }`}>
                              {transaction.type === "credit" ? "+" : "-"}${transaction.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                            <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
