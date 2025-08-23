
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Language {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

export const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export const translations = {
  // English
  en: {
    // Common
    welcome: 'Welcome',
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Sign Out',
    login: 'Sign In',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    
    // Account Management
    account: 'Account',
    account_number: 'Account Number',
    account_id: 'Account ID',
    balance: 'Balance',
    available_balance: 'Available Balance',
    total_balance: 'Total Balance',
    my_accounts: 'My Accounts',
    
    // Transfer & Payments
    transfer: 'Transfer',
    transfer_money: 'Transfer Money',
    send_money: 'Send Money',
    receive_money: 'Receive Money',
    amount: 'Amount',
    recipient: 'Recipient',
    send_to: 'Send To',
    transfer_type: 'Transfer Type',
    quick_send: 'Quick Send',
    international: 'International',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    processing_transfer: 'Processing Transfer...',
    send_amount: 'Send',
    account_email_phone_placeholder: 'Account, email or phone',
    select_transfer_type: 'Select transfer type',
    
    // Status indicators
    online: 'Online',
    offline: 'Offline',
    verified: 'Verified',
    unverified: 'Unverified',
    active: 'Active',
    inactive: 'Inactive',
    authenticated: 'Authenticated',
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    
    // Countries
    china: 'China',
    usa: 'United States',
    uk: 'United Kingdom',
    germany: 'Germany',
    france: 'France',
    japan: 'Japan',
    other: 'Other',
  },

  // Chinese
  zh: {
    // Common
    welcome: '欢迎',
    dashboard: '仪表板',
    profile: '个人资料',
    settings: '设置',
    logout: '登出',
    login: '登录',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    edit: '编辑',
    delete: '删除',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
    
    // Account Management
    account: '账户',
    account_number: '账户号码',
    account_id: '账户ID',
    balance: '余额',
    available_balance: '可用余额',
    total_balance: '总余额',
    my_accounts: '我的账户',
    
    // Transfer & Payments
    transfer: '转账',
    transfer_money: '转账',
    send_money: '汇款',
    receive_money: '收款',
    amount: '金额',
    recipient: '收款人',
    send_to: '发送至',
    transfer_type: '转账类型',
    quick_send: '快速发送',
    international: '国际转账',
    bank_transfer: '银行转账',
    mobile_money: '手机支付',
    processing_transfer: '正在处理转账...',
    send_amount: '发送',
    account_email_phone_placeholder: '账户、邮箱或电话',
    select_transfer_type: '选择转账类型',
    
    // Status indicators
    online: '在线',
    offline: '离线',
    verified: '已验证',
    unverified: '未验证',
    active: '活跃',
    inactive: '非活跃',
    authenticated: '已认证',
    pending: '待处理',
    completed: '已完成',
    failed: '失败',
    
    // Countries
    china: '中国',
    usa: '美国',
    uk: '英国',
    germany: '德国',
    france: '法国',
    japan: '日本',
    other: '其他',
  },

  // Spanish
  es: {
    // Common
    welcome: 'Bienvenido',
    dashboard: 'Panel',
    profile: 'Perfil',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    edit: 'Editar',
    delete: 'Eliminar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    
    // Account Management
    account: 'Cuenta',
    account_number: 'Número de Cuenta',
    account_id: 'ID de Cuenta',
    balance: 'Saldo',
    available_balance: 'Saldo Disponible',
    total_balance: 'Saldo Total',
    my_accounts: 'Mis Cuentas',
    
    // Transfer & Payments
    transfer: 'Transferir',
    transfer_money: 'Transferir Dinero',
    send_money: 'Enviar Dinero',
    receive_money: 'Recibir Dinero',
    amount: 'Cantidad',
    recipient: 'Destinatario',
    send_to: 'Enviar a',
    transfer_type: 'Tipo de Transferencia',
    quick_send: 'Envío Rápido',
    international: 'Internacional',
    bank_transfer: 'Transferencia Bancaria',
    mobile_money: 'Dinero Móvil',
    processing_transfer: 'Procesando Transferencia...',
    send_amount: 'Enviar',
    account_email_phone_placeholder: 'Cuenta, email o teléfono',
    select_transfer_type: 'Seleccionar tipo de transferencia',
    
    // Status indicators
    online: 'En Línea',
    offline: 'Fuera de Línea',
    verified: 'Verificado',
    unverified: 'No Verificado',
    active: 'Activo',
    inactive: 'Inactivo',
    authenticated: 'Autenticado',
    pending: 'Pendiente',
    completed: 'Completado',
    failed: 'Fallido',
    
    // Countries
    china: 'China',
    usa: 'Estados Unidos',
    uk: 'Reino Unido',
    germany: 'Alemania',
    france: 'Francia',
    japan: 'Japón',
    other: 'Otro',
  },

  // French
  fr: {
    // Common
    welcome: 'Bienvenue',
    dashboard: 'Tableau de bord',
    profile: 'Profil',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
    login: 'Se connecter',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Sauvegarder',
    edit: 'Modifier',
    delete: 'Supprimer',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    
    // Account Management
    account: 'Compte',
    account_number: 'Numéro de Compte',
    account_id: 'ID de Compte',
    balance: 'Solde',
    available_balance: 'Solde Disponible',
    total_balance: 'Solde Total',
    my_accounts: 'Mes Comptes',
    
    // Transfer & Payments
    transfer: 'Transfert',
    transfer_money: 'Transférer de l\'Argent',
    send_money: 'Envoyer de l\'Argent',
    receive_money: 'Recevoir de l\'Argent',
    amount: 'Montant',
    recipient: 'Destinataire',
    send_to: 'Envoyer à',
    transfer_type: 'Type de Transfert',
    quick_send: 'Envoi Rapide',
    international: 'International',
    bank_transfer: 'Virement Bancaire',
    mobile_money: 'Argent Mobile',
    processing_transfer: 'Traitement du Transfert...',
    send_amount: 'Envoyer',
    account_email_phone_placeholder: 'Compte, email ou téléphone',
    select_transfer_type: 'Sélectionner le type de transfert',
    
    // Status indicators
    online: 'En Ligne',
    offline: 'Hors Ligne',
    verified: 'Vérifié',
    unverified: 'Non Vérifié',
    active: 'Actif',
    inactive: 'Inactif',
    authenticated: 'Authentifié',
    pending: 'En Attente',
    completed: 'Terminé',
    failed: 'Échoué',
    
    // Countries
    china: 'Chine',
    usa: 'États-Unis',
    uk: 'Royaume-Uni',
    germany: 'Allemagne',
    france: 'France',
    japan: 'Japon',
    other: 'Autre',
  },

  // Arabic
  ar: {
    // Common
    welcome: 'مرحباً',
    dashboard: 'لوحة التحكم',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ',
    edit: 'تحرير',
    delete: 'حذف',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    
    // Account Management
    account: 'حساب',
    account_number: 'رقم الحساب',
    account_id: 'معرف الحساب',
    balance: 'الرصيد',
    available_balance: 'الرصيد المتاح',
    total_balance: 'إجمالي الرصيد',
    my_accounts: 'حساباتي',
    
    // Transfer & Payments
    transfer: 'تحويل',
    transfer_money: 'تحويل أموال',
    send_money: 'إرسال أموال',
    receive_money: 'استقبال أموال',
    amount: 'المبلغ',
    recipient: 'المستقبل',
    send_to: 'إرسال إلى',
    transfer_type: 'نوع التحويل',
    quick_send: 'إرسال سريع',
    international: 'دولي',
    bank_transfer: 'تحويل مصرفي',
    mobile_money: 'النقود المحمولة',
    processing_transfer: 'معالجة التحويل...',
    send_amount: 'إرسال',
    account_email_phone_placeholder: 'الحساب أو البريد أو الهاتف',
    select_transfer_type: 'اختر نوع التحويل',
    
    // Status indicators
    online: 'متصل',
    offline: 'غير متصل',
    verified: 'مُتحقق',
    unverified: 'غير مُتحقق',
    active: 'نشط',
    inactive: 'غير نشط',
    authenticated: 'مُصادق عليه',
    pending: 'في انتظار',
    completed: 'مكتمل',
    failed: 'فشل',
    
    // Countries
    china: 'الصين',
    usa: 'الولايات المتحدة',
    uk: 'المملكة المتحدة',
    germany: 'ألمانيا',
    france: 'فرنسا',
    japan: 'اليابان',
    other: 'أخرى',
  },

  // Russian
  ru: {
    // Common
    welcome: 'Добро пожаловать',
    dashboard: 'Панель управления',
    profile: 'Профиль',
    settings: 'Настройки',
    logout: 'Выйти',
    login: 'Войти',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успех',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    save: 'Сохранить',
    edit: 'Редактировать',
    delete: 'Удалить',
    search: 'Поиск',
    filter: 'Фильтр',
    sort: 'Сортировка',
    
    // Account Management
    account: 'Счет',
    account_number: 'Номер счета',
    account_id: 'ID счета',
    balance: 'Баланс',
    available_balance: 'Доступный баланс',
    total_balance: 'Общий баланс',
    my_accounts: 'Мои счета',
    
    // Transfer & Payments
    transfer: 'Перевод',
    transfer_money: 'Перевести деньги',
    send_money: 'Отправить деньги',
    receive_money: 'Получить деньги',
    amount: 'Сумма',
    recipient: 'Получатель',
    send_to: 'Отправить в',
    transfer_type: 'Тип перевода',
    quick_send: 'Быстрая отправка',
    international: 'Международный',
    bank_transfer: 'Банковский перевод',
    mobile_money: 'Мобильные деньги',
    processing_transfer: 'Обработка перевода...',
    send_amount: 'Отправить',
    account_email_phone_placeholder: 'Счет, email или телефон',
    select_transfer_type: 'Выберите тип перевода',
    
    // Status indicators
    online: 'Онлайн',
    offline: 'Офлайн',
    verified: 'Проверен',
    unverified: 'Не проверен',
    active: 'Активный',
    inactive: 'Неактивный',
    authenticated: 'Аутентифицирован',
    pending: 'В ожидании',
    completed: 'Завершено',
    failed: 'Неудачно',
    
    // Countries
    china: 'Китай',
    usa: 'США',
    uk: 'Великобритания',
    germany: 'Германия',
    france: 'Франция',
    japan: 'Япония',
    other: 'Другое',
  },

  // Japanese
  ja: {
    // Common
    welcome: 'ようこそ',
    dashboard: 'ダッシュボード',
    profile: 'プロフィール',
    settings: '設定',
    logout: 'ログアウト',
    login: 'ログイン',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    cancel: 'キャンセル',
    confirm: '確認',
    save: '保存',
    edit: '編集',
    delete: '削除',
    search: '検索',
    filter: 'フィルター',
    sort: 'ソート',
    
    // Account Management
    account: 'アカウント',
    account_number: 'アカウント番号',
    account_id: 'アカウントID',
    balance: '残高',
    available_balance: '利用可能残高',
    total_balance: '総残高',
    my_accounts: '私のアカウント',
    
    // Transfer & Payments
    transfer: '転送',
    transfer_money: '送金',
    send_money: 'お金を送る',
    receive_money: 'お金を受け取る',
    amount: '金額',
    recipient: '受信者',
    send_to: '送信先',
    transfer_type: '転送タイプ',
    quick_send: 'クイック送信',
    international: '国際',
    bank_transfer: '銀行振込',
    mobile_money: 'モバイルマネー',
    processing_transfer: '転送処理中...',
    send_amount: '送信',
    account_email_phone_placeholder: 'アカウント、メール、または電話',
    select_transfer_type: '転送タイプを選択',
    
    // Status indicators
    online: 'オンライン',
    offline: 'オフライン',
    verified: '確認済み',
    unverified: '未確認',
    active: 'アクティブ',
    inactive: '非アクティブ',
    authenticated: '認証済み',
    pending: '保留中',
    completed: '完了',
    failed: '失敗',
    
    // Countries
    china: '中国',
    usa: 'アメリカ',
    uk: 'イギリス',
    germany: 'ドイツ',
    france: 'フランス',
    japan: '日本',
    other: 'その他',
  },

  // German
  de: {
    // Common
    welcome: 'Willkommen',
    dashboard: 'Dashboard',
    profile: 'Profil',
    settings: 'Einstellungen',
    logout: 'Abmelden',
    login: 'Anmelden',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    save: 'Speichern',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    search: 'Suchen',
    filter: 'Filter',
    sort: 'Sortieren',
    
    // Account Management
    account: 'Konto',
    account_number: 'Kontonummer',
    account_id: 'Konto-ID',
    balance: 'Saldo',
    available_balance: 'Verfügbarer Saldo',
    total_balance: 'Gesamtsaldo',
    my_accounts: 'Meine Konten',
    
    // Transfer & Payments
    transfer: 'Überweisung',
    transfer_money: 'Geld überweisen',
    send_money: 'Geld senden',
    receive_money: 'Geld empfangen',
    amount: 'Betrag',
    recipient: 'Empfänger',
    send_to: 'Senden an',
    transfer_type: 'Überweisungstyp',
    quick_send: 'Schnellsendung',
    international: 'International',
    bank_transfer: 'Banküberweisung',
    mobile_money: 'Mobile Geld',
    processing_transfer: 'Überweisung wird verarbeitet...',
    send_amount: 'Senden',
    account_email_phone_placeholder: 'Konto, E-Mail oder Telefon',
    select_transfer_type: 'Überweisungstyp auswählen',
    
    // Status indicators
    online: 'Online',
    offline: 'Offline',
    verified: 'Verifiziert',
    unverified: 'Nicht verifiziert',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    authenticated: 'Authentifiziert',
    pending: 'Ausstehend',
    completed: 'Abgeschlossen',
    failed: 'Fehlgeschlagen',
    
    // Countries
    china: 'China',
    usa: 'USA',
    uk: 'Vereinigtes Königreich',
    germany: 'Deutschland',
    france: 'Frankreich',
    japan: 'Japan',
    other: 'Andere',
  },

  // Portuguese
  pt: {
    // Common
    welcome: 'Bem-vindo',
    dashboard: 'Painel',
    profile: 'Perfil',
    settings: 'Configurações',
    logout: 'Sair',
    login: 'Entrar',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Salvar',
    edit: 'Editar',
    delete: 'Excluir',
    search: 'Pesquisar',
    filter: 'Filtrar',
    sort: 'Classificar',
    
    // Account Management
    account: 'Conta',
    account_number: 'Número da Conta',
    account_id: 'ID da Conta',
    balance: 'Saldo',
    available_balance: 'Saldo Disponível',
    total_balance: 'Saldo Total',
    my_accounts: 'Minhas Contas',
    
    // Transfer & Payments
    transfer: 'Transferir',
    transfer_money: 'Transferir Dinheiro',
    send_money: 'Enviar Dinheiro',
    receive_money: 'Receber Dinheiro',
    amount: 'Quantia',
    recipient: 'Destinatário',
    send_to: 'Enviar para',
    transfer_type: 'Tipo de Transferência',
    quick_send: 'Envio Rápido',
    international: 'Internacional',
    bank_transfer: 'Transferência Bancária',
    mobile_money: 'Dinheiro Móvel',
    processing_transfer: 'Processando Transferência...',
    send_amount: 'Enviar',
    account_email_phone_placeholder: 'Conta, email ou telefone',
    select_transfer_type: 'Selecionar tipo de transferência',
    
    // Status indicators
    online: 'Online',
    offline: 'Offline',
    verified: 'Verificado',
    unverified: 'Não Verificado',
    active: 'Ativo',
    inactive: 'Inativo',
    authenticated: 'Autenticado',
    pending: 'Pendente',
    completed: 'Concluído',
    failed: 'Falhou',
    
    // Countries
    china: 'China',
    usa: 'Estados Unidos',
    uk: 'Reino Unido',
    germany: 'Alemanha',
    france: 'França',
    japan: 'Japão',
    other: 'Outro',
  },

  // Korean
  ko: {
    // Common
    welcome: '환영합니다',
    dashboard: '대시보드',
    profile: '프로필',
    settings: '설정',
    logout: '로그아웃',
    login: '로그인',
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
    cancel: '취소',
    confirm: '확인',
    save: '저장',
    edit: '편집',
    delete: '삭제',
    search: '검색',
    filter: '필터',
    sort: '정렬',
    
    // Account Management
    account: '계정',
    account_number: '계좌번호',
    account_id: '계정 ID',
    balance: '잔액',
    available_balance: '사용 가능한 잔액',
    total_balance: '총 잔액',
    my_accounts: '내 계정',
    
    // Transfer & Payments
    transfer: '이체',
    transfer_money: '송금',
    send_money: '돈 보내기',
    receive_money: '돈 받기',
    amount: '금액',
    recipient: '수신자',
    send_to: '보내기',
    transfer_type: '이체 유형',
    quick_send: '빠른 송금',
    international: '국제',
    bank_transfer: '은행 이체',
    mobile_money: '모바일 머니',
    processing_transfer: '이체 처리 중...',
    send_amount: '보내기',
    account_email_phone_placeholder: '계정, 이메일 또는 전화',
    select_transfer_type: '이체 유형 선택',
    
    // Status indicators
    online: '온라인',
    offline: '오프라인',
    verified: '검증됨',
    unverified: '미검증',
    active: '활성',
    inactive: '비활성',
    authenticated: '인증됨',
    pending: '대기 중',
    completed: '완료',
    failed: '실패',
    
    // Countries
    china: '중국',
    usa: '미국',
    uk: '영국',
    germany: '독일',
    france: '프랑스',
    japan: '일본',
    other: '기타',
  },
};

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]); // Default to English

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage) {
      const language = languages.find(lang => lang.code === savedLanguage);
      if (language) {
        setCurrentLanguage(language);
      }
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      const language = languages.find(lang => lang.code === browserLang);
      if (language) {
        setCurrentLanguage(language);
      }
    }
  }, []);

  const setLanguage = (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
      setCurrentLanguage(language);
      localStorage.setItem('preferred-language', languageCode);
      
      // Update document direction for RTL languages
      document.documentElement.setAttribute('dir', language.rtl ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', languageCode);
    }
  };

  const t = (key: string): string => {
    const translation = translations[currentLanguage.code as keyof typeof translations];
    if (translation && translation[key as keyof typeof translation]) {
      return translation[key as keyof typeof translation] as string;
    }
    
    // Fallback to English
    const englishTranslation = translations.en[key as keyof typeof translations.en];
    if (englishTranslation) {
      return englishTranslation as string;
    }
    
    // Return the key if no translation found
    return key;
  };

  const isRTL = currentLanguage.rtl || false;

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLanguage.code);
  }, [currentLanguage, isRTL]);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
