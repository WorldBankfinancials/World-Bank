import { Router, Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// Context Providers
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Components
import ErrorBoundary from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import LiveChat from '@/components/LiveChat';
import RealtimeAlerts from '@/components/RealtimeAlerts';

// Pages
import Dashboard from '@/pages/dashboard';
import Login from '@/pages/login';
import Registration from '@/pages/registration';
import CreditCards from '@/pages/credit-cards';
import TransferFunds from '@/pages/transfer-funds';
import InternationalTransfer from '@/pages/international-transfer';
import TransactionHistory from '@/pages/transaction-history';
import ProfileSettings from '@/pages/profile-settings';
import SecuritySettings from '@/pages/security-settings';
import PinSettings from '@/pages/pin-settings';
import AccountPreferences from '@/pages/account-preferences';
import CustomerSupport from '@/pages/customer-support';
import SupportCenter from '@/pages/support-center';
import SecurityCenter from '@/pages/security-center';
import BankingServices from '@/pages/banking-services';
import BusinessBanking from '@/pages/business-banking';
import WealthManagement from '@/pages/wealth-management';
import InvestmentPortfolio from '@/pages/investment-portfolio';
import InvestmentTrading from '@/pages/investment-trading';
import DigitalWallet from '@/pages/digital-wallet';
import MobilePay from '@/pages/mobile-pay';
import Alerts from '@/pages/alerts';
import StatementsReports from '@/pages/statements-reports';
import FindBranches from '@/pages/find-branches';
import AddMoney from '@/pages/add-money';
import Receive from '@/pages/receive';
import TransferSuccess from '@/pages/transfer-success';
import TransferPending from '@/pages/transfer-pending';
import TransferFailed from '@/pages/transfer-failed';
import TransferProcessing from '@/pages/transfer-processing';
import Verification from '@/pages/verification';
import NotFound from '@/pages/not-found';
import History from '@/pages/history';
import Cards from '@/pages/cards';
import Transfer from '@/pages/transfer';
import VerificationCenter from '@/pages/verification-center';

// Admin Pages
import AdminLogin from '@/pages/admin-login';
import AdminDashboard from '@/pages/admin-dashboard';
import EnhancedAdmin from '@/pages/enhanced-admin';
import AdminAccounts from '@/pages/admin-accounts';
import AdminTransactionDashboard from '@/pages/admin-transaction-dashboard';
import AdminTransactionCreator from '@/pages/admin-transaction-creator';
import AdminLiveChat from '@/pages/admin-live-chat';
import CustomerManagement from '@/pages/customer-management';
import CustomerServicePortal from '@/pages/customer-service-portal';
import FundManagement from '@/pages/fund-management';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const res = await fetch(url, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        return res.json();
      },
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Router>
                <div className="min-h-screen bg-gray-50">
                  <main className="flex-1">
                    <Switch>
                      {/* Public Routes */}
                      <Route path="/" component={Login} />
                      <Route path="/login" component={Login} />
                      <Route path="/register" component={Registration} />
                      <Route path="/admin-login" component={AdminLogin} />

                      {/* Protected Routes */}
                      <Route path="/dashboard">
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/transfer">
                        <ProtectedRoute>
                          <Transfer />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/cards">
                        <ProtectedRoute>
                          <Cards />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/verification-center">
                        <ProtectedRoute>
                          <VerificationCenter />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/history">
                        <ProtectedRoute>
                          <History />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/profile">
                        <ProtectedRoute>
                          <ProfileSettings />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/security-settings">
                        <ProtectedRoute>
                          <SecuritySettings />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/pin-settings">
                        <ProtectedRoute>
                          <PinSettings />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/account-preferences">
                        <ProtectedRoute>
                          <AccountPreferences />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/credit-cards">
                        <ProtectedRoute>
                          <CreditCards />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/transfer-funds">
                        <ProtectedRoute>
                          <TransferFunds />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/international-transfer">
                        <ProtectedRoute>
                          <InternationalTransfer />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/transaction-history">
                        <ProtectedRoute>
                          <TransactionHistory />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/profile-settings">
                        <ProtectedRoute>
                          <ProfileSettings />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/customer-support">
                        <ProtectedRoute>
                          <CustomerSupport />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/support-center">
                        <ProtectedRoute>
                          <SupportCenter />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/security-center">
                        <ProtectedRoute>
                          <SecurityCenter />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/banking-services">
                        <ProtectedRoute>
                          <BankingServices />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/business-banking">
                        <ProtectedRoute>
                          <BusinessBanking />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/wealth-management">
                        <ProtectedRoute>
                          <WealthManagement />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/investment-portfolio">
                        <ProtectedRoute>
                          <InvestmentPortfolio />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/investment-trading">
                        <ProtectedRoute>
                          <InvestmentTrading />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/digital-wallet">
                        <ProtectedRoute>
                          <DigitalWallet />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/mobile-pay">
                        <ProtectedRoute>
                          <MobilePay />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/alerts">
                        <ProtectedRoute>
                          <Alerts />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/statements-reports">
                        <ProtectedRoute>
                          <StatementsReports />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/find-branches">
                        <ProtectedRoute>
                          <FindBranches />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/add-money">
                        <ProtectedRoute>
                          <AddMoney />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/receive">
                        <ProtectedRoute>
                          <Receive />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/verification">
                        <ProtectedRoute>
                          <Verification />
                        </ProtectedRoute>
                      </Route>

                      {/* Transfer Status Pages */}
                      <Route path="/transfer-success" component={TransferSuccess} />
                      <Route path="/transfer-pending" component={TransferPending} />
                      <Route path="/transfer-failed" component={TransferFailed} />
                      <Route path="/transfer-processing" component={TransferProcessing} />

                      {/* Admin Routes */}
                      <Route path="/admin-dashboard">
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/admin-transaction-dashboard">
                        <ProtectedRoute>
                          <AdminTransactionDashboard />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/admin-transaction-creator">
                        <ProtectedRoute>
                          <AdminTransactionCreator />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/admin-accounts">
                        <ProtectedRoute>
                          <AdminAccounts />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/customer-management">
                        <ProtectedRoute>
                          <CustomerManagement />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/customer-service-portal">
                        <ProtectedRoute>
                          <CustomerServicePortal />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/enhanced-admin">
                        <ProtectedRoute>
                          <EnhancedAdmin />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/admin-live-chat">
                        <ProtectedRoute>
                          <AdminLiveChat />
                        </ProtectedRoute>
                      </Route>
                      
                      <Route path="/fund-management">
                        <ProtectedRoute>
                          <FundManagement />
                        </ProtectedRoute>
                      </Route>

                      {/* 404 route */}
                      <Route component={NotFound} />
                    </Switch>
                  </main>
                  <Footer />
                  <BottomNavigation />
                  <LiveChat isOpen={false} onClose={() => {}} />
                  <RealtimeAlerts />
                  <Toaster />
                </div>
              </Router>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;