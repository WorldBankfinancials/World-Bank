import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, MessageCircle, FileText, Clock } from "lucide-react";


export default function SupportCenter() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wb-gray flex items-center justify-center">
        <div className="text-wb-dark">Loading...</div>
      </div>
    );
  }

  const faqItems = [
    { question: "How do I transfer funds between accounts?", category: "Banking" },
    { question: "What are your current interest rates?", category: "Rates" },
    { question: "How do I report a lost or stolen card?", category: "Security" },
    { question: "What are the wire transfer fees?", category: "Fees" },
  ];

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
              <Button className="bg-wb-blue text-white w-full">
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
                <Input placeholder="Search help articles..." className="pl-10" />
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
              {faqItems.map((faq, index) => (
                <div key={index} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium wb-dark">{faq.question}</p>
                    <p className="text-sm text-wb-text">{faq.category}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Answer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
