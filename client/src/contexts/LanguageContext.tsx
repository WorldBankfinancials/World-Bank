
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
  },
  es: {
    'dashboard.title': 'Panel de Control',
    'transfer.title': 'Transferir Fondos',
    'login.title': 'Iniciar Sesión',
    'register.title': 'Registrarse',
    'account.balance': 'Saldo de Cuenta',
    'transaction.history': 'Historial de Transacciones',
    'welcome.message': 'Bienvenido al Banco Mundial',
  },
  fr: {
    'dashboard.title': 'Tableau de Bord',
    'transfer.title': 'Transférer des Fonds',
    'login.title': 'Connexion',
    'register.title': "S'inscrire",
    'account.balance': 'Solde du Compte',
    'transaction.history': 'Historique des Transactions',
    'welcome.message': 'Bienvenue à la Banque Mondiale',
  },
  de: {
    'dashboard.title': 'Dashboard',
    'transfer.title': 'Geld überweisen',
    'login.title': 'Anmelden',
    'register.title': 'Registrieren',
    'account.balance': 'Kontostand',
    'transaction.history': 'Transaktionsverlauf',
    'welcome.message': 'Willkommen bei der Weltbank',
  },
  zh: {
    'dashboard.title': '仪表板',
    'transfer.title': '转账',
    'login.title': '登录',
    'register.title': '注册',
    'account.balance': '账户余额',
    'transaction.history': '交易历史',
    'welcome.message': '欢迎来到世界银行',
  },
  ar: {
    'dashboard.title': 'لوحة التحكم',
    'transfer.title': 'تحويل الأموال',
    'login.title': 'تسجيل الدخول',
    'register.title': 'التسجيل',
    'account.balance': 'رصيد الحساب',
    'transaction.history': 'تاريخ المعاملات',
    'welcome.message': 'مرحبا بكم في البنك الدولي',
  },
  ja: {
    'dashboard.title': 'ダッシュボード',
    'transfer.title': '資金移動',
    'login.title': 'ログイン',
    'register.title': '登録',
    'account.balance': '口座残高',
    'transaction.history': '取引履歴',
    'welcome.message': '世界銀行へようこそ',
  },
  pt: {
    'dashboard.title': 'Painel',
    'transfer.title': 'Transferir Fundos',
    'login.title': 'Entrar',
    'register.title': 'Registrar',
    'account.balance': 'Saldo da Conta',
    'transaction.history': 'Histórico de Transações',
    'welcome.message': 'Bem-vindo ao Banco Mundial',
  },
  ru: {
    'dashboard.title': 'Панель управления',
    'transfer.title': 'Перевод средств',
    'login.title': 'Войти',
    'register.title': 'Регистрация',
    'account.balance': 'Баланс счета',
    'transaction.history': 'История транзакций',
    'welcome.message': 'Добро пожаловать во Всемирный банк',
  },
  hi: {
    'dashboard.title': 'डैशबोर्ड',
    'transfer.title': 'फंड ट्रांसफर',
    'login.title': 'लॉगिन',
    'register.title': 'रजिस्टर',
    'account.balance': 'खाता शेष',
    'transaction.history': 'लेनदेन इतिहास',
    'welcome.message': 'विश्व बैंक में आपका स्वागत है',
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
