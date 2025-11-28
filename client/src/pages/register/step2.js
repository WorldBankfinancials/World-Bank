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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BankLogo } from '@/components/BankLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { COUNTRIES } from '@/data/countries';
import { ArrowRight, ArrowLeft, MapPin } from 'lucide-react';
const step2Schema = z.object({
    address: z.string().min(5, 'Address must be at least 5 characters'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province is required'),
    country: z.string().min(2, 'Country is required'),
    postalCode: z.string().min(3, 'Postal code is required'),
    nationality: z.string().min(2, 'Nationality is required'),
});
export default function RegistrationStep2({ initialData = {}, onNext, onBack }) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(step2Schema),
        defaultValues: initialData
    });
    // Remove unused variable
    // const country = watch('country');
    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            onNext(data);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md mx-auto", children: [_jsxs(CardHeader, { className: "text-center space-y-4", children: [_jsx(BankLogo, {}), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-2xl font-bold text-gray-900 dark:text-white", children: t('Address Information') }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mt-2", children: t('Step 2 of 4: Location Details') })] }), _jsx(Progress, { value: 50, className: "w-full" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-blue-600 dark:text-blue-400", children: [_jsx(MapPin, { size: 20 }), _jsx("span", { className: "font-medium", children: t('Address Details') })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "address", children: [t('Street Address'), " *"] }), _jsx(Input, { id: "address", ...register('address'), placeholder: "123 Main Street, Apt 4B", className: errors.address ? 'border-red-500' : '' }), errors.address && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.address.message }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "city", children: [t('City'), " *"] }), _jsx(Input, { id: "city", ...register('city'), placeholder: "New York", className: errors.city ? 'border-red-500' : '' }), errors.city && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.city.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "state", children: [t('State/Province'), " *"] }), _jsx(Input, { id: "state", ...register('state'), placeholder: "NY", className: errors.state ? 'border-red-500' : '' }), errors.state && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.state.message }))] })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "country", children: [t('Country'), " *"] }), _jsxs(Select, { onValueChange: (value) => setValue('country', value), children: [_jsx(SelectTrigger, { className: errors.country ? 'border-red-500' : '', children: _jsx(SelectValue, { placeholder: t('Select your country') }) }), _jsx(SelectContent, { children: COUNTRIES.map(country => (_jsx(SelectItem, { value: country, children: country }, country))) })] }), errors.country && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.country.message }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "postalCode", children: [t('Postal Code'), " *"] }), _jsx(Input, { id: "postalCode", ...register('postalCode'), placeholder: "10001", className: errors.postalCode ? 'border-red-500' : '' }), errors.postalCode && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.postalCode.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "nationality", children: [t('Nationality'), " *"] }), _jsx(Input, { id: "nationality", ...register('nationality'), placeholder: "American", className: errors.nationality ? 'border-red-500' : '' }), errors.nationality && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.nationality.message }))] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: onBack, className: "flex-1", children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), t('Back')] }), _jsx(Button, { type: "submit", className: "flex-1", disabled: isLoading, children: isLoading ? t('Processing...') : (_jsxs(_Fragment, { children: [t('Continue'), _jsx(ArrowRight, { className: "ml-2 h-4 w-4" })] })) })] })] })] })] }) }));
}
