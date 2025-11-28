import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
export default function SupportTicket() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        category: 'general',
        priority: 'medium',
        description: ''
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Create support ticket in Supabase
            const ticketData = {
                user_id: user?.id,
                subject: formData.subject,
                category: formData.category,
                priority: formData.priority,
                description: formData.description,
                status: 'open',
                created_at: new Date().toISOString()
            };
            toast({
                title: 'Success',
                description: 'Support ticket submitted successfully. Our team will respond within 24 hours.',
            });
            setFormData({ subject: '', category: 'general', priority: 'medium', description: '' });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to submit support ticket. Please try again.',
                variant: 'destructive'
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100", children: [_jsx(Header, { user: user }), _jsx("main", { className: "pt-16 pb-20 px-4", children: _jsx("div", { className: "max-w-2xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-6", children: [_jsx(MessageSquare, { className: "w-6 h-6 text-blue-600" }), _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: t('support_ticket') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Subject" }), _jsx(Input, { value: formData.subject, onChange: (e) => setFormData({ ...formData, subject: e.target.value }), placeholder: "Brief description of your issue", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Category" }), _jsxs(Select, { value: formData.category, onValueChange: (value) => setFormData({ ...formData, category: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "general", children: "General Inquiry" }), _jsx(SelectItem, { value: "technical", children: "Technical Issue" }), _jsx(SelectItem, { value: "account", children: "Account Issue" }), _jsx(SelectItem, { value: "transaction", children: "Transaction Problem" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Priority" }), _jsxs(Select, { value: formData.priority, onValueChange: (value) => setFormData({ ...formData, priority: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "urgent", children: "Urgent" })] })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }), _jsx(Textarea, { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: "Please provide detailed information about your issue", rows: 6, required: true })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), " Submitting..."] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), " Submit Ticket"] })) })] })] }) }) }), _jsx(BottomNavigation, {})] }));
}
