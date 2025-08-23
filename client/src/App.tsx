
import React from 'react';
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
import TransactionRouter from '@/pages/transaction-router';

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
                    <Route path="/login" component={Login} />
                    <Route path="/register" component={Registration} />
                    <Route path="/registration" component={Registration} />
                    <Route path="/verification" component={Verification} />
                    <Route path="/banking-services" component={BankingServices} />
                    <Route path="/business-banking" component={BusinessBanking} />
                    <Route path="/wealth-management" component={WealthManagement} />
                    <Route path="/find-branches" component={FindBranches} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" component={AdminLogin} />
                    <Route path="/admin/login" component={AdminLogin} />
                    <Route path="/admin/dashboard" component={AdminDashboard} />
                    <Route path="/admin/enhanced" component={EnhancedAdmin} />
                    <Route path="/admin/accounts" component={AdminAccounts} />
                    <Route path="/admin/transactions" component={AdminTransactionDashboard} />
                    <Route path="/admin/transaction-creator" component={AdminTransactionCreator} />
                    <Route path="/admin/live-chat" component={AdminLiveChat} />
                    <Route path="/admin/customers" component={CustomerManagement} />
                    <Route path="/admin/customer-service" component={CustomerServicePortal} />
                    <Route path="/admin/fund-management" component={FundManagement} />

                    {/* Protected Routes */}
                    <Route path="/:rest*">
                      <ProtectedRoute>
                        <div className="pb-20">
                          <Switch>
                            <Route path="/" component={Dashboard} />
                            <Route path="/dashboard" component={Dashboard} />
                            <Route path="/credit-cards" component={CreditCards} />
                            <Route path="/cards" component={Cards} />
                            <Route path="/transfer-funds" component={TransferFunds} />
                            <Route path="/transfer" component={Transfer} />
                            <Route path="/international-transfer" component={InternationalTransfer} />
                            <Route path="/transaction-history" component={TransactionHistory} />
                            <Route path="/history" component={History} />
                            <Route path="/profile-settings" component={ProfileSettings} />
                            <Route path="/profile" component={ProfileSettings} />
                            <Route path="/security-settings" component={SecuritySettings} />
                            <Route path="/pin-settings" component={PinSettings} />
                            <Route path="/account-preferences" component={AccountPreferences} />
                            <Route path="/customer-support" component={CustomerSupport} />
                            <Route path="/support-center" component={SupportCenter} />
                            <Route path="/security-center" component={SecurityCenter} />
                            <Route path="/investment-portfolio" component={InvestmentPortfolio} />
                            <Route path="/investment-trading" component={InvestmentTrading} />
                            <Route path="/digital-wallet" component={DigitalWallet} />
                            <Route path="/mobile-pay" component={MobilePay} />
                            <Route path="/alerts" component={Alerts} />
                            <Route path="/statements-reports" component={StatementsReports} />
                            <Route path="/add-money" component={AddMoney} />
                            <Route path="/receive" component={Receive} />
                            <Route path="/transfer-success" component={TransferSuccess} />
                            <Route path="/transfer-pending" component={TransferPending} />
                            <Route path="/transfer-failed" component={TransferFailed} />
                            <Route path="/transfer-processing" component={TransferProcessing} />
                            <Route path="/transaction-router" component={TransactionRouter} />
                            <Route path="/customer-management" component={CustomerManagement} />
                            <Route path="/fund-management" component={FundManagement} />
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
