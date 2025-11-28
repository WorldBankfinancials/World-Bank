import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, DollarSign, Clock, TrendingUp, TrendingDown, FileText, Search } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
export default function FundManagement() {
    const { toast } = useToast();
    const [customers, setCustomers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // Form states
    const [transactionType, setTransactionType] = useState("credit");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [reference, setReference] = useState("");
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    useEffect(() => {
        fetchCustomers();
        fetchTransactions();
    }, []);
    const fetchCustomers = async () => {
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/admin/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            }
            else {
                console.error('Failed to fetch customers:', await response.text());
                toast({
                    title: 'Error loading customers',
                    description: 'Unable to load customer list. Please try again.',
                    variant: 'destructive',
                });
            }
        }
        catch (error) {
            console.error('Failed to fetch customers:', error);
            toast({
                title: 'Network error',
                description: 'Unable to connect to the server. Please check your connection.',
                variant: 'destructive',
            });
        }
    };
    const fetchTransactions = async () => {
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/admin/transactions');
            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            }
            else {
                console.error('Failed to fetch transactions:', await response.text());
                toast({
                    title: 'Error loading transactions',
                    description: 'Unable to load transaction history. Please try again.',
                    variant: 'destructive',
                });
            }
        }
        catch (error) {
            console.error('Failed to fetch transactions:', error);
            toast({
                title: 'Network error',
                description: 'Unable to connect to the server. Please check your connection.',
                variant: 'destructive',
            });
        }
    };
    const generateReference = () => {
        const prefix = transactionType === "credit" ? "CR" : "DR";
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${timestamp}`;
    };
    const handleAddFunds = async () => {
        if (!selectedCustomer || !amount || !description) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
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
            const transactionResponse = await authenticatedFetch('/api/admin/create-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });
            if (transactionResponse.ok) {
                // Update customer balance
                const balanceChange = transactionType === "credit" ?
                    parseFloat(amount) : -parseFloat(amount);
                const balanceResponse = await authenticatedFetch('/api/admin/update-balance', {
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
                    toast({
                        title: 'Transaction Complete',
                        description: `${transactionType === "credit" ? "Funds added" : "Funds deducted"} successfully!`,
                    });
                }
            }
        }
        catch (error) {
            // console.error('Failed to process transaction:', error);
            toast({
                title: 'Transaction Failed',
                description: 'Failed to process transaction. Please try again.',
                variant: 'destructive',
            });
        }
        finally {
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
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Fund Management System" }), _jsx("p", { className: "text-gray-600", children: "Add funds to customer accounts and manage detailed transaction records" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Credits" }), _jsx(TrendingUp, { className: "h-4 w-4 text-green-600" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-green-600", children: ["$", totalCredits.toLocaleString()] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "All time credit transactions" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Debits" }), _jsx(TrendingDown, { className: "h-4 w-4 text-red-600" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-red-600", children: ["$", totalDebits.toLocaleString()] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "All time debit transactions" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Net Position" }), _jsx(DollarSign, { className: "h-4 w-4 text-blue-600" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-blue-600", children: ["$", (totalCredits - totalDebits).toLocaleString()] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Net credit/debit difference" })] })] })] }), _jsxs(Tabs, { defaultValue: "add-funds", className: "space-y-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "add-funds", children: "Add/Remove Funds" }), _jsx(TabsTrigger, { value: "transaction-history", children: "Transaction History" })] }), _jsx(TabsContent, { value: "add-funds", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Select Customer" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Customer" }), _jsxs(Select, { onValueChange: (value) => {
                                                                    const customer = customers.find(c => c.id.toString() === value);
                                                                    setSelectedCustomer(customer || null);
                                                                }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Choose a customer..." }) }), _jsx(SelectContent, { children: customers.map((customer) => (_jsxs(SelectItem, { value: customer.id.toString(), children: [customer.fullName, " - ", customer.accountNumber] }, customer.id))) })] })] }), selectedCustomer && (_jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [_jsx("h3", { className: "font-medium text-blue-900", children: selectedCustomer.fullName }), _jsxs("p", { className: "text-sm text-blue-700", children: ["Account: ", selectedCustomer.accountNumber] }), _jsxs("p", { className: "text-sm text-blue-700", children: ["Account ID: ", selectedCustomer.accountId] }), _jsxs("p", { className: "text-lg font-bold text-blue-900 mt-2", children: ["Current Balance: $", selectedCustomer.balance.toLocaleString()] })] }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Transaction Details" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Transaction Type" }), _jsxs(Select, { value: transactionType, onValueChange: (value) => setTransactionType(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "credit", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Plus, { className: "w-4 h-4 mr-2 text-green-600" }), "Credit (Add Funds)"] }) }), _jsx(SelectItem, { value: "debit", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Minus, { className: "w-4 h-4 mr-2 text-red-600" }), "Debit (Remove Funds)"] }) })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Amount" }), _jsx(Input, { type: "number", step: "0.01", placeholder: "0.00", value: amount, onChange: (e) => setAmount(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Description" }), _jsx(Input, { placeholder: "Reason for transaction", value: description, onChange: (e) => setDescription(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Category" }), _jsxs(Select, { value: category, onValueChange: setCategory, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select category..." }) }), _jsx(SelectContent, { children: transactionCategories.map((cat) => (_jsx(SelectItem, { value: cat, children: cat }, cat))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Reference (Optional)" }), _jsx(Input, { placeholder: "Auto-generated if empty", value: reference, onChange: (e) => setReference(e.target.value) })] }), _jsx(Button, { onClick: handleAddFunds, disabled: isLoading || !selectedCustomer, className: "w-full", children: isLoading ? "Processing..." :
                                                            transactionType === "credit" ? "Add Funds" : "Remove Funds" })] })] })] }) }), _jsxs(TabsContent, { value: "transaction-history", className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Filter Transactions" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Search" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search transactions...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-8" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Type" }), _jsxs(Select, { value: typeFilter, onValueChange: (value) => setTypeFilter(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "credit", children: "Credits Only" }), _jsx(SelectItem, { value: "debit", children: "Debits Only" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Date" }), _jsx(Input, { type: "date", value: dateFilter, onChange: (e) => setDateFilter(e.target.value) })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { children: ["Recent Transactions (", filteredTransactions.length, ")"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: filteredTransactions.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(FileText, { className: "mx-auto h-12 w-12 mb-4" }), _jsx("p", { children: "No transactions found" })] })) : (filteredTransactions.map((transaction) => (_jsx("div", { className: "border rounded-lg p-4 hover:bg-gray-50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: `p-2 rounded-full ${transaction.type === "credit" ? "bg-green-100" : "bg-red-100"}`, children: transaction.type === "credit" ?
                                                                            _jsx(Plus, { className: "h-4 w-4 text-green-600" }) :
                                                                            _jsx(Minus, { className: "h-4 w-4 text-red-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: transaction.customerName }), _jsx("p", { className: "text-sm text-gray-600", children: transaction.description }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsx(Badge, { variant: "outline", children: transaction.category }), _jsx(Badge, { variant: "outline", children: transaction.reference })] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: `text-lg font-bold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`, children: [transaction.type === "credit" ? "+" : "-", "$", transaction.amount.toLocaleString()] }), _jsxs("p", { className: "text-sm text-gray-500 flex items-center", children: [_jsx(Clock, { className: "h-3 w-3 mr-1" }), new Date(transaction.createdAt).toLocaleDateString()] }), _jsx(Badge, { variant: transaction.status === "completed" ? "default" : "secondary", children: transaction.status })] })] }) }, transaction.id)))) }) })] })] })] })] }) }));
}
