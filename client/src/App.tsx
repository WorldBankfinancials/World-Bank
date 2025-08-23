
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// Context Providers
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Components
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNavigation from '@/components/BottomNavigation';

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
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <LanguageProvider>
              <Router>
                <div className="min-h-screen bg-gray-50">
                  <Switch>
                    {/* Public Routes */}
                    <Route exact path="/login" component={Login} />
                    <Route exact path="/register" component={Registration} />
                    <Route exact path="/registration" component={Registration} />
                    <Route exact path="/verification" component={Verification} />
                    <Route exact path="/banking-services" component={BankingServices} />
                    <Route exact path="/business-banking" component={BusinessBanking} />
                    <Route exact path="/wealth-management" component={WealthManagement} />
                    <Route exact path="/find-branches" component={FindBranches} />
                    
                    {/* Admin Routes */}
                    <Route exact path="/admin" component={AdminLogin} />
                    <Route exact path="/admin/login" component={AdminLogin} />
                    <Route exact path="/admin/dashboard" component={AdminDashboard} />
                    <Route exact path="/admin/enhanced" component={EnhancedAdmin} />
                    <Route exact path="/admin/accounts" component={AdminAccounts} />
                    <Route exact path="/admin/transactions" component={AdminTransactionDashboard} />
                    <Route exact path="/admin/transaction-creator" component={AdminTransactionCreator} />
                    <Route exact path="/admin/live-chat" component={AdminLiveChat} />
                    <Route exact path="/admin/customers" component={CustomerManagement} />
                    <Route exact path="/admin/customer-service" component={CustomerServicePortal} />
                    <Route exact path="/admin/fund-management" component={FundManagement} />

                    {/* Protected Routes */}
                    <Route path="/">
                      <ProtectedRoute>
                        <div className="pb-20">
                          <Switch>
                            <Route exact path="/" component={Dashboard} />
                            <Route exact path="/dashboard" component={Dashboard} />
                            <Route exact path="/credit-cards" component={CreditCards} />
                            <Route exact path="/cards" component={CreditCards} />
                            <Route exact path="/transfer-funds" component={TransferFunds} />
                            <Route exact path="/transfer" component={TransferFunds} />
                            <Route exact path="/international-transfer" component={InternationalTransfer} />
                            <Route exact path="/transaction-history" component={TransactionHistory} />
                            <Route exact path="/history" component={TransactionHistory} />
                            <Route exact path="/profile-settings" component={ProfileSettings} />
                            <Route exact path="/profile" component={ProfileSettings} />
                            <Route exact path="/security-settings" component={SecuritySettings} />
                            <Route exact path="/pin-settings" component={PinSettings} />
                            <Route exact path="/account-preferences" component={AccountPreferences} />
                            <Route exact path="/customer-support" component={CustomerSupport} />
                            <Route exact path="/support-center" component={SupportCenter} />
                            <Route exact path="/security-center" component={SecurityCenter} />
                            <Route exact path="/investment-portfolio" component={InvestmentPortfolio} />
                            <Route exact path="/investment-trading" component={InvestmentTrading} />
                            <Route exact path="/digital-wallet" component={DigitalWallet} />
                            <Route exact path="/mobile-pay" component={MobilePay} />
                            <Route exact path="/alerts" component={Alerts} />
                            <Route exact path="/statements-reports" component={StatementsReports} />
                            <Route exact path="/add-money" component={AddMoney} />
                            <Route exact path="/receive" component={Receive} />
                            <Route exact path="/transfer-success" component={TransferSuccess} />
                            <Route exact path="/transfer-pending" component={TransferPending} />
                            <Route exact path="/transfer-failed" component={TransferFailed} />
                            <Route exact path="/transfer-processing" component={TransferProcessing} />
                            <Route exact path="/not-found" component={NotFound} />
                            <Route component={NotFound} />
                          </Switch>
                        </div>
                        <BottomNavigation />
                      </ProtectedRoute>
                    </Route>
                  </Switch>
                </div>
              </Router>
            </LanguageProvider>
          </AuthProvider>
        </TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
