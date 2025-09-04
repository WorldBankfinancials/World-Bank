// client/src/pages/login.tsx
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Eye, EyeOff, Mail, Smartphone, CreditCard, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveChat from "@/components/LiveChat";
import { BankLogo } from "@/components/BankLogo";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();

  const [loginType, setLoginType] = useState<'email' | 'mobile' | 'id'>('email');
  const [loginData, setLoginData] = useState({ email: "", mobile: "", idNumber: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [loginPin, setLoginPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showLiveChat, setShowLiveChat] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'pending') {
      toast({
        title: "Registration Pending Approval",
        description: "Your registration is being reviewed. You will receive an email once approved.",
        duration: 8000,
      });
    }
  }, [toast]);

  // Handle Supabase login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Determine identifier for multi-login
      let identifier = loginType === 'email' ? loginData.email :
                       loginType === 'mobile' ? loginData.mobile :
                       loginData.idNumber;

      // Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginType === 'email' ? identifier : `${identifier}@wb.com`,
        password: loginData.password
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage("Signed in — redirecting...");
      setTimeout(() => setLocation("/dashboard"), 600);

    } catch (err: any) {
      setMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Supabase magic link
  const handleMagicLink = async () => {
    if (!loginData.email) return setMessage("Enter an email for magic link.");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ email: loginData.email });
    setLoading(false);

    if (error) setMessage(error.message);
    else setMessage("Magic link sent to your email (check spam).");
  };

  // PIN verification
  const handlePinVerification = async () => {
    if (loginPin.length !== 4) {
      setPinError(t('pin_must_be_4_digits'));
      return;
    }

    try {
      let identifier = loginType === 'email' ? loginData.email :
                       loginType === 'mobile' ? loginData.mobile :
                       loginData.idNumber;

      const response = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, pin: loginPin }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.verified) {
        setShowPinVerification(false);
        setLoginPin("");
        setPinError("");
        toast({ title: t('login_successful'), description: t('welcome_back') });
        setLocation("/dashboard");
      } else {
        setPinError(t('invalid_pin'));
        setLoginPin("");
      }
    } catch (error) {
      setPinError(t('verification_failed'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md relative">

          {/* Language Selector */}
          <div className="flex justify-end mb-6">
            <div className="w-32">
              <Select value={language} onValueChange={(value: 'en' | 'zh') => setLanguage(value)}>
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

          {/* Bank Logo & Title */}
          <div className="text-center mb-8">
            <BankLogo className="w-20 h-20 mx-auto" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">WORLD BANK</h1>
            <p className="text-gray-600 text-xl font-medium mb-2">International Banking Solutions</p>
          </div>

          <Card className="wb-login-card">
            <CardHeader className="space-y-4 pb-6 pt-8">
              <CardTitle className="text-2xl text-center font-bold">Sign In</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'email'|'mobile'|'id')} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="email" className="flex items-center space-x-2 text-xs"><Mail className="w-4 h-4" /><span>Email</span></TabsTrigger>
                  <TabsTrigger value="mobile" className="flex items-center space-x-2 text-xs"><Smartphone className="w-4 h-4" /><span>Mobile</span></TabsTrigger>
                  <TabsTrigger value="id" className="flex items-center space-x-2 text-xs"><CreditCard className="w-4 h-4" /><span>ID</span></TabsTrigger>
                </TabsList>

                <form onSubmit={handleLogin} className="space-y-5 mt-6">
                  <TabsContent value="email">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={loginData.email} onChange={e => setLoginData(prev => ({ ...prev, email: e.target.value }))} required />
                  </TabsContent>
                  <TabsContent value="mobile">
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input id="mobile" type="tel" value={loginData.mobile} onChange={e => setLoginData(prev => ({ ...prev, mobile: e.target.value }))} required />
                  </TabsContent>
                  <TabsContent value="id">
                    <Label htmlFor="idNumber">Account ID</Label>
                    <Input id="idNumber" type="text" value={loginData.idNumber} onChange={e => setLoginData(prev => ({ ...prev, idNumber: e.target.value }))} required />
                  </TabsContent>

                  {/* Password */}
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={loginData.password} onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2">
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  {/* Error Message */}
                  {message && <div className="text-sm text-red-600">{message}</div>}

                  {/* Login Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Signing in..." : "Sign in"}
                    </Button>
                    <Button variant="outline" onClick={handleMagicLink} disabled={loading}>
                      Magic link
                    </Button>
                  </div>
                </form>
              </Tabs>

              {/* Create Account */}
              <div className="text-center pt-4">
                <button onClick={() => setLocation("/register-multi")} className="text-blue-600">Create Account</button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PIN Verification */}
      <Dialog open={showPinVerification} onOpenChange={setShowPinVerification}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle><Shield /> PIN Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="pin">Enter 4-digit PIN</Label>
            <Input id="pin" type="password" value={loginPin} maxLength={4} onChange={e => { setLoginPin(e.target.value); setPinError(""); }} />
            {pinError && <Alert variant="destructive"><AlertDescription>{pinError}</AlertDescription></Alert>}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => { setShowPinVerification(false); setLoginPin(""); setPinError(""); }}>Cancel</Button>
              <Button onClick={handlePinVerification} disabled={loginPin.length !== 4}>Verify</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Chat */}
      <LiveChat isOpen={showLiveChat} onClose={() => setShowLiveChat(false)} />
    </div>
  );
}
