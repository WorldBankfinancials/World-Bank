import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  PiggyBank, 
  TrendingUp,
  Upload,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Plus
} from 'lucide-react';

interface CustomerAccount {
  id: number;
  accountNumber: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'investment';
  balance: number;
  currency: string;
  isActive: boolean;
  interestRate?: number;
  minimumBalance?: number;
}

interface CustomerProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  profession: string;
  isVerified: boolean;
  accounts: CustomerAccount[];
  documents: Document[];
}

interface Document {
  id: number;
  documentType: string;
  documentName: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'needs_review';
  uploadedAt: string;
  verificationNotes?: string;
}

export default function EnhancedAdmin() {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('accounts');
  const [customers] = useState<CustomerProfile[]>([
    {
      id: 1,
      fullName: "Mr. Liu Wei",
      email: "liu.wei@oilrig.com",
      phone: "+86 138 0013 8000",
      profession: "Marine Engineer",
      isVerified: true,
      accounts: [
        {
          id: 1,
          accountNumber: "4789-6523-1087-9234",
          accountName: "Primary Checking",
          accountType: "checking",
          balance: 1047832.15,
          currency: "USD",
          isActive: true,
          minimumBalance: 100
        },
        {
          id: 2,
          accountNumber: "4789-6523-1087-9235",
          accountName: "Emergency Savings",
          accountType: "savings",
          balance: 250000.00,
          currency: "USD",
          isActive: true,
          interestRate: 2.5,
          minimumBalance: 1000
        },
        {
          id: 3,
          accountNumber: "4789-6523-1087-9236",
          accountName: "Investment Portfolio",
          accountType: "investment",
          balance: 850000.00,
          currency: "USD",
          isActive: true,
          interestRate: 7.2
        }
      ],
      documents: [
        {
          id: 1,
          documentType: "passport",
          documentName: "Passport_Liu_Wei.pdf",
          isVerified: true,
          verificationStatus: "approved",
          uploadedAt: "2024-12-01T10:00:00Z",
          verificationNotes: "Document verified and approved"
        },
        {
          id: 2,
          documentType: "proof_of_address",
          documentName: "Utility_Bill_Dec2024.pdf",
          isVerified: false,
          verificationStatus: "pending",
          uploadedAt: "2024-12-15T14:30:00Z"
        }
      ]
    }
  ]);

  const [formData, setFormData] = useState({
    accountType: 'checking',
    accountName: '',
    initialBalance: '',
    interestRate: '',
    minimumBalance: ''
  });

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <CreditCard className="w-5 h-5" />;
      case 'savings': return <PiggyBank className="w-5 h-5" />;
      case 'investment': return <TrendingUp className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'checking': return 'bg-blue-100 text-blue-800';
      case 'savings': return 'bg-green-100 text-green-800';
      case 'investment': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'needs_review': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const createNewAccount = () => {
    if (!selectedCustomer || !formData.accountName || !formData.initialBalance) return;

    const newAccount: CustomerAccount = {
      id: Date.now(),
      accountNumber: `4789-6523-1087-${Math.floor(Math.random() * 10000)}`,
      accountName: formData.accountName,
      accountType: formData.accountType as 'checking' | 'savings' | 'investment',
      balance: parseFloat(formData.initialBalance),
      currency: "USD",
      isActive: true,
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      minimumBalance: formData.minimumBalance ? parseFloat(formData.minimumBalance) : undefined
    };

    // In a real app, this would be an API call
    selectedCustomer.accounts.push(newAccount);
    setFormData({
      accountType: 'checking',
      accountName: '',
      initialBalance: '',
      interestRate: '',
      minimumBalance: ''
    });
  };

  const topUpAccount = (accountId: number, amount: number) => {
    if (!selectedCustomer) return;
    
    const account = selectedCustomer.accounts.find(acc => acc.id === accountId);
    if (account) {
      account.balance += amount;
    }
  };

  const verifyDocument = (documentId: number, status: 'approved' | 'rejected', notes: string) => {
    if (!selectedCustomer) return;

    const document = selectedCustomer.documents.find(doc => doc.id === documentId);
    if (document) {
      document.verificationStatus = status;
      document.isVerified = status === 'approved';
      document.verificationNotes = notes;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enhanced Admin Dashboard</h1>
        <p className="text-gray-600">Complete customer management with multi-account support</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Search & List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-3">
                {customers
                  .filter(customer => 
                    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(customer => (
                    <div
                      key={customer.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{customer.fullName}</h3>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                          <p className="text-xs text-gray-500">{customer.accounts.length} accounts</p>
                        </div>
                        {customer.isVerified && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Details */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="new-account">New Account</TabsTrigger>
              </TabsList>

              {/* Accounts Tab */}
              <TabsContent value="accounts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Accounts</CardTitle>
                    <p className="text-sm text-gray-600">
                      Managing accounts for {selectedCustomer.fullName}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedCustomer.accounts.map(account => (
                        <div key={account.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getAccountIcon(account.accountType)}
                              <div>
                                <h3 className="font-medium">{account.accountName}</h3>
                                <p className="text-sm text-gray-600">{account.accountNumber}</p>
                              </div>
                            </div>
                            <Badge className={getAccountTypeColor(account.accountType)}>
                              {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Balance</p>
                              <p className="text-xl font-bold text-green-600">
                                ${account.balance.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <Badge variant={account.isActive ? "default" : "secondary"}>
                                {account.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>

                          {account.interestRate && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600">Interest Rate</p>
                              <p className="font-medium">{account.interestRate}% APY</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => topUpAccount(account.id, 1000)}
                              className="flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Top Up $1,000
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => topUpAccount(account.id, 5000)}
                              className="flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Top Up $5,000
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Verification</CardTitle>
                    <p className="text-sm text-gray-600">
                      Review and verify customer documents
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedCustomer.documents.map(document => (
                        <div key={document.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5" />
                              <div>
                                <h3 className="font-medium">{document.documentName}</h3>
                                <p className="text-sm text-gray-600 capitalize">
                                  {document.documentType.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            <Badge className={getVerificationStatusColor(document.verificationStatus)}>
                              {document.verificationStatus.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-600">Uploaded</p>
                            <p className="text-sm">
                              {new Date(document.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>

                          {document.verificationNotes && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600">Notes</p>
                              <p className="text-sm">{document.verificationNotes}</p>
                            </div>
                          )}

                          {document.verificationStatus === 'pending' && (
                            <div className="space-y-3">
                              <Textarea
                                placeholder="Add verification notes..."
                                className="w-full"
                                id={`notes-${document.id}`}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const notes = (document.getElementById(`notes-${document.id}`) as HTMLTextAreaElement)?.value || '';
                                    verifyDocument(document.id, 'approved', notes);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const notes = (document.getElementById(`notes-${document.id}`) as HTMLTextAreaElement)?.value || '';
                                    verifyDocument(document.id, 'rejected', notes);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4" />
                                  View
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Profile</CardTitle>
                    <p className="text-sm text-gray-600">
                      Edit customer information and settings
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input 
                          id="fullName" 
                          defaultValue={selectedCustomer.fullName}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email"
                          defaultValue={selectedCustomer.email}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          defaultValue={selectedCustomer.phone}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profession">Profession</Label>
                        <Input 
                          id="profession" 
                          defaultValue={selectedCustomer.profession}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="notes">Admin Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add internal notes about this customer..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button>Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* New Account Tab */}
              <TabsContent value="new-account" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Account</CardTitle>
                    <p className="text-sm text-gray-600">
                      Add a new account for {selectedCustomer.fullName}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="accountType">Account Type</Label>
                        <Select 
                          value={formData.accountType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Checking Account</SelectItem>
                            <SelectItem value="savings">Savings Account</SelectItem>
                            <SelectItem value="investment">Investment Account</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input 
                          id="accountName"
                          placeholder="e.g., Primary Checking, Emergency Savings"
                          value={formData.accountName}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="initialBalance">Initial Balance</Label>
                        <Input 
                          id="initialBalance"
                          type="number"
                          placeholder="0.00"
                          value={formData.initialBalance}
                          onChange={(e) => setFormData(prev => ({ ...prev, initialBalance: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="minimumBalance">Minimum Balance</Label>
                        <Input 
                          id="minimumBalance"
                          type="number"
                          placeholder="100.00"
                          value={formData.minimumBalance}
                          onChange={(e) => setFormData(prev => ({ ...prev, minimumBalance: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      {(formData.accountType === 'savings' || formData.accountType === 'investment') && (
                        <div className="col-span-2">
                          <Label htmlFor="interestRate">Interest Rate (%)</Label>
                          <Input 
                            id="interestRate"
                            type="number"
                            step="0.1"
                            placeholder="2.5"
                            value={formData.interestRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button onClick={createNewAccount} disabled={!formData.accountName || !formData.initialBalance}>
                        Create Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Selected</h3>
                  <p className="text-gray-600">
                    Select a customer from the list to view and manage their accounts
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}