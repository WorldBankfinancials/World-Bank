import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Send, MessageSquare, Users, AlertCircle } from "lucide-react";
import type { User } from "@shared/schema";

export default function CustomerSupport() {
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

  return (
    <div className="min-h-screen bg-wb-gray">
      <Header user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold wb-dark">Customer Support</h1>
          <p className="text-wb-text mt-2">Submit a support request or contact our team directly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Submit Support Request</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium wb-dark">Subject</label>
                <Input placeholder="Brief description of your issue" className="mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium wb-dark">Category</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Account Issues</SelectItem>
                    <SelectItem value="transactions">Transaction Problems</SelectItem>
                    <SelectItem value="cards">Card Services</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium wb-dark">Priority</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium wb-dark">Description</label>
                <Textarea 
                  placeholder="Please provide detailed information about your issue..."
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <Button className="bg-wb-blue text-white w-full">
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-wb-blue-light rounded-lg">
                  <h3 className="font-semibold wb-blue mb-2">Phone Support</h3>
                  <p className="wb-dark font-semibold">1-800-WORLD-BANK</p>
                  <p className="text-sm text-wb-text">Available 24/7</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Email Support</h3>
                  <p className="text-green-700">support@worldbank.com</p>
                  <p className="text-sm text-green-600">Response within 24 hours</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Emergency Services</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50">
                  Report Lost/Stolen Card
                </Button>
                <Button variant="outline" className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50">
                  Dispute Transaction
                </Button>
                <Button variant="outline" className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50">
                  Freeze Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}