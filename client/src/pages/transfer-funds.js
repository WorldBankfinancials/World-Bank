import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar } from "@/components/Avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Globe, Building, CreditCard, Smartphone, Users, Clock, Shield, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export default function TransferFunds() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [transferType, setTransferType] = useState("international");
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState("EN");
    // Form state
    const [formData, setFormData] = useState({
        amount: "",
        currency: "usd",
        recipientName: "",
        recipientCountry: "",
        recipientAddress: "",
        recipientCity: "",
        recipientState: "",
        recipientPostalCode: "",
        recipientEmail: "",
        recipientPhone: "",
        bankName: "",
        bankAddress: "",
        bankCity: "",
        bankState: "",
        bankPostalCode: "",
        bankCountry: "",
        swiftCode: "",
        ibanNumber: "",
        accountNumber: "",
        routingNumber: "",
        branchCode: "",
        cardNumber: "",
        mobileNumber: "",
        mobileProvider: "",
        purpose: "",
        reference: ""
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear validation error when user starts typing
        if (validationErrors[field]) {
            const newErrors = { ...validationErrors };
            delete newErrors[field];
            setValidationErrors(newErrors);
        }
    };
    const validateForm = () => {
        const errors = {};
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errors.amount = "Please enter a valid amount";
        }
        if (!formData.recipientName.trim()) {
            errors.recipientName = "Recipient name is required";
        }
        if (transferType === "international") {
            if (!formData.recipientCountry)
                errors.recipientCountry = "Recipient country is required";
            if (!formData.recipientAddress.trim())
                errors.recipientAddress = "Recipient address is required";
            if (!formData.recipientCity.trim())
                errors.recipientCity = "Recipient city is required";
            if (!formData.bankName.trim())
                errors.bankName = "Bank name is required";
            if (!formData.bankAddress.trim())
                errors.bankAddress = "Bank address is required";
            if (!formData.bankCity.trim())
                errors.bankCity = "Bank city is required";
            if (!formData.bankCountry)
                errors.bankCountry = "Bank country is required";
            if (!formData.swiftCode.trim())
                errors.swiftCode = "SWIFT/BIC code is required";
            if (!formData.accountNumber.trim())
                errors.accountNumber = "Account number is required";
        }
        else if (transferType === "domestic") {
            if (!formData.routingNumber.trim())
                errors.routingNumber = "Routing number is required";
            if (!formData.accountNumber.trim())
                errors.accountNumber = "Account number is required";
        }
        else if (transferType === "card") {
            if (!formData.cardNumber.trim())
                errors.cardNumber = "Card number is required";
        }
        else if (transferType === "mobile") {
            if (!formData.mobileNumber.trim())
                errors.mobileNumber = "Mobile number is required";
            if (!formData.mobileProvider)
                errors.mobileProvider = "Provider is required";
        }
        if (!formData.purpose) {
            errors.purpose = "Purpose of transfer is required";
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleContinueTransfer = () => {
        if (!validateForm()) {
            toast({
                title: 'Incomplete Form',
                description: 'Please fill in all required fields correctly.',
                variant: 'destructive',
            });
            return;
        }
        // Show PIN verification modal instead of directly submitting
        setShowPinModal(true);
    };
    const [showPinModal, setShowPinModal] = useState(false);
    const [transferPin, setTransferPin] = useState('');
    const [pinError, setPinError] = useState('');
    const handlePinSubmit = async () => {
        if (!transferPin || transferPin.length !== 4) {
            setPinError("Please enter a 4-digit PIN");
            return;
        }
        setPinError("");
        setIsProcessing(true);
        try {
            const amount = parseFloat(formData.amount);
            let fee = 0;
            switch (transferType) {
                case "international":
                    fee = Math.max(25, Math.min(50, amount * 0.01));
                    break;
                case "domestic":
                    fee = amount > 1000 ? 15 : 0;
                    break;
                case "card":
                    fee = amount * 0.025 + 5;
                    break;
                case "mobile":
                    fee = Math.max(3, Math.min(15, amount * 0.015));
                    break;
            }
            const total = amount + fee;
            // Create the transfer with validated PIN
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount,
                    fee: fee,
                    total: total,
                    transferType: transferType,
                    recipientName: formData.recipientName,
                    recipientCountry: formData.recipientCountry,
                    recipientAccount: formData.accountNumber,
                    bankName: formData.bankName,
                    swiftCode: formData.swiftCode,
                    purpose: formData.purpose,
                    reference: formData.reference,
                    transferPin: transferPin
                })
            });
            if (response.ok) {
                setShowPinModal(false);
                setTransferPin('');
                toast({
                    title: 'Transfer Initiated',
                    description: `Transfer of $${amount.toFixed(2)} has been initiated successfully.`,
                });
                window.location.href = '/transfer-processing';
            }
            else {
                const errorData = await response.json();
                setPinError(errorData.message || 'Transfer failed');
            }
        }
        catch (error) {
            setPinError(error.message || 'Unable to process transfer. Please try again.');
        }
        finally {
            setIsProcessing(false);
        }
    };
    const saveAsTemplate = () => {
        if (!formData.recipientName.trim()) {
            toast({
                title: 'Missing Information',
                description: 'Please enter recipient details to save as template.',
                variant: 'destructive',
            });
            return;
        }
        const template = {
            name: `${formData.recipientName} - ${transferType}`,
            type: transferType,
            data: formData,
            created: new Date().toISOString()
        };
        // Save to localStorage
        const templates = JSON.parse(localStorage.getItem('transferTemplates') || '[]');
        templates.push(template);
        localStorage.setItem('transferTemplates', JSON.stringify(templates));
        toast({
            title: 'Template Saved',
            description: `Template saved: "${template.name}"`,
        });
    };
    const languages = [
        { code: "EN", name: "English", flag: "🇺🇸" },
        { code: "中文", name: "Chinese", flag: "🇨🇳" }
    ];
    const transferMethods = [
        {
            id: "international",
            title: t('international_transfer_title'),
            description: t('international_transfer_desc'),
            icon: Globe,
            fees: "$25 - $50",
            time: "1-5 business days",
            limit: "$500,000"
        },
        {
            id: "domestic",
            title: t('domestic_transfer_title'),
            description: t('domestic_transfer_desc'),
            icon: Building,
            fees: "$0 - $15",
            time: t('same_day'),
            limit: "$100,000"
        },
        {
            id: "card",
            title: t('card_transfer_title'),
            description: t('card_transfer_desc'),
            icon: CreditCard,
            fees: "2.5% + $5",
            time: t('instant'),
            limit: "$10,000"
        },
        {
            id: "mobile",
            title: t('mobile_money_title'),
            description: t('mobile_money_desc'),
            icon: Smartphone,
            fees: "$3 - $15",
            time: t('minutes_to_hours'),
            limit: "$25,000"
        }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-20", children: [_jsx("div", { className: "bg-white px-4 py-3 shadow-sm relative", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("img", { src: "/world-bank-logo.jpeg", alt: "World Bank Logo", className: "w-8 h-8 object-contain", onError: (e) => {
                                        const target = e.target;
                                        target.src = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/World_Bank_Group_logo.svg/1200px-World_Bank_Group_logo.svg.png";
                                    } }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-900 font-semibold text-sm", children: t('world_bank') }), _jsx("div", { className: "text-xs text-gray-500", children: t('international_banking') })] })] }), _jsx("div", { className: "flex items-center space-x-3", children: _jsx(Avatar, { size: 40 }) })] }) }), showLanguageMenu && (_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setShowLanguageMenu(false) })), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Transfer Funds" }), _jsx("p", { className: "text-gray-600", children: "Send money between your accounts or to others" })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(ArrowLeftRight, { className: "w-5 h-5 mr-2" }), "Select Transfer Method"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 gap-3", children: transferMethods.map((method) => (_jsx("div", { className: `p-4 border rounded-xl cursor-pointer transition-all duration-200 ${transferType === method.id
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`, onClick: () => setTransferType(method.id), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: `w-12 h-12 rounded-full flex items-center justify-center ${transferType === method.id ? 'bg-blue-100' : 'bg-gray-100'}`, children: _jsx(method.icon, { className: `w-6 h-6 ${transferType === method.id ? 'text-blue-600' : 'text-gray-600'}` }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: method.title }), _jsx("p", { className: "text-sm text-gray-600", children: method.description }), _jsxs("div", { className: "flex items-center space-x-4 mt-1", children: [_jsxs("span", { className: "text-xs text-green-600 font-medium", children: ["Fee: ", method.fees] }), _jsxs("span", { className: "text-xs text-gray-500", children: ["Time: ", method.time] })] })] })] }), _jsx(ChevronRight, { className: "w-5 h-5 text-gray-400" })] }) }, method.id))) }) })] }), _jsxs(Card, { className: "mb-6", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center", children: [transferType === "international" && _jsx(Globe, { className: "w-5 h-5 mr-2 text-blue-600" }), transferType === "domestic" && _jsx(Building, { className: "w-5 h-5 mr-2 text-green-600" }), transferType === "card" && _jsx(CreditCard, { className: "w-5 h-5 mr-2 text-purple-600" }), transferType === "mobile" && _jsx(Smartphone, { className: "w-5 h-5 mr-2 text-orange-600" }), transferType === "international" && "International Wire Transfer", transferType === "domestic" && "Domestic Bank Transfer", transferType === "card" && "Card to Card Transfer", transferType === "mobile" && "Mobile Money Transfer"] }), transferType === "international" && (_jsxs("div", { className: "flex items-center space-x-2 text-sm text-gray-600", children: [_jsx(Shield, { className: "w-4 h-4" }), _jsx("span", { children: "SWIFT Network \u2022 Bank Grade Security \u2022 Global Coverage" })] })), transferType === "mobile" && (_jsxs("div", { className: "flex items-center space-x-2 text-sm text-gray-600", children: [_jsx(Globe, { className: "w-4 h-4" }), _jsx("span", { children: "Available in 190+ Countries \u2022 Instant Transfer" })] }))] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx(Label, { className: "text-sm font-medium text-gray-700", children: "Transfer Amount" }), _jsxs("div", { className: "flex items-center space-x-3 mt-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx(Input, { type: "number", placeholder: "0.00", value: formData.amount, onChange: (e) => handleInputChange('amount', e.target.value), className: `text-xl font-semibold h-12 ${validationErrors.amount ? 'border-red-500' : ''}` }), validationErrors.amount && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.amount }))] }), _jsxs(Select, { value: formData.currency, onValueChange: (value) => handleInputChange('currency', value), children: [_jsx(SelectTrigger, { className: "w-24", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "usd", children: "USD" }), _jsx(SelectItem, { value: "eur", children: "EUR" }), _jsx(SelectItem, { value: "gbp", children: "GBP" }), _jsx(SelectItem, { value: "cny", children: "CNY" }), _jsx(SelectItem, { value: "jpy", children: "JPY" })] })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h3", { className: "font-medium text-gray-900 flex items-center", children: [_jsx(Users, { className: "w-4 h-4 mr-2" }), "Recipient Information"] }), transferType === "international" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient-name", children: "Recipient Name *" }), _jsx(Input, { id: "recipient-name", placeholder: "Full name", value: formData.recipientName, onChange: (e) => handleInputChange('recipientName', e.target.value), className: validationErrors.recipientName ? 'border-red-500' : '' }), validationErrors.recipientName && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.recipientName }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient-country", children: "Country *" }), _jsxs(Select, { value: formData.recipientCountry, onValueChange: (value) => handleInputChange('recipientCountry', value), children: [_jsx(SelectTrigger, { className: validationErrors.recipientCountry ? 'border-red-500' : '', children: _jsx(SelectValue, { placeholder: "Select country" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "us", children: "United States" }), _jsx(SelectItem, { value: "uk", children: "United Kingdom" }), _jsx(SelectItem, { value: "de", children: "Germany" }), _jsx(SelectItem, { value: "fr", children: "France" }), _jsx(SelectItem, { value: "cn", children: "China" }), _jsx(SelectItem, { value: "jp", children: "Japan" }), _jsx(SelectItem, { value: "au", children: "Australia" }), _jsx(SelectItem, { value: "ca", children: "Canada" })] })] }), validationErrors.recipientCountry && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.recipientCountry }))] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient-address", children: "Recipient Address *" }), _jsx(Input, { id: "recipient-address", placeholder: "Street address", value: formData.recipientAddress, onChange: (e) => handleInputChange('recipientAddress', e.target.value), className: validationErrors.recipientAddress ? 'border-red-500' : '' }), validationErrors.recipientAddress && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.recipientAddress }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient-city", children: "City *" }), _jsx(Input, { id: "recipient-city", placeholder: "City", value: formData.recipientCity, onChange: (e) => handleInputChange('recipientCity', e.target.value), className: validationErrors.recipientCity ? 'border-red-500' : '' }), validationErrors.recipientCity && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.recipientCity }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient-postal", children: "Postal Code" }), _jsx(Input, { id: "recipient-postal", placeholder: "ZIP/Postal code", value: formData.recipientPostalCode, onChange: (e) => handleInputChange('recipientPostalCode', e.target.value) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "bank-name", children: "Bank Name *" }), _jsx(Input, { id: "bank-name", placeholder: "Bank name", value: formData.bankName, onChange: (e) => handleInputChange('bankName', e.target.value), className: validationErrors.bankName ? 'border-red-500' : '' }), validationErrors.bankName && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.bankName }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "bank-address", children: "Bank Address *" }), _jsx(Input, { id: "bank-address", placeholder: "Bank address", value: formData.bankAddress, onChange: (e) => handleInputChange('bankAddress', e.target.value), className: validationErrors.bankAddress ? 'border-red-500' : '' }), validationErrors.bankAddress && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.bankAddress }))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "bank-city", children: "Bank City *" }), _jsx(Input, { id: "bank-city", placeholder: "Bank city", value: formData.bankCity, onChange: (e) => handleInputChange('bankCity', e.target.value), className: validationErrors.bankCity ? 'border-red-500' : '' }), validationErrors.bankCity && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.bankCity }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "bank-country", children: "Bank Country *" }), _jsxs(Select, { value: formData.bankCountry, onValueChange: (value) => handleInputChange('bankCountry', value), children: [_jsx(SelectTrigger, { className: validationErrors.bankCountry ? 'border-red-500' : '', children: _jsx(SelectValue, { placeholder: "Select country" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "us", children: "United States" }), _jsx(SelectItem, { value: "uk", children: "United Kingdom" }), _jsx(SelectItem, { value: "de", children: "Germany" }), _jsx(SelectItem, { value: "fr", children: "France" }), _jsx(SelectItem, { value: "cn", children: "China" }), _jsx(SelectItem, { value: "jp", children: "Japan" }), _jsx(SelectItem, { value: "au", children: "Australia" }), _jsx(SelectItem, { value: "ca", children: "Canada" })] })] }), validationErrors.bankCountry && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.bankCountry }))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "swift-code", children: "SWIFT Code *" }), _jsx(Input, { id: "swift-code", placeholder: "SWIFT/BIC code", value: formData.swiftCode, onChange: (e) => handleInputChange('swiftCode', e.target.value), className: validationErrors.swiftCode ? 'border-red-500' : '' }), validationErrors.swiftCode && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.swiftCode }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "account-number", children: "Account Number *" }), _jsx(Input, { id: "account-number", placeholder: "Account number", value: formData.accountNumber, onChange: (e) => handleInputChange('accountNumber', e.target.value), className: validationErrors.accountNumber ? 'border-red-500' : '' }), validationErrors.accountNumber && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.accountNumber }))] })] })] })), transferType === "domestic" && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient-name-domestic", children: "Recipient Name" }), _jsx(Input, { id: "recipient-name-domestic", placeholder: "Full name" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "routing-number", children: "Routing Number" }), _jsx(Input, { id: "routing-number", placeholder: "9-digit routing number" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "account-number-domestic", children: "Account Number" }), _jsx(Input, { id: "account-number-domestic", placeholder: "Account number" })] })] })] })), transferType === "card" && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient-name-card", children: "Recipient Name" }), _jsx(Input, { id: "recipient-name-card", placeholder: "Name on card" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "card-number", children: "Recipient Card Number" }), _jsx(Input, { id: "card-number", placeholder: "1234 5678 9012 3456" })] })] })), transferType === "mobile" && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient-name-mobile", children: "Recipient Name" }), _jsx(Input, { id: "recipient-name-mobile", placeholder: "Full name" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "mobile-number", children: "Mobile Number" }), _jsx(Input, { id: "mobile-number", placeholder: "+1 234 567 8900" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "mobile-provider", children: "Provider" }), _jsxs(Select, { children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select provider" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "mpesa", children: "M-Pesa (Kenya)" }), _jsx(SelectItem, { value: "mtn", children: "MTN Mobile Money" }), _jsx(SelectItem, { value: "airtel", children: "Airtel Money" }), _jsx(SelectItem, { value: "orange", children: "Orange Money" }), _jsx(SelectItem, { value: "gcash", children: "GCash (Philippines)" }), _jsx(SelectItem, { value: "paymaya", children: "PayMaya (Philippines)" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] })] })] }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "purpose", children: "Purpose of Transfer" }), _jsxs(Select, { value: formData.purpose, onValueChange: (value) => handleInputChange('purpose', value), children: [_jsx(SelectTrigger, { className: validationErrors.purpose ? 'border-red-500' : '', children: _jsx(SelectValue, { placeholder: "Select purpose" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "family", children: "Family Support" }), _jsx(SelectItem, { value: "business", children: "Business Payment" }), _jsx(SelectItem, { value: "education", children: "Education Expenses" }), _jsx(SelectItem, { value: "medical", children: "Medical Treatment" }), _jsx(SelectItem, { value: "investment", children: "Investment" }), _jsx(SelectItem, { value: "property", children: "Property Purchase" }), _jsx(SelectItem, { value: "travel", children: "Travel Expenses" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] }), validationErrors.purpose && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: validationErrors.purpose }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "reference", children: "Reference/Message (Optional)" }), _jsx(Input, { id: "reference", placeholder: "Payment reference or message", value: formData.reference, onChange: (e) => handleInputChange('reference', e.target.value) })] })] }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-blue-900 mb-3", children: "Transfer Summary" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Transfer Fee:" }), _jsx("span", { className: "font-medium", children: transferMethods.find(m => m.id === transferType)?.fees })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Processing Time:" }), _jsx("span", { className: "font-medium", children: transferMethods.find(m => m.id === transferType)?.time })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Daily Limit:" }), _jsx("span", { className: "font-medium", children: transferMethods.find(m => m.id === transferType)?.limit })] })] })] }), _jsx("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(Shield, { className: "w-5 h-5 text-amber-600 mt-0.5" }), _jsxs("div", { children: [_jsx("h5", { className: "font-medium text-amber-800", children: "Security Notice" }), _jsx("p", { className: "text-sm text-amber-700 mt-1", children: transferType === "international"
                                                                ? "International transfers require additional verification for amounts over $10,000 and may be subject to regulatory compliance checks."
                                                                : "All transfers are secured with bank-level encryption and monitoring." })] })] }) }), _jsxs("div", { className: "flex space-x-3 pt-4", children: [_jsx(Button, { variant: "outline", className: "flex-1", onClick: saveAsTemplate, disabled: isProcessing, children: "Save as Template" }), _jsx(Button, { className: "flex-1 bg-blue-600 hover:bg-blue-700", onClick: handleContinueTransfer, disabled: isProcessing, children: isProcessing ? (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-4 h-4 mr-2 animate-spin" }), "Processing..."] })) : ("Continue Transfer") })] })] })] })] }), showPinModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs(Card, { className: "w-full max-w-sm", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Verify Transfer PIN" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "pin", children: "Enter your 4-digit transfer PIN" }), _jsx(Input, { id: "pin", type: "password", maxLength: 4, placeholder: "\u2022\u2022\u2022\u2022", value: transferPin, onChange: (e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setTransferPin(value);
                                                setPinError('');
                                            }, className: pinError ? 'border-red-500' : '', "data-testid": "input-pin" }), pinError && _jsx("p", { className: "text-red-500 text-sm mt-1", children: pinError })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Button, { variant: "outline", className: "flex-1", onClick: () => {
                                                setShowPinModal(false);
                                                setTransferPin('');
                                                setPinError('');
                                            }, disabled: isProcessing, "data-testid": "button-cancel-pin", children: "Cancel" }), _jsx(Button, { className: "flex-1 bg-blue-600 hover:bg-blue-700", onClick: handlePinSubmit, disabled: isProcessing || transferPin.length !== 4, "data-testid": "button-verify-pin", children: isProcessing ? 'Verifying...' : 'Verify & Transfer' })] })] })] }) })), _jsx(BottomNavigation, {})] }));
}
