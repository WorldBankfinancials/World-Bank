
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ar' | 'ja' | 'pt' | 'ru' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    home: 'Home',
    cards: 'Cards',
    transfer: 'Transfer',
    history: 'History',
    profile: 'Profile',
    
    // Common
    welcome: 'Welcome',
    dashboard: 'Dashboard',
    account: 'Account',
    balance: 'Balance',
    available: 'Available',
    pending: 'Pending',
    total_balance: 'Total Balance',
    my_accounts: 'My Accounts',
    
    // Account types
    checking_account: 'Checking Account',
    savings_account: 'Savings Account',
    investment_account: 'Investment Account',
    
    // Actions
    send: 'Send',
    receive: 'Receive',
    add_money: 'Add Money',
    transfer_funds: 'Transfer Funds',
    live_chat: 'Live Chat',
    customer_support: 'Customer Support',
    
    // Chat
    type_message: 'Type your message...',
    connected: 'Connected',
    connecting: 'Connecting...',
    
    // Time
    vs_last_month: 'vs last month',
    recent_transactions: 'Recent Transactions',
    
    // Status
    verified_account: 'Verified Account',
    online: 'Online',
    authenticated: 'Authenticated'
  },
  zh: {
    // Navigation
    home: '首页',
    cards: '银行卡',
    transfer: '转账',
    history: '历史',
    profile: '个人资料',
    
    // Common
    welcome: '欢迎',
    dashboard: '仪表板',
    account: '账户',
    balance: '余额',
    available: '可用',
    pending: '待处理',
    total_balance: '总余额',
    my_accounts: '我的账户',
    
    // Account types
    checking_account: '支票账户',
    savings_account: '储蓄账户',
    investment_account: '投资账户',
    
    // Actions
    send: '发送',
    receive: '接收',
    add_money: '充值',
    transfer_funds: '转账',
    live_chat: '在线客服',
    customer_support: '客户支持',
    
    // Chat
    type_message: '输入您的消息...',
    connected: '已连接',
    connecting: '连接中...',
    
    // Time
    vs_last_month: '与上月相比',
    recent_transactions: '最近交易',
    
    // Status
    verified_account: '已验证账户',
    online: '在线',
    authenticated: '已认证'
  },
  es: {
    // Navigation
    home: 'Inicio',
    cards: 'Tarjetas',
    transfer: 'Transferir',
    history: 'Historial',
    profile: 'Perfil',
    
    // Common
    welcome: 'Bienvenido',
    dashboard: 'Panel',
    account: 'Cuenta',
    balance: 'Saldo',
    available: 'Disponible',
    pending: 'Pendiente',
    total_balance: 'Saldo Total',
    my_accounts: 'Mis Cuentas',
    
    // Account types
    checking_account: 'Cuenta Corriente',
    savings_account: 'Cuenta de Ahorros',
    investment_account: 'Cuenta de Inversión',
    
    // Actions
    send: 'Enviar',
    receive: 'Recibir',
    add_money: 'Agregar Dinero',
    transfer_funds: 'Transferir Fondos',
    live_chat: 'Chat en Vivo',
    customer_support: 'Soporte al Cliente',
    
    // Chat
    type_message: 'Escribe tu mensaje...',
    connected: 'Conectado',
    connecting: 'Conectando...',
    
    // Time
    vs_last_month: 'vs mes pasado',
    recent_transactions: 'Transacciones Recientes',
    
    // Status
    verified_account: 'Cuenta Verificada',
    online: 'En Línea',
    authenticated: 'Autenticado'
  },
  fr: {
    // Navigation
    home: 'Accueil',
    cards: 'Cartes',
    transfer: 'Virement',
    history: 'Historique',
    profile: 'Profil',
    
    // Common
    welcome: 'Bienvenue',
    dashboard: 'Tableau de Bord',
    account: 'Compte',
    balance: 'Solde',
    available: 'Disponible',
    pending: 'En Attente',
    total_balance: 'Solde Total',
    my_accounts: 'Mes Comptes',
    
    // Account types
    checking_account: 'Compte Courant',
    savings_account: 'Compte Épargne',
    investment_account: 'Compte Investissement',
    
    // Actions
    send: 'Envoyer',
    receive: 'Recevoir',
    add_money: 'Ajouter Argent',
    transfer_funds: 'Virer Fonds',
    live_chat: 'Chat Live',
    customer_support: 'Support Client',
    
    // Chat
    type_message: 'Tapez votre message...',
    connected: 'Connecté',
    connecting: 'Connexion...',
    
    // Time
    vs_last_month: 'vs mois dernier',
    recent_transactions: 'Transactions Récentes',
    
    // Status
    verified_account: 'Compte Vérifié',
    online: 'En Ligne',
    authenticated: 'Authentifié'
  },
  de: {
    // Navigation
    home: 'Startseite',
    cards: 'Karten',
    transfer: 'Überweisung',
    history: 'Verlauf',
    profile: 'Profil',
    
    // Common
    welcome: 'Willkommen',
    dashboard: 'Dashboard',
    account: 'Konto',
    balance: 'Saldo',
    available: 'Verfügbar',
    pending: 'Ausstehend',
    total_balance: 'Gesamtsaldo',
    my_accounts: 'Meine Konten',
    
    // Account types
    checking_account: 'Girokonto',
    savings_account: 'Sparkonto',
    investment_account: 'Anlagekonto',
    
    // Actions
    send: 'Senden',
    receive: 'Erhalten',
    add_money: 'Geld Hinzufügen',
    transfer_funds: 'Geld Überweisen',
    live_chat: 'Live Chat',
    customer_support: 'Kundensupport',
    
    // Chat
    type_message: 'Nachricht eingeben...',
    connected: 'Verbunden',
    connecting: 'Verbindung...',
    
    // Time
    vs_last_month: 'vs letzter Monat',
    recent_transactions: 'Aktuelle Transaktionen',
    
    // Status
    verified_account: 'Verifiziertes Konto',
    online: 'Online',
    authenticated: 'Authentifiziert'
  },
  ar: {
    // Navigation
    home: 'الرئيسية',
    cards: 'البطاقات',
    transfer: 'التحويل',
    history: 'التاريخ',
    profile: 'الملف الشخصي',
    
    // Common
    welcome: 'مرحباً',
    dashboard: 'لوحة التحكم',
    account: 'الحساب',
    balance: 'الرصيد',
    available: 'متاح',
    pending: 'معلق',
    total_balance: 'الرصيد الإجمالي',
    my_accounts: 'حساباتي',
    
    // Account types
    checking_account: 'حساب جاري',
    savings_account: 'حساب توفير',
    investment_account: 'حساب استثمار',
    
    // Actions
    send: 'إرسال',
    receive: 'استقبال',
    add_money: 'إضافة أموال',
    transfer_funds: 'تحويل الأموال',
    live_chat: 'دردشة مباشرة',
    customer_support: 'دعم العملاء',
    
    // Chat
    type_message: 'اكتب رسالتك...',
    connected: 'متصل',
    connecting: 'يتصل...',
    
    // Time
    vs_last_month: 'مقارنة بالشهر الماضي',
    recent_transactions: 'المعاملات الأخيرة',
    
    // Status
    verified_account: 'حساب موثق',
    online: 'متصل',
    authenticated: 'مصادق عليه'
  },
  ja: {
    // Navigation
    home: 'ホーム',
    cards: 'カード',
    transfer: '送金',
    history: '履歴',
    profile: 'プロフィール',
    
    // Common
    welcome: 'ようこそ',
    dashboard: 'ダッシュボード',
    account: 'アカウント',
    balance: '残高',
    available: '利用可能',
    pending: '保留中',
    total_balance: '総残高',
    my_accounts: 'マイアカウント',
    
    // Account types
    checking_account: '当座預金',
    savings_account: '普通預金',
    investment_account: '投資口座',
    
    // Actions
    send: '送信',
    receive: '受信',
    add_money: '入金',
    transfer_funds: '送金',
    live_chat: 'ライブチャット',
    customer_support: 'カスタマーサポート',
    
    // Chat
    type_message: 'メッセージを入力...',
    connected: '接続済み',
    connecting: '接続中...',
    
    // Time
    vs_last_month: '先月比',
    recent_transactions: '最近の取引',
    
    // Status
    verified_account: '確認済みアカウント',
    online: 'オンライン',
    authenticated: '認証済み'
  },
  pt: {
    // Navigation
    home: 'Início',
    cards: 'Cartões',
    transfer: 'Transferir',
    history: 'Histórico',
    profile: 'Perfil',
    
    // Common
    welcome: 'Bem-vindo',
    dashboard: 'Painel',
    account: 'Conta',
    balance: 'Saldo',
    available: 'Disponível',
    pending: 'Pendente',
    total_balance: 'Saldo Total',
    my_accounts: 'Minhas Contas',
    
    // Account types
    checking_account: 'Conta Corrente',
    savings_account: 'Conta Poupança',
    investment_account: 'Conta Investimento',
    
    // Actions
    send: 'Enviar',
    receive: 'Receber',
    add_money: 'Adicionar Dinheiro',
    transfer_funds: 'Transferir Fundos',
    live_chat: 'Chat Ao Vivo',
    customer_support: 'Suporte ao Cliente',
    
    // Chat
    type_message: 'Digite sua mensagem...',
    connected: 'Conectado',
    connecting: 'Conectando...',
    
    // Time
    vs_last_month: 'vs mês passado',
    recent_transactions: 'Transações Recentes',
    
    // Status
    verified_account: 'Conta Verificada',
    online: 'Online',
    authenticated: 'Autenticado'
  },
  ru: {
    // Navigation
    home: 'Главная',
    cards: 'Карты',
    transfer: 'Перевод',
    history: 'История',
    profile: 'Профиль',
    
    // Common
    welcome: 'Добро пожаловать',
    dashboard: 'Панель',
    account: 'Счет',
    balance: 'Баланс',
    available: 'Доступно',
    pending: 'В ожидании',
    total_balance: 'Общий баланс',
    my_accounts: 'Мои счета',
    
    // Account types
    checking_account: 'Текущий счет',
    savings_account: 'Сберегательный счет',
    investment_account: 'Инвестиционный счет',
    
    // Actions
    send: 'Отправить',
    receive: 'Получить',
    add_money: 'Добавить деньги',
    transfer_funds: 'Перевести средства',
    live_chat: 'Живой чат',
    customer_support: 'Поддержка клиентов',
    
    // Chat
    type_message: 'Введите сообщение...',
    connected: 'Подключено',
    connecting: 'Подключение...',
    
    // Time
    vs_last_month: 'в сравнении с прошлым месяцем',
    recent_transactions: 'Недавние транзакции',
    
    // Status
    verified_account: 'Верифицированный аккаунт',
    online: 'Онлайн',
    authenticated: 'Аутентифицирован'
  },
  hi: {
    // Navigation
    home: 'होम',
    cards: 'कार्ड',
    transfer: 'स्थानांतरण',
    history: 'इतिहास',
    profile: 'प्रोफ़ाइल',
    
    // Common
    welcome: 'स्वागत है',
    dashboard: 'डैशबोर्ड',
    account: 'खाता',
    balance: 'शेष राशि',
    available: 'उपलब्ध',
    pending: 'लंबित',
    total_balance: 'कुल शेष राशि',
    my_accounts: 'मेरे खाते',
    
    // Account types
    checking_account: 'चालू खाता',
    savings_account: 'बचत खाता',
    investment_account: 'निवेश खाता',
    
    // Actions
    send: 'भेजें',
    receive: 'प्राप्त करें',
    add_money: 'पैसे जोड़ें',
    transfer_funds: 'फंड ट्रांसफर',
    live_chat: 'लाइव चैट',
    customer_support: 'ग्राहक सहायता',
    
    // Chat
    type_message: 'अपना संदेश टाइप करें...',
    connected: 'जुड़ा हुआ',
    connecting: 'कनेक्ट हो रहा है...',
    
    // Time
    vs_last_month: 'पिछले महीने की तुलना में',
    recent_transactions: 'हाल की लेन-देन',
    
    // Status
    verified_account: 'सत्यापित खाता',
    online: 'ऑनलाइन',
    authenticated: 'प्रमाणित'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
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
