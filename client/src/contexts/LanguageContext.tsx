
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language interface
interface Language {
  code: string;
  name: string;
  flag: string;
  translations: Record<string, string>;
}

// Available languages with complete structure
const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    translations: {
      welcome: 'Welcome',
      dashboard: 'Dashboard',
      transfer: 'Transfer',
      history: 'History',
      cards: 'Cards',
      profile: 'Profile',
      logout: 'Logout',
      balance: 'Balance',
      'recent-transactions': 'Recent Transactions',
      'quick-actions': 'Quick Actions',
      'send-money': 'Send Money',
      'receive-money': 'Receive Money',
      'pay-bills': 'Pay Bills',
      'view-statements': 'View Statements'
    }
  },
  {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
    translations: {
      welcome: '欢迎',
      dashboard: '仪表板',
      transfer: '转账',
      history: '历史',
      cards: '卡片',
      profile: '资料',
      logout: '注销',
      balance: '余额',
      'recent-transactions': '最近交易',
      'quick-actions': '快速操作',
      'send-money': '汇款',
      'receive-money': '收款',
      'pay-bills': '付款',
      'view-statements': '查看对账单'
    }
  },
  {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    translations: {
      welcome: 'Bienvenido',
      dashboard: 'Tablero',
      transfer: 'Transferir',
      history: 'Historial',
      cards: 'Tarjetas',
      profile: 'Perfil',
      logout: 'Cerrar sesión',
      balance: 'Saldo',
      'recent-transactions': 'Transacciones Recientes',
      'quick-actions': 'Acciones Rápidas',
      'send-money': 'Enviar Dinero',
      'receive-money': 'Recibir Dinero',
      'pay-bills': 'Pagar Facturas',
      'view-statements': 'Ver Estados de Cuenta'
    }
  },
  {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    translations: {
      welcome: 'Bienvenue',
      dashboard: 'Tableau de bord',
      transfer: 'Transférer',
      history: 'Historique',
      cards: 'Cartes',
      profile: 'Profil',
      logout: 'Se déconnecter',
      balance: 'Solde',
      'recent-transactions': 'Transactions Récentes',
      'quick-actions': 'Actions Rapides',
      'send-money': 'Envoyer de l\'argent',
      'receive-money': 'Recevoir de l\'argent',
      'pay-bills': 'Payer les factures',
      'view-statements': 'Voir les relevés'
    }
  },
  {
    code: 'ar',
    name: 'العربية',
    flag: '🇸🇦',
    translations: {
      welcome: 'مرحباً',
      dashboard: 'لوحة القيادة',
      transfer: 'تحويل',
      history: 'التاريخ',
      cards: 'البطاقات',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      balance: 'الرصيد',
      'recent-transactions': 'المعاملات الأخيرة',
      'quick-actions': 'الإجراءات السريعة',
      'send-money': 'إرسال الأموال',
      'receive-money': 'استقبال الأموال',
      'pay-bills': 'دفع الفواتير',
      'view-statements': 'عرض الكشوفات'
    }
  }
];

// Language context interface
interface LanguageContextType {
  currentLanguage: Language;
  languages: Language[];
  changeLanguage: (code: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: LANGUAGES[0], // Default to English
  languages: LANGUAGES,
  changeLanguage: () => {},
  t: (key: string) => key,
  isRTL: false
});

// Language provider props
interface LanguageProviderProps {
  children: ReactNode;
}

// Language provider component
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    // Safe initialization - always return a valid language
    try {
      const savedLang = localStorage.getItem('selectedLanguage');
      if (savedLang) {
        const found = LANGUAGES.find(lang => lang.code === savedLang);
        return found || LANGUAGES[0];
      }
    } catch (error) {
      console.warn('Error loading saved language:', error);
    }
    return LANGUAGES[0]; // Always fallback to English
  });

  // Change language function
  const changeLanguage = (code: string) => {
    try {
      const language = LANGUAGES.find(lang => lang.code === code);
      if (language) {
        setCurrentLanguage(language);
        localStorage.setItem('selectedLanguage', code);
        
        // Update document direction for RTL languages
        if (language.code === 'ar') {
          document.documentElement.dir = 'rtl';
          document.documentElement.lang = 'ar';
        } else {
          document.documentElement.dir = 'ltr';
          document.documentElement.lang = language.code;
        }
      }
    } catch (error) {
      console.warn('Error changing language:', error);
    }
  };

  // Translation function
  const t = (key: string): string => {
    try {
      return currentLanguage.translations[key] || key;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key;
    }
  };

  // Check if current language is RTL
  const isRTL = currentLanguage.code === 'ar';

  // Set initial document direction
  useEffect(() => {
    try {
      if (currentLanguage.code === 'ar') {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
      } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = currentLanguage.code;
      }
    } catch (error) {
      console.warn('Error setting document direction:', error);
    }
  }, [currentLanguage]);

  // Context value with safe defaults
  const contextValue: LanguageContextType = {
    currentLanguage: currentLanguage || LANGUAGES[0],
    languages: LANGUAGES,
    changeLanguage,
    t,
    isRTL
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    console.warn('useLanguage must be used within a LanguageProvider');
    // Return safe defaults if context is not available
    return {
      currentLanguage: LANGUAGES[0],
      languages: LANGUAGES,
      changeLanguage: () => {},
      t: (key: string) => key,
      isRTL: false
    };
  }
  return context;
}

export default LanguageContext;
