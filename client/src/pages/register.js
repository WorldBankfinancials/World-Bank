import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BankLogo } from '@/components/BankLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabaseClient } from '@/lib/supabase';
// Use the centralized Supabase client to avoid "Multiple GoTrueClient instances" warning
const getSupabaseClient = () => supabaseClient;
const registrationSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province is required'),
    country: z.string().min(2, 'Country is required'),
    postalCode: z.string().min(3, 'Postal code is required'),
    profession: z.string().min(2, 'Profession is required'),
    annualIncome: z.string().min(1, 'Annual income is required'),
    idType: z.string().min(1, 'ID type is required'),
    idNumber: z.string().min(5, 'ID number is required'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export default function RegisterPage() {
    const [, setLocation] = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [registrationStep, setRegistrationStep] = useState('form');
    const { toast } = useToast();
    const { t } = useLanguage();
    const form = useForm({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            dateOfBirth: '',
            address: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
            profession: '',
            annualIncome: '',
            idType: '',
            idNumber: '',
        },
    });
    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // STEP 1: Check if email already exists
            const emailCheckResponse = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email })
            });
            const emailCheck = await emailCheckResponse.json();
            if (!emailCheck.available) {
                toast({
                    title: t('registration_failed'),
                    description: emailCheck.message || 'This email is already registered. Please use a different email or try logging in.',
                    variant: 'destructive',
                });
                setIsLoading(false);
                return;
            }
            const supabase = getSupabaseClient();
            let supabaseUserId = null;
            // STEP 2: Create user in Supabase Auth
            if (!supabase) {
                throw new Error('Authentication service unavailable. Please try again later.');
            }
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        first_name: data.firstName,
                        last_name: data.lastName,
                        full_name: `${data.firstName} ${data.lastName}`,
                    }
                }
            });
            // SECURITY: Fail immediately if Supabase auth fails
            if (authError) {
                console.error('Supabase authentication failed:', authError.message);
                throw new Error(authError.message || 'Failed to create authentication account. User may already exist.');
            }
            if (!authData.user) {
                throw new Error('Authentication account creation failed. Please try again.');
            }
            supabaseUserId = authData.user.id;
            // SECURITY: NEVER send password to backend - Supabase handles it
            const userProfile = {
                username: data.email.split('@')[0],
                fullName: `${data.firstName} ${data.lastName}`,
                email: data.email,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth,
                address: data.address,
                city: data.city,
                state: data.state,
                country: data.country,
                postalCode: data.postalCode,
                profession: data.profession,
                annualIncome: data.annualIncome,
                idType: data.idType,
                idNumber: data.idNumber,
                supabaseUserId: supabaseUserId,
                role: 'customer',
                isVerified: false,
                isActive: false,
                balance: 0,
            };
            // STEP 3: Create user profile in database with retry logic
            let retries = 3;
            let profileCreated = false;
            while (retries > 0 && !profileCreated) {
                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(userProfile),
                    });
                    if (response.ok) {
                        profileCreated = true;
                        break;
                    }
                    else if (retries > 1) {
                        // Wait 1 second before retry
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        retries--;
                    }
                    else {
                        throw new Error('Failed to create user profile after retries');
                    }
                }
                catch (error) {
                    if (retries > 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        retries--;
                    }
                    else {
                        throw error;
                    }
                }
            }
            if (!profileCreated) {
                throw new Error('Failed to create user profile');
            }
            setRegistrationStep('pending');
            toast({
                title: t('registration_submitted'),
                description: t('admin_review_pending'),
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            toast({
                title: t('registration_failed'),
                description: error.message || t('try_again_later'),
                variant: 'destructive',
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    if (registrationStep === 'pending') {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(BankLogo, { className: "w-16 h-16 mx-auto mb-4" }), _jsx(CardTitle, { className: "text-2xl", children: t('registration_submitted') }), _jsx(CardDescription, { children: t('admin_review_description') })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-blue-900 mb-2", children: t('next_steps') }), _jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsxs("li", { children: ["\u2022 ", t('admin_review_process')] }), _jsxs("li", { children: ["\u2022 ", t('email_notification_sent')] }), _jsxs("li", { children: ["\u2022 ", t('account_activation_follows')] })] })] }), _jsx(Button, { onClick: () => setLocation('/login'), className: "w-full", children: t('return_to_login') })] })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "wb-login-card w-full max-w-2xl wb-fade-in", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(BankLogo, { className: "w-16 h-16 mx-auto mb-4" }), _jsx(CardTitle, { className: "text-2xl", children: t('create_account') }), _jsx(CardDescription, { children: t('join_world_bank_today') })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: t('personal_information') }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "firstName", children: t('first_name') }), _jsx(Input, { id: "firstName", ...form.register('firstName'), placeholder: t('enter_first_name'), className: "wb-input" }), form.formState.errors.firstName && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.firstName.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "lastName", children: t('last_name') }), _jsx(Input, { id: "lastName", ...form.register('lastName'), placeholder: t('enter_last_name') }), form.formState.errors.lastName && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.lastName.message }))] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "dateOfBirth", children: t('date_of_birth') }), _jsx(Input, { id: "dateOfBirth", type: "date", ...form.register('dateOfBirth') }), form.formState.errors.dateOfBirth && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.dateOfBirth.message }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: t('contact_information') }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", children: t('email_address') }), _jsx(Input, { id: "email", type: "email", ...form.register('email'), placeholder: t('enter_email') }), form.formState.errors.email && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.email.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: t('phone_number') }), _jsx(Input, { id: "phone", ...form.register('phone'), placeholder: t('enter_phone') }), form.formState.errors.phone && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.phone.message }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: t('address_information') }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "address", children: t('street_address') }), _jsx(Input, { id: "address", ...form.register('address'), placeholder: t('enter_address') }), form.formState.errors.address && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.address.message }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "city", children: t('city') }), _jsx(Input, { id: "city", ...form.register('city'), placeholder: t('enter_city') }), form.formState.errors.city && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.city.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "state", children: t('state_province') }), _jsx(Input, { id: "state", ...form.register('state'), placeholder: t('enter_state') }), form.formState.errors.state && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.state.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "postalCode", children: t('postal_code') }), _jsx(Input, { id: "postalCode", ...form.register('postalCode'), placeholder: t('enter_postal_code') }), form.formState.errors.postalCode && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.postalCode.message }))] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "country", children: t('country') }), _jsxs(Select, { onValueChange: (value) => form.setValue('country', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('select_country') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "China", children: t('china') }), _jsx(SelectItem, { value: "United States", children: t('united_states') }), _jsx(SelectItem, { value: "United Kingdom", children: t('united_kingdom') }), _jsx(SelectItem, { value: "Canada", children: t('canada') }), _jsx(SelectItem, { value: "Australia", children: t('australia') }), _jsx(SelectItem, { value: "Germany", children: t('germany') }), _jsx(SelectItem, { value: "France", children: t('france') }), _jsx(SelectItem, { value: "Japan", children: t('japan') }), _jsx(SelectItem, { value: "Other", children: t('other') })] })] }), form.formState.errors.country && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.country.message }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: t('professional_information') }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "profession", children: t('profession') }), _jsx(Input, { id: "profession", ...form.register('profession'), placeholder: t('enter_profession') }), form.formState.errors.profession && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.profession.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "annualIncome", children: t('annual_income') }), _jsxs(Select, { onValueChange: (value) => form.setValue('annualIncome', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('select_income_range') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Under $25,000", children: t('under_25k') }), _jsx(SelectItem, { value: "$25,000 - $50,000", children: t('25k_50k') }), _jsx(SelectItem, { value: "$50,000 - $75,000", children: t('50k_75k') }), _jsx(SelectItem, { value: "$75,000 - $100,000", children: t('75k_100k') }), _jsx(SelectItem, { value: "$100,000 - $150,000", children: t('100k_150k') }), _jsx(SelectItem, { value: "Over $150,000", children: t('over_150k') })] })] }), form.formState.errors.annualIncome && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.annualIncome.message }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: t('identification') }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "idType", children: t('id_type') }), _jsxs(Select, { onValueChange: (value) => form.setValue('idType', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('select_id_type') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "National ID", children: t('national_id') }), _jsx(SelectItem, { value: "Passport", children: t('passport') }), _jsx(SelectItem, { value: "Driver's License", children: t('drivers_license') }), _jsx(SelectItem, { value: "Other", children: t('other') })] })] }), form.formState.errors.idType && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.idType.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "idNumber", children: t('id_number') }), _jsx(Input, { id: "idNumber", ...form.register('idNumber'), placeholder: t('enter_id_number') }), form.formState.errors.idNumber && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.idNumber.message }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: t('account_security') }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "password", children: t('password') }), _jsx(Input, { id: "password", type: "password", ...form.register('password'), placeholder: t('enter_password') }), form.formState.errors.password && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.password.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "confirmPassword", children: t('confirm_password') }), _jsx(Input, { id: "confirmPassword", type: "password", ...form.register('confirmPassword'), placeholder: t('confirm_your_password') }), form.formState.errors.confirmPassword && (_jsx("p", { className: "text-sm text-red-600", children: form.formState.errors.confirmPassword.message }))] })] }), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? t('creating_account') : t('create_account') }), _jsx("div", { className: "text-center", children: _jsxs("span", { className: "text-sm text-gray-600", children: [t('already_have_account'), _jsx(Link, { href: "/login", className: "text-blue-600 hover:underline ml-1", children: t('sign_in_here') })] }) })] })] }) })] }) }));
}
