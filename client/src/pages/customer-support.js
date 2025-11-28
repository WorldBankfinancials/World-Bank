import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
export default function CustomerSupport() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmitTicket = async () => {
        if (!subject || !category || !priority || !description) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields to submit your support ticket.',
                variant: 'destructive',
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser)
                throw new Error('Not authenticated');
            const { data: bankUser } = await supabase
                .from('bank_users')
                .select('id')
                .eq('supabase_user_id', authUser.id)
                .single();
            if (!bankUser)
                throw new Error('User not found');
            const { error } = await supabase
                .from('support_tickets')
                .insert({
                user_id: bankUser.id,
                subject,
                category,
                priority,
                description,
                status: 'open'
            });
            if (error)
                throw error;
            toast({
                title: 'Ticket Submitted',
                description: 'Support ticket submitted successfully! Our team will contact you soon.',
            });
            setSubject('');
            setCategory('');
            setPriority('');
            setDescription('');
        }
        catch (error) {
            toast({
                title: 'Submission Failed',
                description: error.message || 'Failed to submit support ticket. Please try again.',
                variant: 'destructive',
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-wb-gray flex items-center justify-center", children: _jsx("div", { className: "text-wb-dark", children: t('loading') }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-wb-gray", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold wb-dark", children: "Customer Support" }), _jsx("p", { className: "text-wb-text mt-2", children: "Submit a support request or contact our team directly" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Send, { className: "w-5 h-5" }), _jsx("span", { children: "Submit Support Request" })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium wb-dark", children: "Subject" }), _jsx(Input, { placeholder: "Brief description of your issue", className: "mt-1", value: subject, onChange: (e) => setSubject(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium wb-dark", children: "Category" }), _jsxs(Select, { value: category, onValueChange: setCategory, children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Select issue category" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "account", children: "Account Issues" }), _jsx(SelectItem, { value: "transactions", children: "Transaction Problems" }), _jsx(SelectItem, { value: "cards", children: "Card Services" }), _jsx(SelectItem, { value: "technical", children: "Technical Support" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium wb-dark", children: "Priority" }), _jsxs(Select, { value: priority, onValueChange: setPriority, children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Select priority level" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "urgent", children: "Urgent" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium wb-dark", children: "Description" }), _jsx(Textarea, { placeholder: "Please provide detailed information about your issue...", className: "mt-1 min-h-[120px]", value: description, onChange: (e) => setDescription(e.target.value) })] }), _jsxs(Button, { className: "bg-wb-blue text-white w-full", onClick: handleSubmitTicket, disabled: isSubmitting, children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), isSubmitting ? 'Submitting...' : 'Submit Request'] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(MessageSquare, { className: "w-5 h-5" }), _jsx("span", { children: "Contact Information" })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-wb-blue-light rounded-lg", children: [_jsx("h3", { className: "font-semibold wb-blue mb-2", children: "Phone Support" }), _jsx("p", { className: "wb-dark font-semibold", children: "1-800-WORLD-BANK" }), _jsx("p", { className: "text-sm text-wb-text", children: "Available 24/7" })] }), _jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-green-800 mb-2", children: "Email Support" }), _jsx("p", { className: "text-green-700", children: "support@worldbank.com" }), _jsx("p", { className: "text-sm text-green-600", children: "Response within 24 hours" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(AlertCircle, { className: "w-5 h-5" }), _jsx("span", { children: "Emergency Services" })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx(Button, { variant: "outline", className: "w-full justify-start border-red-300 text-red-600 hover:bg-red-50", children: "Report Lost/Stolen Card" }), _jsx(Button, { variant: "outline", className: "w-full justify-start border-red-300 text-red-600 hover:bg-red-50", children: "Dispute Transaction" }), _jsx(Button, { variant: "outline", className: "w-full justify-start border-red-300 text-red-600 hover:bg-red-50", children: "Freeze Account" })] })] })] })] })] }), _jsx(Footer, {})] }));
}
