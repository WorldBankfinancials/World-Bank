import type { User } from "@packages/shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, Phone, MessageCircle, FileText, Clock } from "lucide-react";
import LiveChat from "@/components/LiveChat";


export default function SupportCenter() {
  const { t } = useLanguage();
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const faqItems = [
    { question: "How do I transfer funds between accounts?", category: "Banking", answer: "You can transfer funds between accounts from the Transfer Funds page. Navigate to the transfer section in your dashboard and follow the prompts to complete a transfer." },
    { question: "What are your current interest rates?", category: "Rates", answer: "Our interest rates vary by product and are updated regularly. Please visit the Rates section or contact our support team for the most current rates on savings accounts, loans, and other products." },
    { question: "How do I report a lost or stolen card?", category: "Security", answer: "If your card is lost or stolen, immediately navigate to the Cards page to lock your card, or contact our 24/7 phone support at 1-800-WORLD-BANK to report it and request a replacement." },
    { question: "What are the wire transfer fees?", category: "Fees", answer: "Wire transfer fees depend on the type and destination of the transfer. Domestic wires typically have lower fees than international wires. Please check the Fees section or contact support for a detailed fee schedule." },
  ];

  const filteredFaqs = faqItems.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-wb-gray">
      <Header user={user} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold wb-dark">Support Center</h1>
          <p className="text-wb-text mt-2">Find answers and get help with your banking needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Phone Support</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-wb-text mb-4">Speak with a representative</p>
              <p className="font-semibold wb-dark mb-2">1-800-WORLD-BANK</p>
              <div className="flex items-center text-sm text-wb-text">
                <Clock className="w-4 h-4 mr-1" />
                <span>24/7 Available</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Live Chat</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-wb-text mb-4">Chat with our support team</p>
              <Button 
                onClick={() => setShowLiveChat(true)}
                className="bg-wb-blue text-white w-full"
              >
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Knowledge Base</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-wb-text mb-4">Search our help articles</p>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search help articles..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8 text-wb-text">No FAQs match your search.</div>
              ) : (
                filteredFaqs.map((faq, index) => (
                <div key={`item-${index}`} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium wb-dark">{faq.question}</p>
                      <p className="text-sm text-wb-text">{faq.category}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}>
                      {expandedFaq === index ? 'Hide Answer' : 'View Answer'}
                    </Button>
                  </div>
                  {expandedFaq === index && (
                    <div className="mt-3 pt-3 border-t text-wb-text text-sm">
                      {faq.answer}
                    </div>
                  )}
                </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-wb-text mb-3">
                Can't find what you're looking for? Create a support ticket and our team will get back to you.
              </p>
              <a
                href="/customer-support"
                className="inline-flex items-center justify-center rounded-md bg-wb-blue text-white px-4 py-2 text-sm font-medium hover:opacity-90"
              >
                Create a Support Ticket
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <LiveChat 
        isOpen={showLiveChat} 
        onClose={() => setShowLiveChat(false)} 
      />

      <Footer />
    </div>
  );
}
