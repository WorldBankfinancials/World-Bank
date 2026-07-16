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

// Per-route error boundary wrapper for lazy-loaded components
function LazyRoute({ Component }: { Component: React.LazyExoticComponent<React.ComponentType> }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
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
                  <Route path="/about" component={() => <LazyRoute Component={About} />} />
                  <Route path="/login" component={Login} />
                  {/* /register redirects to multi-step register */}
                  <Route path="/register"><Redirect to="/register-multi" /></Route>
                  <Route path="/register-multi" component={MultiStepRegister} />
                  <Route path="/admin-login" component={() => <LazyRoute Component={AdminLogin} />} />
                  <Route path="/admin-dashboard">
                    <ProtectedRoute requireAdmin>
                      <LazyRoute Component={AdminDashboard} />
                    </ProtectedRoute>
                  </Route>
                  {/* /simple-admin redirects to /admin-dashboard */}
                  <Route path="/simple-admin"><Redirect to="/admin-dashboard" /></Route>
                  <Route path="/admin-live-chat">
                    <ProtectedRoute requireAdmin>
                      <LazyRoute Component={AdminLiveChat} />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/customer-service">
                    <ProtectedRoute requireAdmin>
                      <LazyRoute Component={CustomerServicePortal} />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/admin-transaction-dashboard">
                    <ProtectedRoute requireAdmin>
                      <LazyRoute Component={AdminTransactionDashboard} />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/admin-transaction-creator">
                    <ProtectedRoute requireAdmin>
                      <LazyRoute Component={AdminTransactionCreator} />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/customer-management">
                    <ProtectedRoute requireAdmin>
                      <LazyRoute Component={CustomerManagement} />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/fund-management">
                    <ProtectedRoute requireAdmin>
                      <LazyRoute Component={FundManagement} />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/transfer-processing">
                    <ProtectedRoute>
                      <LazyRoute Component={TransferProcessing} />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/transfer-pending">
                    <ProtectedRoute>
                      <LazyRoute Component={TransferPending} />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/transfer-success">
                    <ProtectedRoute>
                      <LazyRoute Component={TransferSuccess} />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/transfer-failed">
                    <ProtectedRoute>
                      <LazyRoute Component={TransferFailed} />
                    </ProtectedRoute>
                  </Route>

                  <Route path="/" nest>
                    <ProtectedRoute>
                      <div className="pb-20">
                        <Switch>
                          <Route path="/" component={Dashboard} />
                          <Route path="/dashboard" component={Dashboard} />
                          <Route path="/transfer-funds" component={() => <LazyRoute Component={TransferFunds} />} />
                          {/* /transfer redirects to /transfer-funds */}
                          <Route path="/transfer"><Redirect to="/transfer-funds" /></Route>
                          <Route path="/profile-settings" component={() => <LazyRoute Component={ProfileSettings} />} />
                          <Route path="/security-settings" component={() => <LazyRoute Component={SecuritySettings} />} />
                          <Route path="/pin-settings" component={() => <LazyRoute Component={PinSettings} />} />
                          <Route path="/credit-cards" component={() => <LazyRoute Component={CreditCards} />} />
                          <Route path="/transaction-history" component={() => <LazyRoute Component={TransactionHistory} />} />
                          <Route path="/history" component={() => <LazyRoute Component={History} />} />
                          <Route path="/statements-reports" component={() => <LazyRoute Component={StatementsReports} />} />
                          <Route path="/investment-portfolio" component={() => <LazyRoute Component={InvestmentPortfolio} />} />
                          <Route path="/wealth-management" component={() => <LazyRoute Component={WealthManagement} />} />
                          <Route path="/support-center" component={() => <LazyRoute Component={SupportCenter} />} />
                          <Route path="/customer-support" component={() => <LazyRoute Component={CustomerSupport} />} />
                          <Route path="/banking-services" component={() => <LazyRoute Component={BankingServices} />} />
                          <Route path="/digital-wallet" component={() => <LazyRoute Component={DigitalWallet} />} />
                          <Route path="/mobile-pay" component={() => <LazyRoute Component={MobilePay} />} />
                          <Route path="/security-center" component={() => <LazyRoute Component={SecurityCenter} />} />
                          <Route path="/find-branches" component={() => <LazyRoute Component={FindBranches} />} />
                          <Route path="/international-transfer" component={() => <LazyRoute Component={InternationalTransfer} />} />
                          <Route path="/investment-trading" component={() => <LazyRoute Component={InvestmentTrading} />} />
                          <Route path="/business-banking" component={() => <LazyRoute Component={BusinessBanking} />} />
                          <Route path="/cards" component={() => <LazyRoute Component={Cards} />} />
                          <Route path="/receive" component={() => <LazyRoute Component={Receive} />} />
                          <Route path="/add-money" component={() => <LazyRoute Component={AddMoney} />} />
                          <Route path="/alerts" component={() => <LazyRoute Component={Alerts} />} />
                          <Route path="/verification" component={() => <LazyRoute Component={VerificationCenter} />} />
                          <Route path="/account-preferences" component={() => <LazyRoute Component={AccountPreferences} />} />
                          <Route path="/transaction-router" component={() => <LazyRoute Component={TransactionRouter} />} />
                          <Route path="/investment" component={() => <LazyRoute Component={Investment} />} />
                          <Route path="/exchange" component={() => <LazyRoute Component={Exchange} />} />
                          <Route path="/loans" component={() => <LazyRoute Component={Loans} />} />
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
