// client/src/pages/login.tsx
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Mail,
  Smartphone,
  CreditCard,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react";
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
  const [loginType, setLoginType] = useState<"email" | "mobile" | "id">("email");
  const [loginData, setLoginData] = useState({
    email: "",
    mobile: "",
    idNumber: "",
    password: "",
  });
  const [showLiveChat, setShowLiveChat] = useState(false);

  // Registration pending check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("status") === "pending") {
      toast({
        title: "Registration Pending Approval",
        description:
          "Your registration is being reviewed by our admin team. You'll receive an email once approved.",
        duration: 8000,
      });
    }
  }, [toast]);

  /** Email Login */
  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    try {
      if (loginType !== "email") {
        toast({
          title: "Login",
          description: "Please use email login for now",
          duration: 3000,
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        toast({
          title: t("login_failed") || "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Require PIN verification
      setShowPinVerification(true);
    } catch (err: any) {
      toast({
        title: t("login_failed") || "Login failed",
        description: err.message || String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** PIN Verification */
  const handlePinVerification = async () => {
    if (loginPin.length !== 4) {
      setPinError(t("pin_must_be_4_digits") || "PIN must be 4 digits");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) {
        setPinError(t("no_active_session") || "No active session. Please sign in again.");
        return;
      }

      const { data: acc, error } = await supabase
        .from("accounts")
        .select("pin")
        .eq("user_id", user.id)
        .single();

      if (error || !acc) {
        setPinError(t("pin_not_found") || "PIN not found for your account");
        return;
      }

      if (String(acc.pin) === loginPin) {
        setShowPinVerification(false);
        setLoginPin("");
        setPinError("");
        toast({
          title: t("login_successful") || "Signed in",
          description: t("welcome_back") || "Welcome back",
        });
        setLocation("/dashboard");
      } else {
        setPinError(t("invalid_pin") || "Invalid PIN");
        setLoginPin("");
      }
    } catch {
      setPinError(t("verification_failed") || "Verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md relative">
          {/* Language Selector */}
          <div className="flex justify-end mb-6">
            <div className="w-32">
              <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
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

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <BankLogo className="w-20 h-20" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Globe className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              WORLD BANK
            </h1>
            <p className="text-gray-600 text-xl font-medium mb-2">
              International Banking Solutions
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Secure • Trusted • Global</span>
            </div>
          </div>

          {/* Login Card */}
          <Card className="wb-login-card">
            <CardHeader className="space-y-4 pb-6 pt-8">
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Sign In
                </CardTitle>
                <p className="text-gray-600 text-base">
                  Access your secure banking portal
                </p>
                <div className="flex justify-center mt-3">
                  <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              <Tabs value={loginType} onValueChange={(v) => setLoginType(v as any)}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="email" className="flex items-center space-x-2 text-xs">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="flex items-center space-x-2 text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile</span>
                  </TabsTrigger>
                  <TabsTrigger value="id" className="flex items-center space-x-2 text-xs">
                    <CreditCard className="w-4 h-4" />
                    <span>Account ID</span>
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleLogin} className="space-y-5 mt-6">
                  {/* Email */}
                  <TabsContent value="email" className="space-y-4 mt-4">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Enter email"
                      required={loginType === "email"}
                      className="h-12"
                    />
                  </TabsContent>

                  {/* Mobile */}
                  <TabsContent value="mobile" className="space-y-4 mt-4">
                    <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700">
                      Mobile Number
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={loginData.mobile}
                      onChange={(e) =>
                        setLoginData((prev) => ({ ...prev, mobile: e.target.value }))
                      }
                      placeholder="Enter mobile number"
                      required={loginType === "mobile"}
                      className="h-12"
                    />
                  </TabsContent>

                  {/* ID */}
                  <TabsContent value="id" className="space-y-4 mt-4">
                    <Label htmlFor="idNumber" className="text-sm font-semibold text-gray-700">
                      Account ID
                    </Label>
                    <Input
                      id="idNumber"
                      value={loginData.idNumber}
                      onChange={(e) =>
                        setLoginData((prev) => ({ ...prev, idNumber: e.target.value }))
                      }
                      placeholder="Enter account ID"
                      required={loginType === "id"}
                      className="h-12"
                    />
                  </TabsContent>

                  {/* Password */}
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        placeholder="Enter your password"
                        required
                        className="pl-12 pr-12 h-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-12"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Tabs>

              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  New customer?{" "}
                  <button
                    onClick={() => setLocation("/register-multi")}
                    className="text-blue-600 hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 space-y-4">
            <button
              onClick={() => setShowLiveChat(true)}
              className="text-gray-600 hover:underline text-sm"
            >
              Contact Support
            </button>
            <div className="text-gray-500 text-xs">
              © 2025 World Bank Group. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* PIN Verification Dialog */}
      <Dialog open={showPinVerification} onOpenChange={setShowPinVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PIN Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="pin">Enter your 4-digit PIN</Label>
            <Input
              id="pin"
              type="password"
              value={loginPin}
              onChange={(e) => {
                setPinError("");
                setLoginPin(e.target.value);
              }}
              maxLength={4}
              className="text-center text-lg tracking-widest"
              onKeyDown={(e) => {
                if (e.key === "Enter" && loginPin.length === 4) {
                  handlePinVerification();
                }
              }}
            />
            {pinError && <div className="text-sm text-red-600">{pinError}</div>}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPinVerification(false);
                  setLoginPin("");
                  setPinError("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handlePinVerification}
                disabled={loginPin.length !== 4}
              >
                Verify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LiveChat isOpen={showLiveChat} onClose={() => setShowLiveChat(false)} />
    </div>
  );
}
