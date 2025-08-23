import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
import CustomerSupport from "./pages/customer-support";
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
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import SimpleAdmin from "@/pages/simple-admin";
import TransferProcessing from "@/pages/transfer-processing";
import TransferPending from "@/pages/transfer-pending";
import TransferSuccess from "@/pages/transfer-success";
import TransferFailed from "@/pages/transfer-failed";
import Transfer from "@/pages/transfer";
import Cards from "@/pages/cards";
import Receive from "@/pages/receive";
import AddMoney from "@/pages/add-money";
import Alerts from "./pages/alerts";
import CustomerManagement from "@/pages/customer-management";
import FundManagement from "@/pages/fund-management";
import AdminLiveChat from "@/pages/admin-live-chat";
import CustomerServicePortal from "@/pages/customer-service-portal";
import VerificationCenter from "@/pages/verification";
import AccountPreferences from "@/pages/account-preferences";
import AdminTransactionDashboard from "@/pages/admin-transaction-dashboard";
import AdminTransactionCreator from "@/pages/admin-transaction-creator";
import TransactionRouter from "@/pages/transaction-router";
import About from "./pages/about";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <LanguageProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
              <Switch>
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/admin-login" component={AdminLogin} />
                <Route path="/admin-dashboard" component={AdminDashboard} />
                <Route path="/simple-admin" component={SimpleAdmin} />
                <Route path="/admin-live-chat" component={AdminLiveChat} />
                <Route path="/customer-service" component={CustomerServicePortal} />
                <Route path="/transfer-processing" component={TransferProcessing} />
                <Route path="/transfer-pending" component={TransferPending} />
                <Route path="/transfer-success" component={TransferSuccess} />
                <Route path="/transfer-failed" component={TransferFailed} />

                <Route path="/" nest>
                  <ProtectedRoute>
                    <div className="pb-20">
                      <Switch>
                        <Route path="/" component={Dashboard} />
                        <Route path="/dashboard" component={Dashboard} />
                        <Route path="/transfer-funds" component={TransferFunds} />
                        <Route path="/profile-settings" component={ProfileSettings} />
                        <Route path="/security-settings" component={SecuritySettings} />
                        <Route path="/pin-settings" component={PinSettings} />
                        <Route path="/credit-cards" component={CreditCards} />
                        <Route path="/transaction-history" component={TransactionHistory} />
                        <Route path="/history" component={History} />
                        <Route path="/statements-reports" component={StatementsReports} />
                        <Route path="/investment-portfolio" component={InvestmentPortfolio} />
                        <Route path="/wealth-management" component={WealthManagement} />
                        <Route path="/support-center" component={SupportCenter} />
                        <Route path="/customer-support" component={CustomerSupport} />
                        <Route path="/about" component={About} />
                        <Route path="/alerts" component={Alerts} />
                        <Route path="/banking-services" component={BankingServices} />
                        <Route path="/digital-wallet" component={DigitalWallet} />
                        <Route path="/mobile-pay" component={MobilePay} />
                        <Route path="/security-center" component={SecurityCenter} />
                        <Route path="/find-branches" component={FindBranches} />
                        <Route path="/international-transfer" component={InternationalTransfer} />
                        <Route path="/investment-trading" component={InvestmentTrading} />
                        <Route path="/business-banking" component={BusinessBanking} />
                        <Route path="/cards" component={Cards} />
                        <Route path="/transfer" component={Transfer} />
                        <Route path="/receive" component={Receive} />
                        <Route path="/add-money" component={AddMoney} />
                        <Route path="/verification" component={VerificationCenter} />
                        <Route path="/account-preferences" component={AccountPreferences} />
                        <Route path="/admin-transaction-dashboard" component={AdminTransactionDashboard} />
                        <Route path="/admin-transaction-creator" component={AdminTransactionCreator} />
                        <Route path="/transaction-router" component={TransactionRouter} />
                        <Route path="/customer-management" component={CustomerManagement} />
                        <Route path="/fund-management" component={FundManagement} />
                        <Route path="/not-found" component={NotFound} />
                        <Route component={NotFound} />
                      </Switch>
                    </div>
                    <BottomNavigation />
                  </ProtectedRoute>
                </Route>
              </Switch>
            </div>
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
      <Toaster />
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;