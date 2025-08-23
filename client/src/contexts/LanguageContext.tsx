
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
    
    // Dashboard
    welcome: 'Welcome',
    account_number: 'Account Number',
    account_id: 'Account ID',
    total_balance: 'Total Balance',
    available: 'Available',
    my_accounts: 'My Accounts',
    checking_account: 'Checking Account',
    savings_account: 'Savings Account',
    investment_account: 'Investment Account',
    quick_actions: 'Quick Actions',
    
    // Actions
    international_transfer: 'International Transfer',
    send_money_worldwide: 'Send money worldwide',
    receive: 'Receive',
    request_money: 'Request money',
    add_money: 'Add Money',
    fund_account: 'Fund account',
    live_chat: 'Live Chat',
    customer_support: 'Customer support',
    banking_alerts: 'Banking Alerts',
    new_notifications: 'new notifications',
    statements: 'Statements',
    download_reports: 'Download reports',
    exchange: 'Exchange',
    currency_rates: 'Currency rates',
    investments: 'Investments',
    portfolio_view: 'Portfolio view',
    recent_transactions: 'Recent Transactions',
    
    // Chat
    world_bank_support: 'World Bank Support',
    online: 'Online',
    hello_welcome: 'Hello! Welcome to World Bank. How can I help you today?',
    connected: 'Connected',
    press_enter_to_send: 'Press Enter to send',
    type_message: 'Type your message here...',
    
    // Transfer
    amount: 'Amount',
    recipient_name: 'Recipient Name',
    recipient_account: 'Recipient Account',
    send_transfer: 'Send Transfer',
    transfer_successful: 'Transfer Successful',
    transfer_pending: 'Transfer Pending',
    
    // Common
    submit: 'Submit',
    cancel: 'Cancel',
    confirm: 'Confirm',
    continue: 'Continue',
    back: 'Back',
    next: 'Next',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information'
  },
  zh: {
    // Navigation
    home: '首页',
    cards: '银行卡',
    transfer: '转账',
    history: '历史',
    profile: '个人资料',
    
    // Dashboard
    welcome: '欢迎',
    account_number: '账户号码',
    account_id: '账户ID',
    total_balance: '总余额',
    available: '可用',
    my_accounts: '我的账户',
    checking_account: '支票账户',
    savings_account: '储蓄账户',
    investment_account: '投资账户',
    quick_actions: '快捷操作',
    
    // Actions
    international_transfer: '国际转账',
    send_money_worldwide: '全球汇款',
    receive: '收款',
    request_money: '请求付款',
    add_money: '充值',
    fund_account: '资金账户',
    live_chat: '在线客服',
    customer_support: '客户支持',
    banking_alerts: '银行提醒',
    new_notifications: '新通知',
    statements: '对账单',
    download_reports: '下载报告',
    exchange: '汇率',
    currency_rates: '货币汇率',
    investments: '投资',
    portfolio_view: '投资组合',
    recent_transactions: '最近交易',
    
    // Chat
    world_bank_support: '世界银行客服',
    online: '在线',
    hello_welcome: '您好！欢迎来到世界银行。我今天可以为您做些什么？',
    connected: '已连接',
    press_enter_to_send: '按回车发送',
    type_message: '在此输入您的消息...',
    
    // Transfer
    amount: '金额',
    recipient_name: '收款人姓名',
    recipient_account: '收款人账户',
    send_transfer: '发送转账',
    transfer_successful: '转账成功',
    transfer_pending: '转账处理中',
    
    // Common
    submit: '提交',
    cancel: '取消',
    confirm: '确认',
    continue: '继续',
    back: '返回',
    next: '下一步',
    save: '保存',
    edit: '编辑',
    delete: '删除',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息'
  },
  es: {
    home: 'Inicio',
    cards: 'Tarjetas',
    transfer: 'Transferir',
    history: 'Historial',
    profile: 'Perfil',
    welcome: 'Bienvenido',
    account_number: 'Número de Cuenta',
    total_balance: 'Saldo Total',
    available: 'Disponible',
    international_transfer: 'Transferencia Internacional',
    live_chat: 'Chat en Vivo',
    customer_support: 'Soporte al Cliente',
    type_message: 'Escribe tu mensaje aquí...',
    connected: 'Conectado',
    amount: 'Cantidad',
    recipient_name: 'Nombre del Destinatario',
    submit: 'Enviar',
    cancel: 'Cancelar',
    loading: 'Cargando...'
  },
  fr: {
    home: 'Accueil',
    cards: 'Cartes',
    transfer: 'Virement',
    history: 'Historique',
    profile: 'Profil',
    welcome: 'Bienvenue',
    account_number: 'Numéro de Compte',
    total_balance: 'Solde Total',
    available: 'Disponible',
    international_transfer: 'Virement International',
    live_chat: 'Chat en Direct',
    customer_support: 'Support Client',
    type_message: 'Tapez votre message ici...',
    connected: 'Connecté',
    amount: 'Montant',
    recipient_name: 'Nom du Destinataire',
    submit: 'Soumettre',
    cancel: 'Annuler',
    loading: 'Chargement...'
  },
  de: {
    home: 'Startseite',
    cards: 'Karten',
    transfer: 'Überweisung',
    history: 'Verlauf',
    profile: 'Profil',
    welcome: 'Willkommen',
    account_number: 'Kontonummer',
    total_balance: 'Gesamtsaldo',
    available: 'Verfügbar',
    international_transfer: 'Internationale Überweisung',
    live_chat: 'Live-Chat',
    customer_support: 'Kundensupport',
    type_message: 'Geben Sie hier Ihre Nachricht ein...',
    connected: 'Verbunden',
    amount: 'Betrag',
    recipient_name: 'Name des Empfängers',
    submit: 'Einreichen',
    cancel: 'Abbrechen',
    loading: 'Wird geladen...'
  },
  ar: {
    home: 'الرئيسية',
    cards: 'البطاقات',
    transfer: 'تحويل',
    history: 'التاريخ',
    profile: 'الملف الشخصي',
    welcome: 'مرحباً',
    account_number: 'رقم الحساب',
    total_balance: 'الرصيد الإجمالي',
    available: 'متاح',
    international_transfer: 'تحويل دولي',
    live_chat: 'دردشة مباشرة',
    customer_support: 'دعم العملاء',
    type_message: 'اكتب رسالتك هنا...',
    connected: 'متصل',
    amount: 'المبلغ',
    recipient_name: 'اسم المستلم',
    submit: 'إرسال',
    cancel: 'إلغاء',
    loading: 'جاري التحميل...'
  },
  ja: {
    home: 'ホーム',
    cards: 'カード',
    transfer: '送金',
    history: '履歴',
    profile: 'プロフィール',
    welcome: 'ようこそ',
    account_number: '口座番号',
    total_balance: '総残高',
    available: '利用可能',
    international_transfer: '国際送金',
    live_chat: 'ライブチャット',
    customer_support: 'カスタマーサポート',
    type_message: 'メッセージを入力してください...',
    connected: '接続済み',
    amount: '金額',
    recipient_name: '受取人名',
    submit: '送信',
    cancel: 'キャンセル',
    loading: '読み込み中...'
  },
  pt: {
    home: 'Início',
    cards: 'Cartões',
    transfer: 'Transferir',
    history: 'Histórico',
    profile: 'Perfil',
    welcome: 'Bem-vindo',
    account_number: 'Número da Conta',
    total_balance: 'Saldo Total',
    available: 'Disponível',
    international_transfer: 'Transferência Internacional',
    live_chat: 'Chat ao Vivo',
    customer_support: 'Suporte ao Cliente',
    type_message: 'Digite sua mensagem aqui...',
    connected: 'Conectado',
    amount: 'Valor',
    recipient_name: 'Nome do Destinatário',
    submit: 'Enviar',
    cancel: 'Cancelar',
    loading: 'Carregando...'
  },
  ru: {
    home: 'Главная',
    cards: 'Карты',
    transfer: 'Перевод',
    history: 'История',
    profile: 'Профиль',
    welcome: 'Добро пожаловать',
    account_number: 'Номер счета',
    total_balance: 'Общий баланс',
    available: 'Доступно',
    international_transfer: 'Международный перевод',
    live_chat: 'Живой чат',
    customer_support: 'Поддержка клиентов',
    type_message: 'Введите ваше сообщение здесь...',
    connected: 'Подключено',
    amount: 'Сумма',
    recipient_name: 'Имя получателя',
    submit: 'Отправить',
    cancel: 'Отменить',
    loading: 'Загрузка...'
  },
  hi: {
    home: 'होम',
    cards: 'कार्ड',
    transfer: 'स्थानांतरण',
    history: 'इतिहास',
    profile: 'प्रोफ़ाइल',
    welcome: 'स्वागत है',
    account_number: 'खाता संख्या',
    total_balance: 'कुल शेष',
    available: 'उपलब्ध',
    international_transfer: 'अंतर्राष्ट्रीय स्थानांतरण',
    live_chat: 'लाइव चैट',
    customer_support: 'ग्राहक सहायता',
    type_message: 'यहाँ अपना संदेश टाइप करें...',
    connected: 'जुड़ा हुआ',
    amount: 'राशि',
    recipient_name: 'प्राप्तकर्ता का नाम',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    loading: 'लोड हो रहा है...'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
