
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BankLogo } from "@/components/BankLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Shield, Users, Award, ArrowRight, Building2, CreditCard, Smartphone, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function AboutPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const services = [
    {
      icon: Building2,
      title: "International Banking",
      description: "Global banking services with multi-currency support"
    },
    {
      icon: CreditCard,
      title: "Digital Payments",
      description: "Secure online and mobile payment solutions"
    },
    {
      icon: Smartphone,
      title: "Mobile Banking",
      description: "Full-featured mobile app for banking on the go"
    },
    {
      icon: TrendingUp,
      title: "Investment Services",
      description: "Professional investment and wealth management"
    }
  ];

  const achievements = [
    {
      icon: Users,
      number: "50M+",
      label: "Customers Worldwide"
    },
    {
      icon: Globe,
      number: "180+",
      label: "Countries Served"
    },
    {
      icon: Shield,
      number: "99.9%",
      label: "Security Uptime"
    },
    {
      icon: Award,
      number: "25+",
      label: "Years of Excellence"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BankLogo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">WORLD BANK</h1>
              <p className="text-sm text-gray-600">International Banking Solutions</p>
            </div>
          </div>
          <Button 
            onClick={() => setLocation("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <BankLogo className="w-24 h-24" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About World Bank
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Leading the future of international banking with innovative digital solutions, 
            secure transactions, and exceptional customer service across the globe.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-gray-700 text-center max-w-4xl mx-auto">
              To provide secure, innovative, and accessible banking services that empower individuals 
              and businesses worldwide to achieve their financial goals. We are committed to excellence, 
              integrity, and building lasting relationships with our customers across all continents.
            </p>
          </CardContent>
        </Card>

        {/* Key Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {achievements.map((achievement, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <achievement.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {achievement.number}
                </div>
                <div className="text-gray-600">{achievement.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Services Overview */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <service.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Company History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                <span>Our History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">1999 - Foundation</h4>
                  <p className="text-gray-600 text-sm">Established as a digital-first international bank</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">2005 - Global Expansion</h4>
                  <p className="text-gray-600 text-sm">Expanded services to over 50 countries</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">2015 - Digital Innovation</h4>
                  <p className="text-gray-600 text-sm">Launched mobile banking and digital wallet services</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">2024 - AI Integration</h4>
                  <p className="text-gray-600 text-sm">Integrated AI-powered financial services and real-time support</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span>Security & Trust</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">256-bit SSL encryption</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Multi-factor authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Real-time fraud monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">FDIC insured deposits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">SOC 2 Type II certified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">24/7 security monitoring</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Our Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Security First</h3>
                <p className="text-gray-600 text-sm">
                  Your financial security is our top priority with industry-leading protection
                </p>
              </div>
              <div className="text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Focus</h3>
                <p className="text-gray-600 text-sm">
                  We put our customers at the center of everything we do
                </p>
              </div>
              <div className="text-center">
                <Globe className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Reach</h3>
                <p className="text-gray-600 text-sm">
                  Connecting people and businesses across borders seamlessly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-6">
                Join millions of customers who trust World Bank for their financial needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setLocation("/register")}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Open Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  onClick={() => setLocation("/customer-support")}
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500">
            © 2024 World Bank. All rights reserved. • Licensed and regulated worldwide
          </p>
        </div>
      </div>
    </div>
  );
}
