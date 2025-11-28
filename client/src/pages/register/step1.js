import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BankLogo } from '@/components/BankLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, User } from 'lucide-react';
const step1Schema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
});
export default function RegistrationStep1({ initialData = {}, onNext }) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(step1Schema),
        defaultValues: initialData
    });
    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Check if email already exists via server API
            const response = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: data.email }),
            });
            if (!response.ok) {
                toast({
                    title: 'Error',
                    description: 'Unable to verify email. Please try again.',
                    variant: 'destructive',
                });
                return;
            }
            const result = await response.json();
            // Check if email is already registered
            if (!result.available) {
                toast({
                    title: 'Email Already Registered',
                    description: 'This email address is already registered. Please use a different email or contact customer support if you need assistance.',
                    variant: 'destructive',
                });
                return;
            }
            // Email is available, proceed to next step
            onNext(data);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md mx-auto", children: [_jsxs(CardHeader, { className: "text-center space-y-4", children: [_jsx(BankLogo, {}), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-2xl font-bold text-gray-900 dark:text-white", children: t('Create Your Account') }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mt-2", children: t('Step 1 of 4: Personal Information') })] }), _jsx(Progress, { value: 25, className: "w-full" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-blue-600 dark:text-blue-400", children: [_jsx(User, { size: 20 }), _jsx("span", { className: "font-medium", children: t('Personal Details') })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "firstName", children: [t('First Name'), " *"] }), _jsx(Input, { id: "firstName", ...register('firstName'), placeholder: "John", className: errors.firstName ? 'border-red-500' : '' }), errors.firstName && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.firstName.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "lastName", children: [t('Last Name'), " *"] }), _jsx(Input, { id: "lastName", ...register('lastName'), placeholder: "Doe", className: errors.lastName ? 'border-red-500' : '' }), errors.lastName && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.lastName.message }))] })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "email", children: [t('Email Address'), " *"] }), _jsx(Input, { id: "email", type: "email", ...register('email'), placeholder: "john.doe@example.com", className: errors.email ? 'border-red-500' : '' }), errors.email && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "phone", children: [t('Phone Number'), " *"] }), _jsx(Input, { id: "phone", type: "tel", ...register('phone'), placeholder: "+1 (555) 123-4567", className: errors.phone ? 'border-red-500' : '' }), errors.phone && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.phone.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "dateOfBirth", children: [t('Date of Birth'), " *"] }), _jsx(Input, { id: "dateOfBirth", type: "date", ...register('dateOfBirth'), className: errors.dateOfBirth ? 'border-red-500' : '' }), errors.dateOfBirth && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.dateOfBirth.message }))] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? t('Processing...') : (_jsxs(_Fragment, { children: [t('Continue'), _jsx(ArrowRight, { className: "ml-2 h-4 w-4" })] })) })] })] })] }) }));
}
