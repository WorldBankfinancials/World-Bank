import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { BankLogo } from "@/components/BankLogo";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { currentLanguage, languages, changeLanguage } = useLanguage();
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [loginPin, setLoginPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (user) {
    setLocation('/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const result = await signIn(loginData.email, loginData.password);

      if (result.error) {
        toast({
          title: 'Login Failed',
          description: result.error,
          variant: "destructive"
        });
        setLoginLoading(false);
        return;
      }

      // Always require PIN verification for enhanced security
      setShowPinVerification(true);
      setLoginLoading(false);
      return;

    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePinVerification = async () => {
    if (loginPin.length !== 4) {
      setPinError("PIN must be 4 digits");
      return;
    }

    try {
      // For demo purposes, accept any 4-digit PIN
      // In production, this would verify against the user's actual PIN
      if (loginPin === "1234" || loginPin === "0000" || loginPin.length === 4) {
        setShowPinVerification(false);
        setLocation("/dashboard");
      } else {
        setPinError("Invalid PIN. Please try again.");
      }
    } catch (error) {
      setPinError("PIN verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Top Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <Select value={currentLanguage?.code || 'en'} onValueChange={changeLanguage}>
          <SelectTrigger className="w-32 bg-white/80 backdrop-blur-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="flex items-center space-x-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 text-white p-8 flex-col justify-between">
          <div>
            <BankLogo className="w-16 h-16" />
            <h1 className="text-4xl font-bold mt-8 mb-4">WORLD BANK</h1>
            <p className="text-blue-100 text-xl mb-8">Secure, Trusted & Global</p>
            <p className="text-blue-200 text-lg">Banking Services</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">personal_banking</h3>
                <p className="text-blue-200 text-sm">Business Banking</p>
                <p className="text-blue-200 text-sm">investment_services</p>
                <p className="text-blue-200 text-sm">Loans & Credit</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Support</h3>
                <p className="text-blue-200 text-sm">Help Center</p>
                <p className="text-blue-200 text-sm">Contact Us</p>
                <p className="text-blue-200 text-sm">Security Center</p>
                <p className="text-blue-200 text-sm">Privacy Policy</p>
              </div>
            </div>
            
            <div className="border-t border-blue-700 pt-4">
              <div className="flex justify-between text-sm text-blue-300">
                <button className="hover:text-white transition-colors">Security Center</button>
                <button className="hover:text-white transition-colors">Privacy Policy</button>
                <button className="hover:text-white transition-colors">Contact Support</button>
              </div>
            </div>
            <div className="text-gray-500 text-xs space-y-1">
              <p>Copyright Notice</p>
              <p>Secure, Trusted & Global</p>
              <p>Licensed & Regulated</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="lg:hidden mb-6">
                <BankLogo className="w-12 h-12 mx-auto" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
              <p className="mt-2 text-gray-600">
                New Customer? <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Create Account</a>
              </p>
            </div>

            <Card className="wb-card shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Lock className="w-5 h-5 text-blue-600" />
                  Secure Login
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">User ID or Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="wb-input h-12"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="wb-input h-12 pr-12"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="wb-button-primary w-full h-14 text-base"
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Signing In...</span>
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Mobile Footer */}
            <div className="lg:hidden mt-8 text-center space-y-4">
              <div className="flex justify-center space-x-6 text-sm">
                <button className="hover:text-gray-800 transition-colors">Security Center</button>
                <button className="hover:text-gray-800 transition-colors">Privacy Policy</button>
                <button className="hover:text-gray-800 transition-colors">Contact Support</button>
              </div>
              <div className="text-gray-500 text-xs space-y-1">
                <p>Copyright Notice</p>
                <p>Secure, Trusted & Global</p>
                <p>Licensed & Regulated</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <div className="flex flex-col items-center space-y-1 text-xs">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
            <span className="text-blue-600">Home</span>
          </div>
          <div className="flex flex-col items-center space-y-1 text-xs text-gray-500">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span>Cards</span>
          </div>
          <div className="flex flex-col items-center space-y-1 text-xs text-gray-500">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span>Transfer</span>
          </div>
          <div className="flex flex-col items-center space-y-1 text-xs text-gray-500">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span>History</span>
          </div>
          <div className="flex flex-col items-center space-y-1 text-xs text-gray-500">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span>Profile</span>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <Dialog open={showPinVerification} onOpenChange={setShowPinVerification}>
        <DialogContent className="wb-modal sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              PIN Verification Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please enter your 4-digit security PIN to complete login
            </p>

            <div className="space-y-2">
              <Label htmlFor="pin">Security PIN</Label>
              <Input
                id="pin"
                type="password"
                value={loginPin}
                onChange={(e) => {
                  setPinError("");
                  setLoginPin(e.target.value);
                }}
                maxLength={4}
                className="wb-input text-center text-lg tracking-widest"
                placeholder="••••"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && loginPin.length === 4) {
                    handlePinVerification();
                  }
                }}
              />
              {pinError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{pinError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1 wb-btn-outline"
                onClick={() => {
                  setShowPinVerification(false);
                  setLoginPin("");
                  setPinError("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 wb-btn-primary"
                onClick={handlePinVerification}
                disabled={loginPin.length !== 4}
              >
                Verify PIN
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}