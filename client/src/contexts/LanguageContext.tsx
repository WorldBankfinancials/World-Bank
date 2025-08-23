import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ar' | 'ja' | 'pt' | 'ru' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'dashboard.title': 'Dashboard',
    'transfer.title': 'Transfer Funds',
    'login.title': 'Login',
    'register.title': 'Register',
    'account.balance': 'Account Balance',
    'transaction.history': 'Transaction History',
    'welcome.message': 'Welcome to World Bank',
    'nav_home': 'Home',
    'nav_cards': 'Cards',
    'nav_transfer': 'Transfer',
    'nav_history': 'History',
    'nav_profile': 'Profile',
    'world_bank': 'World Bank',
    'international_banking': 'International Banking',
  },
  es: {
    'dashboard.title': 'Panel de Control',
    'transfer.title': 'Transferir Fondos',
    'login.title': 'Iniciar Sesión',
    'register.title': 'Registrarse',
    'account.balance': 'Saldo de Cuenta',
    'transaction.history': 'Historial de Transacciones',
    'welcome.message': 'Bienvenido al Banco Mundial',
    'nav_home': 'Inicio',
    'nav_cards': 'Tarjetas',
    'nav_transfer': 'Transferir',
    'nav_history': 'Historial',
    'nav_profile': 'Perfil',
    'world_bank': 'Banco Mundial',
    'international_banking': 'Banca Internacional',
  },
  fr: {
    'dashboard.title': 'Tableau de Bord',
    'transfer.title': 'Transférer des Fonds',
    'login.title': 'Connexion',
    'register.title': "S'inscrire",
    'account.balance': 'Solde du Compte',
    'transaction.history': 'Historique des Transactions',
    'welcome.message': 'Bienvenue à la Banque Mondiale',
    'nav_home': 'Accueil',
    'nav_cards': 'Cartes',
    'nav_transfer': 'Transférer',
    'nav_history': 'Historique',
    'nav_profile': 'Profil',
    'world_bank': 'Banque Mondiale',
    'international_banking': 'Banque Internationale',
  },
  de: {
    'dashboard.title': 'Dashboard',
    'transfer.title': 'Geld überweisen',
    'login.title': 'Anmelden',
    'register.title': 'Registrieren',
    'account.balance': 'Kontostand',
    'transaction.history': 'Transaktionsverlauf',
    'welcome.message': 'Willkommen bei der Weltbank',
    'nav_home': 'Startseite',
    'nav_cards': 'Karten',
    'nav_transfer': 'Überweisung',
    'nav_history': 'Verlauf',
    'nav_profile': 'Profil',
    'world_bank': 'Weltbank',
    'international_banking': 'Internationales Banking',
  },
  zh: {
    'dashboard.title': '仪表板',
    'transfer.title': '转账',
    'login.title': '登录',
    'register.title': '注册',
    'account.balance': '账户余额',
    'transaction.history': '交易历史',
    'welcome.message': '欢迎来到世界银行',
    'nav_home': '首页',
    'nav_cards': '卡片',
    'nav_transfer': '转账',
    'nav_history': '历史',
    'nav_profile': '个人资料',
    'world_bank': '世界银行',
    'international_banking': '国际银行业务',
  },
  ar: {
    'dashboard.title': 'لوحة التحكم',
    'transfer.title': 'تحويل الأموال',
    'login.title': 'تسجيل الدخول',
    'register.title': 'التسجيل',
    'account.balance': 'رصيد الحساب',
    'transaction.history': 'تاريخ المعاملات',
    'welcome.message': 'مرحبا بكم في البنك الدولي',
    'nav_home': 'الرئيسية',
    'nav_cards': 'البطاقات',
    'nav_transfer': 'تحويل',
    'nav_history': 'التاريخ',
    'nav_profile': 'الملف الشخصي',
    'world_bank': 'البنك الدولي',
    'international_banking': 'الخدمات المصرفية الدولية',
  },
  ja: {
    'dashboard.title': 'ダッシュボード',
    'transfer.title': '資金移動',
    'login.title': 'ログイン',
    'register.title': '登録',
    'account.balance': '口座残高',
    'transaction.history': '取引履歴',
    'welcome.message': '世界銀行へようこそ',
    'nav_home': 'ホーム',
    'nav_cards': 'カード',
    'nav_transfer': '送金',
    'nav_history': '履歴',
    'nav_profile': 'プロフィール',
    'world_bank': '世界銀行',
    'international_banking': '国際銀行業務',
  },
  pt: {
    'dashboard.title': 'Painel',
    'transfer.title': 'Transferir Fundos',
    'login.title': 'Entrar',
    'register.title': 'Registrar',
    'account.balance': 'Saldo da Conta',
    'transaction.history': 'Histórico de Transações',
    'welcome.message': 'Bem-vindo ao Banco Mundial',
    'nav_home': 'Início',
    'nav_cards': 'Cartões',
    'nav_transfer': 'Transferir',
    'nav_history': 'Histórico',
    'nav_profile': 'Perfil',
    'world_bank': 'Banco Mundial',
    'international_banking': 'Banco Internacional',
  },
  ru: {
    'dashboard.title': 'Панель управления',
    'transfer.title': 'Перевод средств',
    'login.title': 'Войти',
    'register.title': 'Регистрация',
    'account.balance': 'Баланс счета',
    'transaction.history': 'История транзакций',
    'welcome.message': 'Добро пожаловать во Всемирный банк',
    'nav_home': 'Главная',
    'nav_cards': 'Карты',
    'nav_transfer': 'Перевод',
    'nav_history': 'История',
    'nav_profile': 'Профиль',
    'world_bank': 'Всемирный банк',
    'international_banking': 'Международный банкинг',
  },
  hi: {
    'dashboard.title': 'डैशबोर्ड',
    'transfer.title': 'फंड ट्रांसफर',
    'login.title': 'लॉगिन',
    'register.title': 'रजिस्टर',
    'account.balance': 'खाता शेष',
    'transaction.history': 'लेनदेन इतिहास',
    'welcome.message': 'विश्व बैंक में आपका स्वागत है',
    'nav_home': 'होम',
    'nav_cards': 'कार्ड',
    'nav_transfer': 'ट्रांसफर',
    'nav_history': 'इतिहास',
    'nav_profile': 'प्रोफाइल',
    'world_bank': 'विश्व बैंक',
    'international_banking': 'अंतर्राष्ट्रीय बैंकिंग',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}