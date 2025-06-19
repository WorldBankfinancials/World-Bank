import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Target, Calendar, Users, Award } from "lucide-react";
import type { User } from "@shared/schema";

export default function WealthManagement() {
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold wb-dark">Wealth Management</h1>
          <p className="text-wb-text mt-2">Professional wealth advisory and investment planning services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Financial Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">Retirement Planning</h3>
                <p className="text-sm text-green-600">Target: $2.5M by 2045</p>
                <div className="mt-2 bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full w-3/4"></div>
                </div>
                <p className="text-xs text-green-600 mt-1">75% complete</p>
              </div>
              <Button className="bg-wb-blue text-white w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Consultation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Your Advisory Team</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-wb-blue-light rounded-full flex items-center justify-center">
                  <span className="font-semibold wb-blue">SA</span>
                </div>
                <div>
                  <p className="font-medium wb-dark">Sarah Anderson</p>
                  <p className="text-sm text-wb-text">Senior Wealth Advisor</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Contact Your Advisor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}