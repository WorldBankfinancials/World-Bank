import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { ArrowLeft, Shield, Upload, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
const step4Schema = z.object({
    idType: z.string().min(1, 'ID type is required'),
    idNumber: z.string().min(5, 'ID number is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    transferPin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export default function RegistrationStep4({ initialData = {}, onSubmit, onBack, isLoading = false }) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [idCardFile, setIdCardFile] = useState(null);
    const [idCardPreview, setIdCardPreview] = useState(null);
    const { register, handleSubmit, formState: { errors }, setValue,
    // watch - removed unused import
     } = useForm({
        resolver: zodResolver(step4Schema),
        defaultValues: initialData
    });
    const handleIdCardUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: t('File Too Large'),
                    description: t('Please select an image under 5MB'),
                    variant: 'destructive',
                });
                return;
            }
            // Check file type
            if (!file.type.startsWith('image/')) {
                toast({
                    title: t('Invalid File Type'),
                    description: t('Please select an image file'),
                    variant: 'destructive',
                });
                return;
            }
            setIdCardFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setIdCardPreview(e.target?.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleFormSubmit = (data) => {
        onSubmit(data, idCardFile || undefined);
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md mx-auto", children: [_jsxs(CardHeader, { className: "text-center space-y-4", children: [_jsx(BankLogo, {}), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-2xl font-bold text-gray-900 dark:text-white", children: t('Security & Verification') }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mt-2", children: t('Step 4 of 4: Complete Your Registration') })] }), _jsx(Progress, { value: 100, className: "w-full" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-blue-600 dark:text-blue-400", children: [_jsx(Shield, { size: 20 }), _jsx("span", { className: "font-medium", children: t('Security & Identity') })] }), _jsxs("form", { onSubmit: handleSubmit(handleFormSubmit), className: "space-y-4", children: [_jsxs("div", { className: "space-y-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 text-blue-700 dark:text-blue-300", children: [_jsx(FileImage, { size: 18 }), _jsx("span", { className: "font-medium", children: t('Identity Verification') })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "idType", children: [t('ID Document Type'), " *"] }), _jsxs(Select, { onValueChange: (value) => setValue('idType', value), children: [_jsx(SelectTrigger, { className: errors.idType ? 'border-red-500' : '', children: _jsx(SelectValue, { placeholder: t('Select ID type') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "passport", children: t('Passport') }), _jsx(SelectItem, { value: "national-id", children: t('National ID Card') }), _jsx(SelectItem, { value: "drivers-license", children: t("Driver's License") }), _jsx(SelectItem, { value: "state-id", children: t('State ID Card') })] })] }), errors.idType && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.idType.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "idNumber", children: [t('ID Number'), " *"] }), _jsx(Input, { id: "idNumber", ...register('idNumber'), placeholder: "Enter your ID number", className: errors.idNumber ? 'border-red-500' : '' }), errors.idNumber && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.idNumber.message }))] }), _jsxs("div", { children: [_jsxs(Label, { children: [t('Upload ID Card Photo'), " (", t('Optional'), ")"] }), _jsxs("div", { className: "mt-2", children: [_jsx("input", { id: "idCardUpload", type: "file", accept: "image/*", onChange: handleIdCardUpload, className: "hidden" }), _jsx("label", { htmlFor: "idCardUpload", className: "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700", children: idCardPreview ? (_jsx("img", { src: idCardPreview, alt: "ID Card Preview", className: "h-full w-auto object-contain rounded" })) : (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx(Upload, { className: "w-8 h-8 text-gray-400" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: t('Click to upload ID card photo') }), _jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: t('Max 5MB, JPG/PNG only') })] })) })] }), idCardFile && (_jsxs("p", { className: "text-sm text-green-600 dark:text-green-400 mt-1", children: ["\u2713 ", idCardFile.name, " (", Math.round(idCardFile.size / 1024), "KB)"] }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "password", children: [t('Password'), " *"] }), _jsx(Input, { id: "password", type: "password", ...register('password'), placeholder: "Create a secure password", className: errors.password ? 'border-red-500' : '' }), errors.password && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.password.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "confirmPassword", children: [t('Confirm Password'), " *"] }), _jsx(Input, { id: "confirmPassword", type: "password", ...register('confirmPassword'), placeholder: "Confirm your password", className: errors.confirmPassword ? 'border-red-500' : '' }), errors.confirmPassword && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.confirmPassword.message }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "transferPin", children: [t('4-Digit Transfer PIN'), " *"] }), _jsx(Input, { id: "transferPin", type: "password", ...register('transferPin'), placeholder: "0000", maxLength: 4, className: errors.transferPin ? 'border-red-500' : '' }), errors.transferPin && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.transferPin.message })), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: t('This PIN will be required for all transfers') })] })] }), _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("input", { type: "checkbox", id: "agreeToTerms", ...register('agreeToTerms'), className: "mt-1" }), _jsxs("label", { htmlFor: "agreeToTerms", className: "text-sm text-gray-600 dark:text-gray-300", children: [t('I agree to the'), ' ', _jsx("a", { href: "/terms", target: "_blank", className: "text-blue-600 hover:underline", children: t('Terms and Conditions') }), ' ', t('and'), ' ', _jsx("a", { href: "/privacy", target: "_blank", className: "text-blue-600 hover:underline", children: t('Privacy Policy') })] })] }), errors.agreeToTerms && (_jsx("p", { className: "text-red-500 text-sm", children: errors.agreeToTerms.message })), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: onBack, className: "flex-1", disabled: isLoading, children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), t('Back')] }), _jsx(Button, { type: "submit", className: "flex-1 bg-green-600 hover:bg-green-700", disabled: isLoading, children: isLoading ? t('Creating Account...') : t('Complete Registration') })] })] })] })] }) }));
}
