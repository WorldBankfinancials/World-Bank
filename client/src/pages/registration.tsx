
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Lock, User, Phone, Eye, EyeOff, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { BankLogo } from "@/components/BankLogo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { Building2, Shield, Globe, MapPin, Briefcase, FileText, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Registration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState({
    // Page 1: Personal Information
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    email: "",
    phone: "",
    alternativePhone: "",

    // Page 2: Address Information
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",

    // Page 3: Professional & Financial Information
    occupation: "",
    employer: "",
    annualIncome: "",
    sourceOfIncome: "",
    idType: "",
    idNumber: "",
    idExpiryDate: "",
    issuingCountry: "",

    // Page 4: Security & Terms
    password: "",
    confirmPassword: "",
    transferPin: "",
    confirmTransferPin: "",
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

  const validatePage = (pageNumber: number) => {
    switch (pageNumber) {
      case 1:
        return formData.firstName && formData.lastName && formData.dateOfBirth && 
               formData.email && formData.phone && formData.nationality;
      case 2:
        return formData.address && formData.city && formData.country;
      case 3:
        return formData.occupation && formData.annualIncome && formData.idType && formData.idNumber;
      case 4:
        return formData.password && formData.confirmPassword && formData.transferPin && 
               formData.confirmTransferPin && formData.password === formData.confirmPassword &&
               formData.transferPin === formData.confirmTransferPin && 
               formData.termsAccepted && formData.privacyAccepted;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validatePage(currentPage)) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentPage(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePage(4)) return;

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

  const pageIcons = [User, MapPin, Briefcase, Shield];
  const pageNames = ["Personal Info", "Address Details", "Professional Info", "Security & Terms"];

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
              <p className="text-gray-600">Tell us about yourself to get started</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Last Name *</Label>
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
              <Label className="text-sm font-medium">Middle Name</Label>
              <Input
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                placeholder="Enter middle name (optional)"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Date of Birth *</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Gender</Label>
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
              <Label className="text-sm font-medium">Nationality *</Label>
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
                <Label className="text-sm font-medium">Email Address *</Label>
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
                <Label className="text-sm font-medium">Phone Number *</Label>
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
              <Label className="text-sm font-medium">Alternative Phone</Label>
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
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">Address Information</h3>
              <p className="text-gray-600">Where can we reach you?</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Street Address *</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter complete street address"
                className="mt-1"
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">City *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium">State/Province</Label>
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
                <Label className="text-sm font-medium">Country *</Label>
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
                    <SelectItem value="fr">🇫🇷 France</SelectItem>
                    <SelectItem value="jp">🇯🇵 Japan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Postal Code</Label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="ZIP/Postal code"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">Professional & Financial Information</h3>
              <p className="text-gray-600">Help us understand your financial profile</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Occupation *</Label>
              <Input
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Your occupation"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Employer</Label>
              <Input
                value={formData.employer}
                onChange={(e) => handleInputChange('employer', e.target.value)}
                placeholder="Company name"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Annual Income *</Label>
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
                <Label className="text-sm font-medium">Source of Income</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">ID Document Type *</Label>
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
                <Label className="text-sm font-medium">ID Number *</Label>
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
                <Label className="text-sm font-medium">ID Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.idExpiryDate}
                  onChange={(e) => handleInputChange('idExpiryDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Issuing Country</Label>
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
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">Security & Terms</h3>
              <p className="text-gray-600">Secure your account and accept our terms</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Password *</Label>
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
              <Label className="text-sm font-medium">Confirm Password *</Label>
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
              <Label className="text-sm font-medium">Transfer PIN (6 digits) *</Label>
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
              <Label className="text-sm font-medium">Confirm Transfer PIN *</Label>
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
            
            {/* Progress Steps */}
            <div className="flex justify-center space-x-2 mt-6">
              {[1, 2, 3, 4].map((i) => {
                const Icon = pageIcons[i - 1];
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center ${
                      i === currentPage
                        ? 'text-blue-600'
                        : i < currentPage
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                        i === currentPage
                          ? 'bg-blue-600 text-white'
                          : i < currentPage
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {i < currentPage ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs text-center px-1">{pageNames[i - 1]}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">
                Page {currentPage} of 4
              </span>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={currentPage === 4 ? handleSubmit : (e) => e.preventDefault()}>
              {renderPage()}

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                {currentPage < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!validatePage(currentPage)}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!validatePage(4) || loading}
                    className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{loading ? "Creating Account..." : "Create Account"}</span>
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
