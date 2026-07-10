import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "@/pages/dashboard";
import TransferFunds from "@/pages/transfer-funds";
import ProfileSettings from "@/pages/profile-settings";
import SecuritySettings from "@/pages/security-settings";
import PinSettings from "@/pages/pin-settings";
import CreditCards from "@/pages/credit-cards";
import TransactionHistory from "@/pages/transaction-history";
import History from "@/pages/history";
import StatementsReports from "@/pages/statements-reports";
import InvestmentPortfolio from "@/pages/investment-portfolio";
import WealthManagement from "@/pages/wealth-management";
import SupportCenter from "@/pages/support-center";
import CustomerSupport from "@/pages/customer-support";
import BankingServices from "./pages/banking-services";
import DigitalWallet from "./pages/digital-wallet";
import MobilePay from "./pages/mobile-pay";
import SecurityCenter from "./pages/security-center";
import FindBranches from "./pages/find-branches";
import InternationalTransfer from "./pages/international-transfer";
import InvestmentTrading from "./pages/investment-trading";
import BusinessBanking from "./pages/business-banking";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import MultiStepRegister from "@/pages/register-multi-step";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import SimpleAdmin from "@/pages/simple-admin";
import TransferProcessing from "@/pages/transfer-processing";
import TransferPending from "@/pages/transfer-pending";
import TransferSuccess from "@/pages/transfer-success";
import TransferFailed from "@/pages/transfer-failed";
import Transfer from "@/pages/transfer";
import TransferProcess from "@/pages/transfer-process";
import AdminPanel from "@/pages/admin-panel";
import AdminAccounts from "@/pages/admin-accounts";
import AdminLiveChat from "@/pages/admin-live-chat";
import AdminTransactionDashboard from "@/pages/admin-transaction-dashboard";
import AdminTransactionCreator from "@/pages/admin-transaction-creator";
import CustomerServicePortal from "@/pages/customer-service-portal";
import CustomerManagement from "@/pages/customer-management";
import FundManagement from "@/pages/fund-management";
import Exchange from "@/pages/exchange";
import AddMoney from "@/pages/add-money";
import Receive from "@/pages/receive";
import Alerts from "@/pages/alerts";
import AccountPreferences from "@/pages/account-preferences";
import SecurityCenterPage from "@/pages/security-center";
import Verification from "@/pages/verification";
import About from "@/pages/about";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";
import LiveChat from "@/components/LiveChat";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LanguageProvider>
            <ErrorBoundary>
              <Switch>
                <Route path="/about" component={About} />
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/register-multi-step" component={MultiStepRegister} />
                <Route path="/admin-login" component={AdminLogin} />
                <Route path="/banking-services" component={BankingServices} />
                <Route path="/business-banking" component={BusinessBanking} />

                <Route path="/admin-dashboard">
                  <AdminRoute><AdminDashboard /></AdminRoute>
                </Route>
                <Route path="/admin-panel">
                  <AdminRoute><AdminPanel /></AdminRoute>
                </Route>
                <Route path="/simple-admin">
                  <AdminRoute><SimpleAdmin /></AdminRoute>
                </Route>
                <Route path="/admin-live-chat">
                  <AdminRoute><AdminLiveChat /></AdminRoute>
                </Route>
                <Route path="/admin-accounts">
                  <AdminRoute><AdminAccounts onBack={() => window.history.back()} /></AdminRoute>
                </Route>
                <Route path="/admin-transaction-dashboard">
                  <AdminRoute><AdminTransactionDashboard /></AdminRoute>
                </Route>
                <Route path="/admin-transaction-creator">
                  <AdminRoute><AdminTransactionCreator /></AdminRoute>
                </Route>
                <Route path="/customer-service-portal">
                  <AdminRoute><CustomerServicePortal /></AdminRoute>
                </Route>
                <Route path="/customer-management">
                  <AdminRoute><CustomerManagement /></AdminRoute>
                </Route>
                <Route path="/fund-management">
                  <AdminRoute><FundManagement /></AdminRoute>
                </Route>

                <Route path="/dashboard">
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                </Route>
                <Route path="/transfer-funds">
                  <ProtectedRoute><TransferFunds /></ProtectedRoute>
                </Route>
                <Route path="/transfer-processing">
                  <ProtectedRoute><TransferProcessing /></ProtectedRoute>
                </Route>
                <Route path="/transfer-pending">
                  <ProtectedRoute><TransferPending /></ProtectedRoute>
                </Route>
                <Route path="/transfer-success">
                  <ProtectedRoute><TransferSuccess /></ProtectedRoute>
                </Route>
                <Route path="/transfer-failed">
                  <ProtectedRoute><TransferFailed /></ProtectedRoute>
                </Route>
                <Route path="/transfer">
                  <ProtectedRoute><Transfer /></ProtectedRoute>
                </Route>
                <Route path="/transfer-process">
                  <ProtectedRoute><TransferProcess /></ProtectedRoute>
                </Route>
                <Route path="/international-transfer">
                  <ProtectedRoute><InternationalTransfer /></ProtectedRoute>
                </Route>
                <Route path="/profile-settings">
                  <ProtectedRoute><ProfileSettings /></ProtectedRoute>
                </Route>
                <Route path="/security-settings">
                  <ProtectedRoute><SecuritySettings /></ProtectedRoute>
                </Route>
                <Route path="/pin-settings">
                  <ProtectedRoute><PinSettings /></ProtectedRoute>
                </Route>
                <Route path="/credit-cards">
                  <ProtectedRoute><CreditCards /></ProtectedRoute>
                </Route>
                <Route path="/transaction-history">
                  <ProtectedRoute><TransactionHistory /></ProtectedRoute>
                </Route>
                <Route path="/history">
                  <ProtectedRoute><History /></ProtectedRoute>
                </Route>
                <Route path="/statements-reports">
                  <ProtectedRoute><StatementsReports /></ProtectedRoute>
                </Route>
                <Route path="/investment-portfolio">
                  <ProtectedRoute><InvestmentPortfolio /></ProtectedRoute>
                </Route>
                <Route path="/wealth-management">
                  <ProtectedRoute><WealthManagement /></ProtectedRoute>
                </Route>
                <Route path="/investment-trading">
                  <ProtectedRoute><InvestmentTrading /></ProtectedRoute>
                </Route>
                <Route path="/support-center">
                  <ProtectedRoute><SupportCenter /></ProtectedRoute>
                </Route>
                <Route path="/customer-support">
                  <ProtectedRoute><CustomerSupport /></ProtectedRoute>
                </Route>
                <Route path="/digital-wallet">
                  <ProtectedRoute><DigitalWallet /></ProtectedRoute>
                </Route>
                <Route path="/mobile-pay">
                  <ProtectedRoute><MobilePay /></ProtectedRoute>
                </Route>
                <Route path="/security-center">
                  <ProtectedRoute><SecurityCenter /></ProtectedRoute>
                </Route>
                <Route path="/find-branches">
                  <ProtectedRoute><FindBranches /></ProtectedRoute>
                </Route>
                <Route path="/exchange">
                  <ProtectedRoute><Exchange /></ProtectedRoute>
                </Route>
                <Route path="/add-money">
                  <ProtectedRoute><AddMoney /></ProtectedRoute>
                </Route>
                <Route path="/receive">
                  <ProtectedRoute><Receive /></ProtectedRoute>
                </Route>
                <Route path="/alerts">
                  <ProtectedRoute><Alerts /></ProtectedRoute>
                </Route>
                <Route path="/account-preferences">
                  <ProtectedRoute><AccountPreferences /></ProtectedRoute>
                </Route>
                <Route path="/verification">
                  <ProtectedRoute><Verification /></ProtectedRoute>
                </Route>

                <Route component={NotFound} />
              </Switch>

              <LiveChat />
              <Toaster />
            </ErrorBoundary>
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
