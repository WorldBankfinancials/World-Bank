// client/src/pages/login.tsx
import React, { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Smartphone, CreditCard, Shield, Lock, Eye, EyeOff, Globe } from "lucide-react";
import LiveChat from "@/components/LiveChat";
import { BankLogo } from "@/components/BankLogo";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [loginPin, setLoginPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [loginType, setLoginType] = useState<'email' | 'mobile' | 'id'>('email');
  const [loginData, setLoginData] = useState({ email: "", mobile: "", idNumber: "", password: "" });
  const [showLiveChat, setShowLiveChat] = useState(false);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'pending') {
      toast({
        title: "Registration Pending Approval",
        description: "Your registration is being reviewed by our admin team. You'll receive an email once approved.",
        duration: 8000,
      });
    }
  }, [toast]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    try {
      // For now support email + password as primary flow
      if (loginType !== 'email') {
        // If you want mobile OTP later, implement supabase.auth.signInWithOtp({ phone })
        toast({ title: "Login", description: "Please use email login for now", duration: 3000 });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) {
        toast({ title: t('login_failed') || "Login failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // require PIN verification (accounts table must have pin)
      setShowPinVerification(true);
    } catch (err: any) {
      toast({ title: t('login_failed') || "Login failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePinVerification = async () => {
    if (loginPin.length !== 4) {
      setPinError(t('pin_must_be_4_digits') || "PIN must be 4 digits");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) {
        setPinError(t('no_active_session') || "No active session. Please sign in again.");
        return;
      }

      const { data: acc, error } = await supabase
        .from("accounts")
        .select("pin")
        .eq("user_id", user.id)
        .single();

      if (error || !acc) {
        setPinError(t('pin_not_found') || "PIN not found for your account");
        return;
      }

      if (String(acc.pin) === loginPin) {
        setShowPinVerification(false);
        setLoginPin("");
        setPinError("");
        toast({ title: t('login_successful') || "Signed in", description: t('welcome_back') || "Welcome back" });
        setLocation("/dashboard");
      } else {
        setPinError(t('invalid_pin') || "Invalid PIN");
        setLoginPin("");
      }
    } catch (err: any) {
      setPinError(t('verification_failed') || "Verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md relative">
          <div className="flex justify-end mb-6">
            <div className="w-32">
              <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-white/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <BankLogo className="w-20 h-20" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Globe className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">WORLD BANK</h1>
            <p className="text-gray-600 text-xl font-medium mb-2">International Banking Solutions</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Secure • Trusted • Global</span>
            </div>
          </div>

          <Card className="wb-login-card">
            <CardHeader className="space-y-4 pb-6 pt-8">
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Sign In</CardTitle>
                <p className="text-gray-600 text-base">Access your secure banking portal</p>
                <div className="flex justify-center mt-3"><div className="w-16 h-1 bg-blue-600 rounded-full"></div></div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              <Tabs value={loginType} onValueChange={(v) => setLoginType(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="email" className="flex items-center space-x-2 text-xs"><Mail className="w-4 h-4" /><span>Email</span></TabsTrigger>
                  <TabsTrigger value="mobile" className="flex items-center space-x-2 text-xs"><Smartphone className="w-4 h-4" /><span>Mobile</span></TabsTrigger>
                  <TabsTrigger value="id" className="flex items-center space-x-2 text-xs"><CreditCard className="w-4 h-4" /><span>Account ID</span></TabsTrigger>
                </TabsList>

                <form onSubmit={handleLogin} className="space-y-5 mt-6">
                  <TabsContent value="email" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">User ID or Email</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-4 text-gray-500 font-medium text-base">@/</span>
                        <Input
                          id="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                          className="wb-input pl-12 h-14 text-base"
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="mobile" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700">Mobile Number</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                        <Input id="mobile" type="tel" value={loginData.mobile} onChange={(e) => setLoginData(prev => ({ ...prev, mobile: e.target.value }))} className="wb-input pl-12 h-14 text-base" placeholder="Enter mobile number" required={loginType === 'mobile'} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="id" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <Label htmlFor="idNumber" className="text-sm font-semibold text-gray-700">Account ID</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                        <Input id="idNumber" value={loginData.idNumber} onChange={(e) => setLoginData(prev => ({ ...prev, idNumber: e.target.value }))} className="wb-input pl-12 h-14 text-base" placeholder="Enter account ID" required={loginType === 'id'} />
                      </div>
                    </div>
                  </TabsContent>

                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <Input id="password" type={showPassword ? "text" : "password"} value={loginData.password} onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))} className="wb-input pl-12 pr-12 h-14 text-base" placeholder="Enter your password" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" className="wb-button-primary w-full h-14 text-base font-semibold" disabled={loading}>
                      {loading ? <div className="flex items-center space-x-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Signing In...</span></div> : <div className="flex items-center space-x-2"><Shield className="w-5 h-5" /><span>Sign In</span></div>}
                    </Button>
                  </div>
                </form>
              </Tabs>
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">New customer? <button onClick={() => setLocation("/register-multi")} className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all">Create Account</button></p>
              </div>
              <div className="text-center pt-2"><button onClick={() => setLocation("/about")} className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors">About World Bank</button></div>
            </CardContent>
          </Card>

          <div className="text-center mt-8 space-y-4">
            <div className="flex justify-center space-x-6 text-gray-600 text-sm font-medium">
              <button onClick={() => window.open('https://worldbank.org/security', '_blank')} className="hover:text-gray-800 transition-colors flex items-center space-x-1"><Shield className="w-4 h-4" /><span>Security Center</span></button>
              <button onClick={() => window.open('https://worldbank.org/privacy', '_blank')} className="hover:text-gray-800 transition-colors">Privacy Policy</button>
              <button onClick={() => setShowLiveChat(true)} className="hover:text-gray-800 transition-colors">Contact Support</button>
            </div>
            <div className="text-gray-500 text-xs space-y-1">
              <p>© 2025 World Bank Group. All rights reserved.</p>
              <p className="flex items-center justify-center space-x-1"><Shield className="w-3 h-3" /><span>Secure • Trusted • Global Financial Institution</span></p>
              <p>Licensed and regulated by international banking authorities</p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPinVerification} onOpenChange={setShowPinVerification}>
        <DialogContent className="wb-modal sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" />{t('pin_verification_required')}</DialogTitle></DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">{t('enter_pin_complete_login')}</p>
            <div className="space-y-2">
              <Label htmlFor="pin">{t('security_pin')}</Label>
              <Input id="pin" type="password" value={loginPin} onChange={(e) => { setPinError(""); setLoginPin(e.target.value); }} maxLength={4} className="wb-input text-center text-lg tracking-widest" placeholder="••••" onKeyDown={(e) => { if (e.key === 'Enter' && loginPin.length === 4) handlePinVerification(); }} />
              {pinError && <div className="text-sm text-red-600">{pinError}</div>}
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1 wb-btn-outline" onClick={() => { setShowPinVerification(false); setLoginPin(""); setPinError(""); }}>{t('cancel')}</Button>
              <Button className="flex-1 wb-btn-primary" onClick={handlePinVerification} disabled={loginPin.length !== 4}>{t('verify_pin')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LiveChat isOpen={showLiveChat} onClose={() => setShowLiveChat(false)} />
    </div>
  );
}
