import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Landmark, Plus, CheckCircle, XCircle, Clock, BadgeCheck, Wallet } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/queryClient";

interface Loan {
  id: string;
  user_id: string;
  loan_number: string;
  loan_type: string;
  principal_amount: string;
  interest_rate: string;
  term_months: number;
  monthly_payment: string;
  remaining_balance: string;
  total_interest: string;
  total_payable: string;
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  disbursement_date?: string | null;
  maturity_date?: string | null;
  created_at?: string | null;
}

const LOAN_TYPES = ["Personal", "Home", "Auto", "Education", "Business", "Emergency"];

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    case "active":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><BadgeCheck className="w-3 h-3 mr-1" />Active</Badge>;
    case "paid_off":
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300"><Wallet className="w-3 h-3 mr-1" />Paid Off</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function Loans() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = userProfile?.role === "admin";

  const [loanType, setLoanType] = useState(LOAN_TYPES[0]);
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [transferPin, setTransferPin] = useState("");

  // Fetch the user's loans
  const { data: loans = [], isLoading, isError: loansError } = useQuery<Loan[]>({
    queryKey: ['/api/loans'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/loans');
      return res.json();
    },
  });

  // Fetch pending loans for admin
  const { data: pendingLoans = [], isError: pendingLoansError } = useQuery<Loan[]>({
    queryKey: ['/api/admin/pending-loans'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/admin/pending-loans');
      return res.json();
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (loansError) {
      toast({ title: 'Error loading loans', variant: 'destructive' });
    }
    if (pendingLoansError) {
      toast({ title: 'Error loading pending loans', variant: 'destructive' });
    }
  }, [loansError, pendingLoansError]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Apply for a loan
  const applyMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await authenticatedFetch('/api/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to apply for loan');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Loan application submitted", description: "Your loan is pending approval." });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      setPrincipalAmount("");
      setInterestRate("");
      setTermMonths("");
      setTransferPin("");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Application failed", description: error.message });
    },
  });

  // Approve a loan (admin)
  const approveMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const res = await authenticatedFetch(`/api/loans/${loanId}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to approve loan');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Loan approved" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-loans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Approval failed", description: error.message });
    },
  });

  // Reject a loan (admin)
  const rejectMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const res = await authenticatedFetch(`/api/loans/${loanId}/reject`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to reject loan');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Loan rejected" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-loans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Rejection failed", description: error.message });
    },
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalAmount || !interestRate || !termMonths || !transferPin) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all fields." });
      return;
    }
    const principal = parseFloat(String(principalAmount));
    if (principal > 500000) {
      toast({ title: 'Maximum loan amount is $500,000', variant: 'destructive' });
      return;
    }
    const parsedTermMonths = parseInt(String(termMonths));
    if (parsedTermMonths > 360) {
      toast({ title: 'Maximum term is 360 months (30 years)', variant: 'destructive' });
      return;
    }
    applyMutation.mutate({
      loanType,
      principalAmount,
      interestRate,
      termMonths: Number(termMonths),
      transferPin,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16 pb-20">
        <div className="px-4 py-6">
          <div className="flex items-center gap-2 mb-6">
            <Landmark className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Loans</h1>
          </div>

          {/* Loan Application Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> Apply for a Loan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApply} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loanType">Loan Type</Label>
                  <select
                    id="loanType"
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                  >
                    {LOAN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principalAmount">Principal Amount ($)</Label>
                  <Input
                    id="principalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    placeholder="10000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="5.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="termMonths">Term (months)</Label>
                    <Input
                      id="termMonths"
                      type="number"
                      min="1"
                      step="1"
                      value={termMonths}
                      onChange={(e) => setTermMonths(e.target.value)}
                      placeholder="36"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferPin">Transfer PIN</Label>
                  <Input
                    id="transferPin"
                    type="password"
                    maxLength={6}
                    value={transferPin}
                    onChange={(e) => setTransferPin(e.target.value)}
                    placeholder="Enter your PIN"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
                  {applyMutation.isPending ? "Submitting..." : "Apply for Loan"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* My Loans */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>My Loans</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-gray-500 text-center py-4">Loading loans...</p>
              ) : loans.length === 0 ? (
                <p className="text-gray-500 text-center py-4">You have no loans yet.</p>
              ) : (
                <div className="space-y-3">
                  {loans.map((loan) => (
                    <div key={loan.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{loan.loan_type} Loan</p>
                          <p className="text-xs text-gray-500">{loan.loan_number}</p>
                        </div>
                        {statusBadge(loan.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <span className="text-gray-500">Principal: </span>
                          <span className="font-medium">{formatCurrency(loan.principal_amount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Rate: </span>
                          <span className="font-medium">{loan.interest_rate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Term: </span>
                          <span className="font-medium">{loan.term_months} months</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Monthly: </span>
                          <span className="font-medium">{formatCurrency(loan.monthly_payment)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Remaining: </span>
                          <span className="font-medium">{formatCurrency(loan.remaining_balance)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Payable: </span>
                          <span className="font-medium">{formatCurrency(loan.total_payable)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin: Pending Loans */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Loan Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoans.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending loans.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingLoans.map((loan) => (
                      <div key={loan.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">{loan.loan_type} Loan</p>
                            <p className="text-xs text-gray-500">{loan.loan_number}</p>
                          </div>
                          {statusBadge(loan.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-3 mb-3">
                          <div>
                            <span className="text-gray-500">Principal: </span>
                            <span className="font-medium">{formatCurrency(loan.principal_amount)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Rate: </span>
                            <span className="font-medium">{loan.interest_rate}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Term: </span>
                            <span className="font-medium">{loan.term_months} months</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Monthly: </span>
                            <span className="font-medium">{formatCurrency(loan.monthly_payment)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(loan.id)}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(loan.id)}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
