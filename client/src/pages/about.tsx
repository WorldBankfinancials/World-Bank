import { useLanguage } from '@/contexts/LanguageContext';
import BottomNavigation from '@/components/BottomNavigation';

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              World Bank Digital Banking
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('international_banking_solutions')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Our Mission
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To provide secure, innovative, and accessible banking solutions that connect 
                people and businesses worldwide. We leverage cutting-edge technology to deliver 
                exceptional financial services while maintaining the highest standards of security and compliance.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Services
              </h2>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• International wire transfers</li>
                <li>• Multi-currency accounts</li>
                <li>• Investment management</li>
                <li>• Corporate banking</li>
                <li>• Digital payments</li>
                <li>• 24/7 customer support</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Security & Compliance
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your security is our priority. We employ bank-grade encryption, 
                multi-factor authentication, and comply with international banking regulations 
                including SWIFT standards and anti-money laundering protocols.
              </p>

              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Technology Platform
              </h2>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Real-time transaction processing</li>
                <li>• Supabase authentication system</li>
                <li>• PostgreSQL secure database</li>
                <li>• Mobile-first responsive design</li>
                <li>• Multi-language support</li>
                <li>• Live chat customer support</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Contact Information
              </h2>
              <div className="grid md:grid-cols-3 gap-6 text-gray-600 dark:text-gray-300">
                <div>
                  <h3 className="font-medium mb-2">Customer Support</h3>
                  <p>24/7 Live Chat</p>
                  <p>support@worldbank.com</p>
                  <p>+1-800-WORLD-BANK</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Business Banking</h3>
                  <p>Monday - Friday 9AM-6PM</p>
                  <p>business@worldbank.com</p>
                  <p>+1-800-BUSINESS</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">International</h3>
                  <p>Global coverage</p>
                  <p>international@worldbank.com</p>
                  <p>SWIFT: WBANKUSX</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2025 World Bank Digital Banking. All rights reserved.</p>
            <p>Licensed and regulated financial institution. Member FDIC.</p>
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
