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
import Header from '@/components/Header';
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
import About from '@/pages/about'; // Assuming 'About' page exists

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
import SimpleAdmin from '@/pages/simple-admin'; // Assuming 'SimpleAdmin' page exists

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Safe App Content Component
function SafeAppContent() {
  try {
    return <AppContent />;
  } catch (error) {
    console.error('AppContent error:', error);
    // Optionally return a simplified fallback or a specific error component
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">An Error Occurred</h1>
          <p className="text-gray-600 mb-4">We encountered a problem loading the application. Please try refreshing.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh Application
          </button>
        </div>
      </div>
    );
  }
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/verification-center" element={<VerificationCenter />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/security-settings" element={<SecuritySettings />} />
            <Route path="/pin-settings" element={<PinSettings />} />
            <Route path="/account-preferences" element={<AccountPreferences />} />

            {/* Transfer routes */}
            <Route path="/transfer-funds" element={<TransferFunds />} />
            <Route path="/international-transfer" element={<InternationalTransfer />} />
            <Route path="/transfer-processing" element={<TransferProcessing />} />
            <Route path="/transfer-success" element={<TransferSuccess />} />
            <Route path="/transfer-failed" element={<TransferFailed />} />
            <Route path="/transfer-pending" element={<TransferPending />} />

            {/* Additional banking routes */}
            <Route path="/credit-cards" element={<CreditCards />} />
            <Route path="/mobile-pay" element={<MobilePay />} />
            <Route path="/add-money" element={<AddMoney />} />
            <Route path="/receive" element={<Receive />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/banking-services" element={<BankingServices />} />
            <Route path="/business-banking" element={<BusinessBanking />} />
            <Route path="/investment-portfolio" element={<InvestmentPortfolio />} />
            <Route path="/investment-trading" element={<InvestmentTrading />} />
            <Route path="/wealth-management" element={<WealthManagement />} />
            <Route path="/fund-management" element={<FundManagement />} />
            <Route path="/digital-wallet" element={<DigitalWallet />} />
            <Route path="/find-branches" element={<FindBranches />} />
            <Route path="/customer-support" element={<CustomerSupport />} />
            <Route path="/support-center" element={<SupportCenter />} />
            <Route path="/security-center" element={<SecurityCenter />} />
            <Route path="/statements-reports" element={<StatementsReports />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/about" element={<About />} />

            {/* Admin routes */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-transaction-dashboard" element={<AdminTransactionDashboard />} />
            <Route path="/admin-transaction-creator" element={<AdminTransactionCreator />} />
            <Route path="/admin-accounts" element={<AdminAccounts />} />
            <Route path="/customer-management" element={<CustomerManagement />} />
            <Route path="/customer-service-portal" element={<CustomerServicePortal />} />
            <Route path="/enhanced-admin" element={<EnhancedAdmin />} />
            <Route path="/simple-admin" element={<SimpleAdmin />} />
            <Route path="/admin-live-chat" element={<AdminLiveChat />} />
          </Route>

          {/* Admin login */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Switch>
      </main>
      <Footer />
      <BottomNavigation />
      <LiveChat />
      <RealtimeAlerts />
      <Toaster />
    </div>
  );
}


function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <ErrorBoundary>
                  <Header />
                </ErrorBoundary>
                <main className="flex-1">
                  <ErrorBoundary>
                    <SafeAppContent />
                  </ErrorBoundary>
                </main>
                <ErrorBoundary>
                  <Footer />
                </ErrorBoundary>
                <ErrorBoundary>
                  <BottomNavigation />
                </ErrorBoundary>
                <ErrorBoundary>
                  <LiveChat />
                </ErrorBoundary>
                <ErrorBoundary>
                  <RealtimeAlerts />
                </ErrorBoundary>
                <Toaster />
              </div>
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;