import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Eye, EyeOff, Mail, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { BankLogo } from "@/components/BankLogo";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import LiveChat from "@/components/LiveChat";
import { authenticatedFetch } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'pending') {
      toast({
        title: "Registration Pending Approval",
        description: "Your registration is being reviewed. You'll receive an email once approved.",
        duration: 8000,
      });
    }
  }, [toast]);

  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const { error: queryError } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    },
    retry: false,
    staleTime: Infinity,
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      toast({ title: "Please enter both email and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signIn(credentials.email, credentials.password);
      toast({ title: "Welcome back!", description: "Login successful" });
      setLocation('/dashboard');
    } catch (err) {
      toast({
        title: "Login Failed",
        description: err instanceof Error ? err.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-32">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="zh">中文</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BankLogo className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">World Bank</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('email') || 'Email'}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input id="email" type="email" placeholder="you@example.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className="pl-10" required />
                </div>
              </div>
              <div>
                <Label htmlFor="password">{t('password') || 'Password'}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="********"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 text-white h-12">
                {loading ? "Signing in..." : t('sign_in') || "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setLocation('/register')} className="text-blue-600 hover:underline text-sm">
                {t('no_account') || "Don't have an account? Register"}
              </button>
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => setLocation('/admin-login')} className="text-gray-500 hover:underline text-sm">
                {t('admin_login') || "Admin Login"}
              </button>
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <button onClick={() => setLocation('/about')} className="text-gray-500 hover:underline text-sm">
            {t('about_us') || "About Us"}
          </button>
        </div>
      </div>
      <LiveChat />
    </div>
  );
}
