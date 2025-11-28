import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Check } from "lucide-react";
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
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const validateStep = (stepNumber) => {
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(4))
            return;
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
        }
        catch (error) {
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
                return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Personal Information" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "First Name *" }), _jsx(Input, { value: formData.firstName, onChange: (e) => handleInputChange('firstName', e.target.value), placeholder: "Enter first name", className: "mt-1", required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "Last Name *" }), _jsx(Input, { value: formData.lastName, onChange: (e) => handleInputChange('lastName', e.target.value), placeholder: "Enter last name", className: "mt-1", required: true })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Middle Name" }), _jsx(Input, { value: formData.middleName, onChange: (e) => handleInputChange('middleName', e.target.value), placeholder: "Enter middle name (optional)", className: "mt-1" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Date of Birth *" }), _jsx(Input, { type: "date", value: formData.dateOfBirth, onChange: (e) => handleInputChange('dateOfBirth', e.target.value), className: "mt-1", required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "Gender" }), _jsxs(Select, { value: formData.gender, onValueChange: (value) => handleInputChange('gender', value), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Select gender" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "male", children: "Male" }), _jsx(SelectItem, { value: "female", children: "Female" }), _jsx(SelectItem, { value: "other", children: "Other" }), _jsx(SelectItem, { value: "prefer-not-to-say", children: "Prefer not to say" })] })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Nationality *" }), _jsxs(Select, { value: formData.nationality, onValueChange: (value) => handleInputChange('nationality', value), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Select nationality" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "us", children: "\uD83C\uDDFA\uD83C\uDDF8 United States" }), _jsx(SelectItem, { value: "cn", children: "\uD83C\uDDE8\uD83C\uDDF3 China" }), _jsx(SelectItem, { value: "uk", children: "\uD83C\uDDEC\uD83C\uDDE7 United Kingdom" }), _jsx(SelectItem, { value: "ca", children: "\uD83C\uDDE8\uD83C\uDDE6 Canada" }), _jsx(SelectItem, { value: "au", children: "\uD83C\uDDE6\uD83C\uDDFA Australia" }), _jsx(SelectItem, { value: "de", children: "\uD83C\uDDE9\uD83C\uDDEA Germany" }), _jsx(SelectItem, { value: "fr", children: "\uD83C\uDDEB\uD83C\uDDF7 France" }), _jsx(SelectItem, { value: "jp", children: "\uD83C\uDDEF\uD83C\uDDF5 Japan" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Email Address *" }), _jsx(Input, { type: "email", value: formData.email, onChange: (e) => handleInputChange('email', e.target.value), placeholder: "your@email.com", className: "mt-1", required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "Phone Number *" }), _jsx(Input, { value: formData.phone, onChange: (e) => handleInputChange('phone', e.target.value), placeholder: "+1 234 567 8900", className: "mt-1", required: true })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Alternative Phone" }), _jsx(Input, { value: formData.alternativePhone, onChange: (e) => handleInputChange('alternativePhone', e.target.value), placeholder: "Alternative contact number", className: "mt-1" })] })] }));
            case 2:
                return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Address & Professional Information" }), _jsxs("div", { children: [_jsx(Label, { children: "Street Address *" }), _jsx(Textarea, { value: formData.address, onChange: (e) => handleInputChange('address', e.target.value), placeholder: "Enter complete street address", className: "mt-1", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "City *" }), _jsx(Input, { value: formData.city, onChange: (e) => handleInputChange('city', e.target.value), placeholder: "City", className: "mt-1", required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "State/Province" }), _jsx(Input, { value: formData.state, onChange: (e) => handleInputChange('state', e.target.value), placeholder: "State or Province", className: "mt-1" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Country *" }), _jsxs(Select, { value: formData.country, onValueChange: (value) => handleInputChange('country', value), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Select country" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "us", children: "\uD83C\uDDFA\uD83C\uDDF8 United States" }), _jsx(SelectItem, { value: "cn", children: "\uD83C\uDDE8\uD83C\uDDF3 China" }), _jsx(SelectItem, { value: "uk", children: "\uD83C\uDDEC\uD83C\uDDE7 United Kingdom" }), _jsx(SelectItem, { value: "ca", children: "\uD83C\uDDE8\uD83C\uDDE6 Canada" }), _jsx(SelectItem, { value: "au", children: "\uD83C\uDDE6\uD83C\uDDFA Australia" }), _jsx(SelectItem, { value: "de", children: "\uD83C\uDDE9\uD83C\uDDEA Germany" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Postal Code" }), _jsx(Input, { value: formData.postalCode, onChange: (e) => handleInputChange('postalCode', e.target.value), placeholder: "ZIP/Postal code", className: "mt-1" })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Occupation *" }), _jsx(Input, { value: formData.occupation, onChange: (e) => handleInputChange('occupation', e.target.value), placeholder: "Your occupation", className: "mt-1", required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "Employer" }), _jsx(Input, { value: formData.employer, onChange: (e) => handleInputChange('employer', e.target.value), placeholder: "Company name", className: "mt-1" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Annual Income *" }), _jsxs(Select, { value: formData.annualIncome, onValueChange: (value) => handleInputChange('annualIncome', value), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Select income range" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "under-25k", children: "Under $25,000" }), _jsx(SelectItem, { value: "25k-50k", children: "$25,000 - $50,000" }), _jsx(SelectItem, { value: "50k-100k", children: "$50,000 - $100,000" }), _jsx(SelectItem, { value: "100k-250k", children: "$100,000 - $250,000" }), _jsx(SelectItem, { value: "250k-500k", children: "$250,000 - $500,000" }), _jsx(SelectItem, { value: "500k+", children: "$500,000+" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Source of Income" }), _jsxs(Select, { value: formData.sourceOfIncome, onValueChange: (value) => handleInputChange('sourceOfIncome', value), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Select source" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "employment", children: "Employment" }), _jsx(SelectItem, { value: "business", children: "Business" }), _jsx(SelectItem, { value: "investment", children: "Investment" }), _jsx(SelectItem, { value: "retirement", children: "Retirement" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] })] })] }));
            case 3:
                return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Identification & Security" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "ID Document Type *" }), _jsxs(Select, { value: formData.idType, onValueChange: (value) => handleInputChange('idType', value), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Select ID type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "passport", children: "Passport" }), _jsx(SelectItem, { value: "national-id", children: "National ID" }), _jsx(SelectItem, { value: "drivers-license", children: "Driver's License" }), _jsx(SelectItem, { value: "residence-permit", children: "Residence Permit" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "ID Number *" }), _jsx(Input, { value: formData.idNumber, onChange: (e) => handleInputChange('idNumber', e.target.value), placeholder: "ID document number", className: "mt-1", required: true })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "ID Expiry Date" }), _jsx(Input, { type: "date", value: formData.idExpiryDate, onChange: (e) => handleInputChange('idExpiryDate', e.target.value), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Issuing Country" }), _jsxs(Select, { value: formData.issuingCountry, onValueChange: (value) => handleInputChange('issuingCountry', value), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Select country" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "us", children: "\uD83C\uDDFA\uD83C\uDDF8 United States" }), _jsx(SelectItem, { value: "cn", children: "\uD83C\uDDE8\uD83C\uDDF3 China" }), _jsx(SelectItem, { value: "uk", children: "\uD83C\uDDEC\uD83C\uDDE7 United Kingdom" }), _jsx(SelectItem, { value: "ca", children: "\uD83C\uDDE8\uD83C\uDDE6 Canada" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Password *" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: showPassword ? "text" : "password", value: formData.password, onChange: (e) => handleInputChange('password', e.target.value), placeholder: "Create strong password", className: "mt-1 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2", children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Confirm Password *" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: showConfirmPassword ? "text" : "password", value: formData.confirmPassword, onChange: (e) => handleInputChange('confirmPassword', e.target.value), placeholder: "Confirm your password", className: "mt-1 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2", children: showConfirmPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] }), formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: "Passwords do not match" }))] }), _jsxs("div", { children: [_jsx(Label, { children: "Transfer PIN (6 digits) *" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: showPin ? "text" : "password", value: formData.transferPin, onChange: (e) => handleInputChange('transferPin', e.target.value), placeholder: "Create 6-digit PIN", className: "mt-1 text-center text-xl letter-spacing-wide pr-10", maxLength: 6, required: true }), _jsx("button", { type: "button", onClick: () => setShowPin(!showPin), className: "absolute right-3 top-1/2 transform -translate-y-1/2", children: showPin ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Confirm Transfer PIN *" }), _jsx(Input, { type: showPin ? "text" : "password", value: formData.confirmTransferPin, onChange: (e) => handleInputChange('confirmTransferPin', e.target.value), placeholder: "Confirm 6-digit PIN", className: "mt-1 text-center text-xl letter-spacing-wide", maxLength: 6, required: true }), formData.transferPin && formData.confirmTransferPin && formData.transferPin !== formData.confirmTransferPin && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: "PINs do not match" }))] })] }));
            case 4:
                return (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Terms & Conditions" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(Checkbox, { checked: formData.termsAccepted, onCheckedChange: (checked) => handleInputChange('termsAccepted', checked), className: "mt-1" }), _jsx("div", { children: _jsxs(Label, { className: "text-sm", children: ["I agree to the", " ", _jsx("a", { href: "/terms", className: "text-blue-600 hover:underline", children: "Terms of Service" }), " ", "and", " ", _jsx("a", { href: "/banking-agreement", className: "text-blue-600 hover:underline", children: "Banking Agreement" })] }) })] }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(Checkbox, { checked: formData.privacyAccepted, onCheckedChange: (checked) => handleInputChange('privacyAccepted', checked), className: "mt-1" }), _jsx("div", { children: _jsxs(Label, { className: "text-sm", children: ["I acknowledge that I have read and understand the", " ", _jsx("a", { href: "/privacy", className: "text-blue-600 hover:underline", children: "Privacy Policy" })] }) })] }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(Checkbox, { checked: formData.marketingOptIn, onCheckedChange: (checked) => handleInputChange('marketingOptIn', checked), className: "mt-1" }), _jsx("div", { children: _jsx(Label, { className: "text-sm", children: "I would like to receive promotional emails and updates about World Bank services (optional)" }) })] })] }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-medium text-blue-900 mb-2", children: "Account Security Information" }), _jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsx("li", { children: "\u2022 Your account will be protected with 256-bit encryption" }), _jsx("li", { children: "\u2022 Two-factor authentication will be enabled by default" }), _jsx("li", { children: "\u2022 All transactions require your transfer PIN for verification" }), _jsx("li", { children: "\u2022 Account verification may take 1-3 business days" })] })] })] }));
            default:
                return null;
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-2xl", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "flex items-center justify-center mb-4", children: _jsx("div", { className: "w-16 h-16 bg-white rounded-full flex items-center justify-center p-2", children: _jsx("img", { src: "/world-bank-logo.jpeg", alt: "World Bank Logo", className: "w-full h-full object-contain", onError: (e) => {
                                        const target = e.target;
                                        target.src = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/World_Bank_Group_logo.svg/1200px-World_Bank_Group_logo.svg.png";
                                    } }) }) }), _jsx("h1", { className: "text-3xl font-bold text-white mb-2", children: "WORLD BANK" }), _jsx("p", { className: "text-blue-200", children: "Open Your International Banking Account" })] }), _jsxs(Card, { className: "shadow-2xl", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-center text-2xl", children: "Account Registration" }), _jsx("div", { className: "flex justify-center space-x-2 mt-4", children: [1, 2, 3, 4].map((i) => (_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i === step
                                            ? 'bg-blue-600 text-white'
                                            : i < step
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-200 text-gray-600'}`, children: i < step ? _jsx(Check, { className: "w-4 h-4" }) : i }, i))) }), _jsx("div", { className: "text-center mt-2", children: _jsxs("span", { className: "text-sm text-gray-600", children: ["Step ", step, " of 4: ", step === 1 ? "Personal Information" :
                                                step === 2 ? "Address & Professional" :
                                                    step === 3 ? "Identification & Security" :
                                                        "Terms & Conditions"] }) })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: step === 4 ? handleSubmit : (e) => e.preventDefault(), children: [renderStep(), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setStep(step - 1), disabled: step === 1, children: "Previous" }), step < 4 ? (_jsx(Button, { type: "button", onClick: () => setStep(step + 1), disabled: !validateStep(step), className: "bg-blue-600 hover:bg-blue-700", children: "Next" })) : (_jsx(Button, { type: "submit", disabled: !validateStep(4) || loading, className: "bg-green-600 hover:bg-green-700", children: loading ? "Creating Account..." : "Create Account" }))] })] }), _jsx("div", { className: "text-center mt-6", children: _jsxs("p", { className: "text-sm text-gray-600", children: ["Already have an account?", " ", _jsx("a", { href: "/login", className: "text-blue-600 hover:underline", children: "Sign in here" })] }) })] })] }), _jsx("div", { className: "text-center mt-6 text-blue-200 text-sm", children: "\u00A9 2024 World Bank. All rights reserved." })] }) }));
}
