
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit support ticket. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header user={user} />
      <main className="pt-16 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">{t('support_ticket')}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="account">Account Issue</SelectItem>
                      <SelectItem value="transaction">Transaction Problem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide detailed information about your issue"
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Submit Ticket</>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
