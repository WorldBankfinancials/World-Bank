import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="wb-blue font-bold text-lg mb-4 font-['Inter']">APEX BANKING CORPORATION</div>
            <p className="text-sm wb-text">{t('secure_trusted_global')}</p>
          </div>
          
          <div>
            <h3 className="font-semibold wb-dark mb-3">{t('banking_services')}</h3>
            <ul className="space-y-2 text-sm wb-text">
              <li><a href="#" className="hover:text-blue-600">{t('personal_banking')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('business_banking')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('investment_services')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('loans_credit')}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold wb-dark mb-3">{t('support')}</h3>
            <ul className="space-y-2 text-sm wb-text">
              <li><a href="#" className="hover:text-blue-600">{t('help_center')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('contact_us')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('security_center')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('privacy_policy')}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold wb-dark mb-3">{t('connect')}</h3>
            <div className="flex space-x-4">
              <a href="#" className="wb-text hover:text-blue-600">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="wb-text hover:text-blue-600">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="wb-text hover:text-blue-600">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="wb-text hover:text-blue-600">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm wb-text">
          <p>{t('copyright')} | {t('terms_of_service')} | {t('privacy_policy')}</p>
        </div>
      </div>
    </footer>
  );
}
