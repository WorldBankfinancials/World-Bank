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
import { ArrowRight, ArrowLeft, Briefcase } from 'lucide-react';
const step3Schema = z.object({
    profession: z.string().min(2, 'Profession is required'),
    employer: z.string().min(2, 'Employer name is required'),
    annualIncome: z.string().min(1, 'Annual income is required'),
    sourceOfFunds: z.string().min(1, 'Source of funds is required'),
    purposeOfAccount: z.string().min(1, 'Purpose of account is required'),
});
export default function RegistrationStep3({ initialData = {}, onNext, onBack }) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors }, setValue,
    // watch - removed unused import
     } = useForm({
        resolver: zodResolver(step3Schema),
        defaultValues: initialData
    });
    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            onNext(data);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md mx-auto", children: [_jsxs(CardHeader, { className: "text-center space-y-4", children: [_jsx(BankLogo, {}), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-2xl font-bold text-gray-900 dark:text-white", children: t('Professional Information') }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mt-2", children: t('Step 3 of 4: Employment & Financial Details') })] }), _jsx(Progress, { value: 75, className: "w-full" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-blue-600 dark:text-blue-400", children: [_jsx(Briefcase, { size: 20 }), _jsx("span", { className: "font-medium", children: t('Professional Details') })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "profession", children: [t('Profession/Occupation'), " *"] }), _jsx(Input, { id: "profession", ...register('profession'), placeholder: "Software Engineer", className: errors.profession ? 'border-red-500' : '' }), errors.profession && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.profession.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "employer", children: [t('Employer/Company'), " *"] }), _jsx(Input, { id: "employer", ...register('employer'), placeholder: "Tech Corp Inc.", className: errors.employer ? 'border-red-500' : '' }), errors.employer && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.employer.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "annualIncome", children: [t('Annual Income'), " *"] }), _jsxs(Select, { onValueChange: (value) => setValue('annualIncome', value), children: [_jsx(SelectTrigger, { className: errors.annualIncome ? 'border-red-500' : '', children: _jsx(SelectValue, { placeholder: t('Select income range') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "under-25000", children: t('Under $25,000') }), _jsx(SelectItem, { value: "25000-50000", children: t('$25,000 - $50,000') }), _jsx(SelectItem, { value: "50000-100000", children: t('$50,000 - $100,000') }), _jsx(SelectItem, { value: "100000-250000", children: t('$100,000 - $250,000') }), _jsx(SelectItem, { value: "250000-500000", children: t('$250,000 - $500,000') }), _jsx(SelectItem, { value: "500000-plus", children: t('$500,000+') })] })] }), errors.annualIncome && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.annualIncome.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "sourceOfFunds", children: [t('Primary Source of Funds'), " *"] }), _jsxs(Select, { onValueChange: (value) => setValue('sourceOfFunds', value), children: [_jsx(SelectTrigger, { className: errors.sourceOfFunds ? 'border-red-500' : '', children: _jsx(SelectValue, { placeholder: t('Select source of funds') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "employment", children: t('Employment Income') }), _jsx(SelectItem, { value: "business", children: t('Business Income') }), _jsx(SelectItem, { value: "investments", children: t('Investment Returns') }), _jsx(SelectItem, { value: "inheritance", children: t('Inheritance') }), _jsx(SelectItem, { value: "savings", children: t('Personal Savings') }), _jsx(SelectItem, { value: "other", children: t('Other') })] })] }), errors.sourceOfFunds && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.sourceOfFunds.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "purposeOfAccount", children: [t('Purpose of Account'), " *"] }), _jsxs(Select, { onValueChange: (value) => setValue('purposeOfAccount', value), children: [_jsx(SelectTrigger, { className: errors.purposeOfAccount ? 'border-red-500' : '', children: _jsx(SelectValue, { placeholder: t('Select account purpose') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "personal", children: t('Personal Banking') }), _jsx(SelectItem, { value: "business", children: t('Business Banking') }), _jsx(SelectItem, { value: "investment", children: t('Investment Activities') }), _jsx(SelectItem, { value: "savings", children: t('Savings & Deposits') }), _jsx(SelectItem, { value: "international", children: t('International Transfers') })] })] }), errors.purposeOfAccount && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.purposeOfAccount.message }))] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: onBack, className: "flex-1", children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), t('Back')] }), _jsx(Button, { type: "submit", className: "flex-1", disabled: isLoading, children: isLoading ? t('Processing...') : (_jsxs(_Fragment, { children: [t('Continue'), _jsx(ArrowRight, { className: "ml-2 h-4 w-4" })] })) })] })] })] })] }) }));
}
