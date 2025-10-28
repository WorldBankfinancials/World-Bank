import { useLanguage } from '@/contexts/LanguageContext';
import { BankLogo } from '@/components/BankLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Globe, Users, CreditCard, ArrowLeft, Phone, Mail, Building, Award } from 'lucide-react';
import { useLocation } from 'wouter';

export default function About() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header with Back Button */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Button>
          <div className="flex items-center space-x-2">
            <BankLogo className="w-8 h-8" />
            <span className="font-bold text-gray-900">APEX BANKING CORPORATION</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <BankLogo className="w-24 h-24" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            World Bank
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Leading the future of international banking with secure, innovative, and accessible financial solutions for a connected world.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <Globe className="w-4 h-4" />
              <span>Global Network</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Trusted Worldwide</span>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">International Transfers</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-gray-600 text-sm">
              Secure cross-border payments with competitive exchange rates and real-time transaction tracking.
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Multi-Currency Accounts</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-gray-600 text-sm">
              Hold and manage multiple currencies in one account with automated currency conversion.
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Advanced Security</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-gray-600 text-sm">
              Military-grade encryption, biometric authentication, and 24/7 fraud monitoring.
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Corporate Banking</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-gray-600 text-sm">
              Comprehensive business solutions including trade finance, treasury, and cash management.
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">Investment Services</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-gray-600 text-sm">
              Portfolio management, wealth advisory, and access to global investment opportunities.
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">24/7 Support</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-gray-600 text-sm">
              Round-the-clock customer support in multiple languages with dedicated relationship managers.
            </CardContent>
          </Card>
        </div>

        {/* Technology Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span>Security & Compliance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600">
              <p>Your security is our absolute priority. We employ industry-leading technologies to protect your financial data:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>256-bit SSL encryption for all transactions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Multi-factor authentication with biometrics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>SWIFT network compliance and standards</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>PCI DSS Level 1 certification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Real-time fraud detection and prevention</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
                <Globe className="w-6 h-6 text-green-600" />
                <span>Technology Infrastructure</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600">
              <p>Built on cutting-edge technology for seamless banking experiences:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Real-time transaction processing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Cloud-native architecture for 99.99% uptime</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>AI-powered financial insights and alerts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Mobile-first responsive design</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Multi-language support (17 languages)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Information</h2>
            <p className="text-gray-600">Get in touch with our global support team</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Customer Support</h3>
              <div className="text-gray-600 space-y-1 text-sm">
                <p>24/7 Live Support</p>
                <p className="font-mono">+1-800-WORLD-BANK</p>
                <p>support@worldbank.com</p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Business Banking</h3>
              <div className="text-gray-600 space-y-1 text-sm">
                <p>Monday - Friday 9AM-6PM EST</p>
                <p className="font-mono">+1-800-BUSINESS</p>
                <p>business@worldbank.com</p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">International</h3>
              <div className="text-gray-600 space-y-1 text-sm">
                <p>Global Coverage</p>
                <p className="font-mono">SWIFT: WBANKUSX</p>
                <p>international@worldbank.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-12 space-y-4">
          <div className="space-x-4">
            <Button 
              onClick={() => setLocation('/register-multi')}
              className="wb-button-primary px-8 py-3"
            >
              Open Account Today
            </Button>
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              className="px-8 py-3"
            >
              Sign In to Existing Account
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500 space-y-2">
          <p>© 2025 World Bank Group. All rights reserved.</p>
          <p className="flex items-center justify-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Licensed and regulated financial institution. Member FDIC. SWIFT Member.</span>
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <button className="hover:text-gray-700 transition-colors">Privacy Policy</button>
            <button className="hover:text-gray-700 transition-colors">Terms of Service</button>
            <button className="hover:text-gray-700 transition-colors">Security Center</button>
            <button className="hover:text-gray-700 transition-colors">Contact Us</button>
          </div>
        </div>
      </div>
    </div>
  );
}