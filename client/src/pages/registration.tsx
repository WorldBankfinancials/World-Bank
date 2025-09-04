import React, { useState, useEffect, createContext, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Lock, User, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { BankLogo } from "@/components/BankLogo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { Building2, Shield, Globe, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Registration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",

    // Contact Information
    email: "",
    phone: "",
    alternativePhone: "",

    // Address Information
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",

    // Professional Information
    occupation: "",
    employer: "",
    annualIncome: "",
    sourceOfIncome: "",

    // Identification
    idType: "",
    idNumber: "",
    idExpiryDate: "",
    issuingCountry: "",

    // Account Information
    password: "",
    confirmPassword: "",
    transferPin: "",
    confirmTransferPin: "",

    // Agreements
    termsAccepted: false,
    privacyAccepted: false,
    marketingOptIn: false,
  });

  const generateUserId = () => {
    const prefix = "WB";
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return prefix + random;
  };

  const generateAccountNumber = () => {
    return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.firstName && formData.lastName && formData.dateOfBirth && 
               formData.email && formData.phone && formData.nationality;
      case 2:
        return formData.address && formData.city && formData.country && 
               formData.occupation && formData.annualIncome;
      case 3:
        return formData.idType && formData.idNumber && formData.password && 
               formData.confirmPassword && formData.transferPin && 
               formData.password === formData.confirmPassword &&
               formData.transferPin === formData.confirmTransferPin;
      case 4:
        return formData.termsAccepted && formData.privacyAccepted;
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        toast({
          title: "Registration Failed",
          description: authError.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Create user profile
      const userId = generateUserId();
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user?.id,
          email: formData.email,
          phone: formData.phone,
          user_id: userId,
          full_name: `${formData.firstName} ${formData.lastName}`,
          date_of_birth: formData.dateOfBirth,
          address: formData.address,
          city: formData.city,
          state: formData.state || '',
          country: formData.country,
          postal_code: formData.postalCode || '',
          occupation: formData.occupation,
          annual_income: formData.annualIncome,
          id_type: formData.idType,
          id_number: formData.idNumber,
          transfer_pin: formData.transferPin,
          is_verified: false,
        });

      if (profileError) {
        toast({
          title: "Registration Failed",
          description: "Failed to create user profile",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Create default accounts
      const accountNumber = generateAccountNumber();
      const { error: accountError } = await supabase
        .from('accounts')
        .insert([
          {
            user_id: authData.user?.id,
            account_number: accountNumber,
            account_type: 'checking',
            balance: 0,
            currency: 'USD',
            is_active: true,
          },
          {
            user_id: authData.user?.id,
            account_number: generateAccountNumber(),
            account_type: 'savings',
            balance: 0,
            currency: 'USD',
            is_active: true,
          }
        ]);

      if (accountError) {
        // Silent account creation handling
      }

      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account",
      });

      setLocation("/login");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Middle Name</Label>
              <Input
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                placeholder="Enter middle name (optional)"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth *</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nationality *</Label>
              <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">🇺🇸 United States</SelectItem>
                  <SelectItem value="cn">🇨🇳 China</SelectItem>
                  <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                  <SelectItem value="au">🇦🇺 Australia</SelectItem>
                  <SelectItem value="de">🇩🇪 Germany</SelectItem>
                  <SelectItem value="fr">🇫🇷 France</SelectItem>
                  <SelectItem value="jp">🇯🇵 Japan</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Alternative Phone</Label>
              <Input
                value={formData.alternativePhone}
                onChange={(e) => handleInputChange('alternativePhone', e.target.value)}
                placeholder="Alternative contact number"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address & Professional Information</h3>

            <div>
              <Label>Street Address *</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter complete street address"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>State/Province</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State or Province"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country *</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">🇺🇸 United States</SelectItem>
                    <SelectItem value="cn">🇨🇳 China</SelectItem>
                    <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                    <SelectItem value="au">🇦🇺 Australia</SelectItem>
                    <SelectItem value="de">🇩🇪 Germany</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="ZIP/Postal code"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Occupation *</Label>
              <Input
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Your occupation"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label>Employer</Label>
              <Input
                value={formData.employer}
                onChange={(e) => handleInputChange('employer', e.target.value)}
                placeholder="Company name"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Annual Income *</Label>
                <Select value={formData.annualIncome} onValueChange={(value) => handleInputChange('annualIncome', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-25k">Under $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                    <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
                    <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
                    <SelectItem value="500k+">$500,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source of Income</Label>
                <Select value={formData.sourceOfIncome} onValueChange={(value) => handleInputChange('sourceOfIncome', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employment">Employment</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Identification & Security</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID Document Type *</Label>
                <Select value={formData.idType} onValueChange={(value) => handleInputChange('idType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="national-id">National ID</SelectItem>
                    <SelectItem value="drivers-license">Driver's License</SelectItem>
                    <SelectItem value="residence-permit">Residence Permit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ID Number *</Label>
                <Input
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  placeholder="ID document number"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.idExpiryDate}
                  onChange={(e) => handleInputChange('idExpiryDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Issuing Country</Label>
                <Select value={formData.issuingCountry} onValueChange={(value) => handleInputChange('issuingCountry', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">🇺🇸 United States</SelectItem>
                    <SelectItem value="cn">🇨🇳 China</SelectItem>
                    <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create strong password"
                  className="mt-1 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label>Confirm Password *</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="mt-1 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
            </div>

            <div>
              <Label>Transfer PIN (6 digits) *</Label>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  value={formData.transferPin}
                  onChange={(e) => handleInputChange('transferPin', e.target.value)}
                  placeholder="Create 6-digit PIN"
                  className="mt-1 text-center text-xl letter-spacing-wide pr-10"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label>Confirm Transfer PIN *</Label>
              <Input
                type={showPin ? "text" : "password"}
                value={formData.confirmTransferPin}
                onChange={(e) => handleInputChange('confirmTransferPin', e.target.value)}
                placeholder="Confirm 6-digit PIN"
                className="mt-1 text-center text-xl letter-spacing-wide"
                maxLength={6}
                required
              />
              {formData.transferPin && formData.confirmTransferPin && formData.transferPin !== formData.confirmTransferPin && (
                <p className="text-red-500 text-sm mt-1">PINs do not match</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Terms & Conditions</h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => handleInputChange('termsAccepted', checked)}
                  className="mt-1"
                />
                <div>
                  <Label className="text-sm">
                    I agree to the{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/banking-agreement" className="text-blue-600 hover:underline">
                      Banking Agreement
                    </a>
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={formData.privacyAccepted}
                  onCheckedChange={(checked) => handleInputChange('privacyAccepted', checked)}
                  className="mt-1"
                />
                <div>
                  <Label className="text-sm">
                    I acknowledge that I have read and understand the{" "}
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={formData.marketingOptIn}
                  onCheckedChange={(checked) => handleInputChange('marketingOptIn', checked)}
                  className="mt-1"
                />
                <div>
                  <Label className="text-sm">
                    I would like to receive promotional emails and updates about World Bank services (optional)
                  </Label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Account Security Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your account will be protected with 256-bit encryption</li>
                <li>• Two-factor authentication will be enabled by default</li>
                <li>• All transactions require your transfer PIN for verification</li>
                <li>• Account verification may take 1-3 business days</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* World Bank Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-2">
              <img 
                src="/world-bank-logo.jpeg" 
                alt="World Bank Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/World_Bank_Group_logo.svg/1200px-World_Bank_Group_logo.svg.png";
                }}
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">WORLD BANK</h1>
          <p className="text-blue-200">Open Your International Banking Account</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Account Registration</CardTitle>
            <div className="flex justify-center space-x-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i === step
                      ? 'bg-blue-600 text-white'
                      : i < step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i}
                </div>
              ))}
            </div>
            <div className="text-center mt-2">
              <span className="text-sm text-gray-600">
                Step {step} of 4: {
                  step === 1 ? "Personal Information" :
                  step === 2 ? "Address & Professional" :
                  step === 3 ? "Identification & Security" :
                  "Terms & Conditions"
                }
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}>
              {renderStep()}

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 1}
                >
                  Previous
                </Button>

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={!validateStep(step)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!validateStep(4) || loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                )}
              </div>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  Sign in here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-blue-200 text-sm">
          © 2024 World Bank. All rights reserved.
        </div>
      </div>
    </div>
  );
}
