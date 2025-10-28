import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BankLogo } from "@/components/BankLogo";
import { MessageSquare, Users, Headphones, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function CustomerServicePortal() {
  const [, setLocation] = useLocation();

  const handleAccessLiveChat = () => {
    setLocation("/admin-live-chat");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <BankLogo className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            APEX BANKING CORPORATION Customer Service Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional live chat and support ticket management system for customer service representatives
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Real-Time Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Instant messaging with customers using WebSocket technology. Support multiple conversations simultaneously with typing indicators and read receipts.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage customer support tickets with priority levels, categories, and status tracking. Handle urgent banking issues efficiently.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Access customer profiles, account information, and transaction history to provide personalized banking support.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">System Status</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="font-semibold text-green-600">Online</span>
              </div>
              <p className="text-sm text-gray-600">WebSocket Server</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-600">Ready</span>
              </div>
              <p className="text-sm text-gray-600">Chat System</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-orange-600 mr-2" />
                <span className="font-semibold text-orange-600">Active</span>
              </div>
              <p className="text-sm text-gray-600">Support Queue</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Headphones className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-semibold text-purple-600">Available</span>
              </div>
              <p className="text-sm text-gray-600">Customer Service</p>
            </div>
          </div>
        </div>

        {/* Access Instructions */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Access Instructions</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Access the Live Chat System</h3>
                <p className="text-gray-600">Click the "Access Live Chat" button below to enter the customer service dashboard</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Handle Customer Conversations</h3>
                <p className="text-gray-600">View active chats, waiting customers, and respond to support inquiries in real-time</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Manage Support Tickets</h3>
                <p className="text-gray-600">Process priority tickets, update status, and maintain customer satisfaction</p>
              </div>
            </div>
          </div>
        </div>

        {/* NOTE: Current Activity section removed - mock data eliminated per production requirements */}

        {/* Action Button */}
        <div className="text-center">
          <Button 
            onClick={handleAccessLiveChat}
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Access Live Chat System
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            For customer service representatives only • Secure banking environment
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500">
            APEX BANKING CORPORATION Customer Service Portal • Vercel Deployment Ready • Real-time WebSocket Support
          </p>
        </div>
      </div>
    </div>
  );
}
