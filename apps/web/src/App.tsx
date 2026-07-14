import React, { Suspense, lazy } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";

// Critical path - eager imports
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import MultiStepRegister from "@/pages/register-multi-step";
import NotFound from "@/pages/not-found";

// Non-critical pages - lazy loaded
const ProfileSettings = lazy(() => import("@/pages/profile-settings"));
const SecuritySettings = lazy(() => import("@/pages/security-settings"));
const PinSettings = lazy(() => import("@/pages/pin-settings"));
const CreditCards = lazy(() => import("@/pages/credit-cards"));
const TransactionHistory = lazy(() => import("@/pages/transaction-history"));
const History = lazy(() => import("@/pages/history"));
const StatementsReports = lazy(() => import("@/pages/statements-reports"));
const InvestmentPortfolio = lazy(() => import("@/pages/investment-portfolio"));
const WealthManagement = lazy(() => import("@/pages/wealth-management"));
const SupportCenter = lazy(() => import("@/pages/support-center"));
const CustomerSupport = lazy(() => import("@/pages/customer-support"));
const BankingServices = lazy(() => import("./pages/banking-services"));
const DigitalWallet = lazy(() => import("./pages/digital-wallet"));
const MobilePay = lazy(() => import("./pages/mobile-pay"));
const SecurityCenter = lazy(() => import("./pages/security-center"));
const FindBranches = lazy(() => import("./pages/find-branches"));
const InternationalTransfer = lazy(() => import("./pages/international-transfer"));
const InvestmentTrading = lazy(() => import("./pages/investment-trading"));
const BusinessBanking = lazy(() => import("./pages/business-banking"));
const Cards = lazy(() => import("@/pages/cards"));
const Receive = lazy(() => import("@/pages/receive"));
const AddMoney = lazy(() => import("@/pages/add-money"));
const Alerts = lazy(() => import("@/pages/alerts"));
const AccountPreferences = lazy(() => import("@/pages/account-preferences"));
const TransactionRouter = lazy(() => import("@/pages/transaction-router"));
const About = lazy(() => import("@/pages/about"));
const Investment = lazy(() => import("@/pages/investment"));
const Exchange = lazy(() => import("@/pages/exchange"));
const Loans = lazy(() => import("@/pages/loans"));
const TransferFunds = lazy(() => import("@/pages/transfer-funds"));

// Admin pages - lazy loaded
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminLiveChat = lazy(() => import("@/pages/admin-live-chat"));
const CustomerServicePortal = lazy(() => import("@/pages/customer-service-portal"));
const VerificationCenter = lazy(() => import("@/pages/verification"));
const CustomerManagement = lazy(() => import("@/pages/customer-management"));
const FundManagement = lazy(() => import("@/pages/fund-management"));
const AdminTransactionDashboard = lazy(() => import("@/pages/admin-transaction-dashboard"));
const AdminTransactionCreator = lazy(() => import("@/pages/admin-transaction-creator"));

// Transfer flow pages - lazy loaded
const TransferProcessing = lazy(() => import("@/pages/transfer-processing"));
const TransferPending = lazy(() => import("@/pages/transfer-pending"));
const TransferSuccess = lazy(() => import("@/pages/transfer-success"));
const TransferFailed = lazy(() => import("@/pages/transfer-failed"));

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import BottomNavigation from "@/components/BottomNavigation";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <LanguageProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                <Suspense fallback={<LoadingSpinner />}>
                <Switch>
                  <Route path="/about" component={About} />
                  <Route path="/login" component={Login} />
                  {/* /register redirects to multi-step register */}
                  <Route path="/register"><Redirect to="/register-multi" /></Route>
                  <Route path="/register-multi" component={MultiStepRegister} />
                  <Route path="/admin-login" component={AdminLogin} />
                  <Route path="/admin-dashboard">
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Route>
                  {/* /simple-admin redirects to /admin-dashboard */}
                  <Route path="/simple-admin"><Redirect to="/admin-dashboard" /></Route>
                  <Route path="/admin-live-chat">
                    <ProtectedRoute requireAdmin>
                      <AdminLiveChat />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/customer-service">
                    <ProtectedRoute requireAdmin>
                      <CustomerServicePortal />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/admin-transaction-dashboard">
                    <ProtectedRoute requireAdmin>
                      <AdminTransactionDashboard />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/admin-transaction-creator">
                    <ProtectedRoute requireAdmin>
                      <AdminTransactionCreator />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/customer-management">
                    <ProtectedRoute requireAdmin>
                      <CustomerManagement />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/fund-management">
                    <ProtectedRoute requireAdmin>
                      <FundManagement />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/transfer-processing">
                    <ProtectedRoute>
                      <TransferProcessing />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/transfer-pending">
                    <ProtectedRoute>
                      <TransferPending />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/transfer-success">
                    <ProtectedRoute>
                      <TransferSuccess />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/transfer-failed">
                    <ProtectedRoute>
                      <TransferFailed />
                    </ProtectedRoute>
                  </Route>

                  <Route path="/" nest>
                    <ProtectedRoute>
                      <div className="pb-20">
                        <Switch>
                          <Route path="/" component={Dashboard} />
                          <Route path="/dashboard" component={Dashboard} />
                          <Route path="/transfer-funds" component={TransferFunds} />
                          {/* /transfer redirects to /transfer-funds */}
                          <Route path="/transfer"><Redirect to="/transfer-funds" /></Route>
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
                          <Route path="/banking-services" component={BankingServices} />
                          <Route path="/digital-wallet" component={DigitalWallet} />
                          <Route path="/mobile-pay" component={MobilePay} />
                          <Route path="/security-center" component={SecurityCenter} />
                          <Route path="/find-branches" component={FindBranches} />
                          <Route path="/international-transfer" component={InternationalTransfer} />
                          <Route path="/investment-trading" component={InvestmentTrading} />
                          <Route path="/business-banking" component={BusinessBanking} />
                          <Route path="/cards" component={Cards} />
                          <Route path="/receive" component={Receive} />
                          <Route path="/add-money" component={AddMoney} />
                          <Route path="/alerts" component={Alerts} />
                          <Route path="/verification" component={VerificationCenter} />
                          <Route path="/account-preferences" component={AccountPreferences} />
                          <Route path="/transaction-router" component={TransactionRouter} />
                          <Route path="/investment" component={Investment} />
                          <Route path="/exchange" component={Exchange} />
                          <Route path="/loans" component={Loans} />
                          <Route component={NotFound} />
                        </Switch>
                      </div>
                      <BottomNavigation />
                    </ProtectedRoute>
                  </Route>
                </Switch>
                </Suspense>
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
