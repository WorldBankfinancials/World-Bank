import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();
    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'zh', name: '中文', flag: '🇨🇳' }
    ];
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [_jsx(Globe, { className: "w-4 h-4" }), _jsx("span", { className: "text-lg", children: language === 'en' ? '🇺🇸' : '🇨🇳' }), _jsx("span", { className: "hidden sm:inline", children: language === 'en' ? 'English' : '中文' })] }) }), _jsx(DropdownMenuContent, { align: "end", className: "w-48", children: languages.map((lang) => (_jsxs(DropdownMenuItem, { onClick: () => setLanguage(lang.code), className: "gap-3", children: [_jsx("span", { className: "text-lg", children: lang.flag }), _jsx("span", { children: lang.name }), language === lang.code && (_jsx("span", { className: "ml-auto text-blue-600", children: "\u2713" }))] }, lang.code))) })] }));
}
