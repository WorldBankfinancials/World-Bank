
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language interface
interface Language {
  code: string;
  name: string;
  flag: string;
  translations: Record<string, string>;
}

// Complete translations for all languages
const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    translations: {
      // Navigation
      welcome: 'Welcome',
      dashboard: 'Dashboard',
      transfer: 'Transfer',
      history: 'History',
      cards: 'Cards',
      profile: 'Profile',
      logout: 'Logout',
      
      // Common
      balance: 'Balance',
      'recent-transactions': 'Recent Transactions',
      'quick-actions': 'Quick Actions',
      'send-money': 'Send Money',
      'receive-money': 'Receive Money',
      'pay-bills': 'Pay Bills',
      'view-statements': 'View Statements',
      
      // Banking
      'my-cards': 'My Cards',
      'manage-cards': 'Manage your credit and debit cards',
      'add-card': 'Add Card',
      'view-details': 'View Details',
      manage: 'Manage',
      
      // Services
      'instant-payments': 'Instant Payments',
      'instant-payments-desc': 'Global instant payments',
      'secure-transactions': 'Secure Transactions',
      'secure-transactions-desc': 'Bank-grade transaction security',
      'mobile-wallet': 'Mobile Wallet',
      'mobile-wallet-desc': 'Contactless payments with your phone',
      
      // Actions
      'hide-balances': 'Hide Balances',
      'show-balances': 'Show Balances',
      'lock-card': 'Lock Card',
      'unlock-card': 'Unlock Card',
      'mobile-pay': 'Mobile Pay',
      'pay-bill': 'Pay Bill',
      
      // Status
      'card-locked': 'Card Locked',
      'card-unlocked': 'Card Unlocked',
      'card-locked-desc': 'Your card has been locked for security',
      'card-unlocked-desc': 'Your card has been unlocked successfully',
      'lock-card-desc': 'Enter your PIN to lock this card',
      'unlock-card-desc': 'Enter your PIN to unlock this card',
      
      // Personal Banking
      'personal-banking': 'Personal Banking',
      'investment-services': 'Investment Services',
      copyright: 'Copyright',
      'terms-of-service': 'Terms of Service',
      
      // Verification
      'phone-verification': 'Phone Verification',
      'verify-mobile-number': 'Verify your mobile number for secure communication',
      'address-verification': 'Address Verification',
      'proof-of-residence-verification': 'Proof of residence verification for compliance requirements',
      'income-verification': 'Income Verification',
      'employment-and-income-proof': 'Employment and income proof to determine account limits',
      'enhanced-due-diligence': 'Enhanced Due Diligence',
      'additional-verification-high-value': 'Additional verification for high-value transactions',
      'biometric-verification': 'Biometric Verification',
      'facial-recognition-fingerprint': 'Facial recognition and fingerprint verification',
      'tax-compliance': 'Tax Compliance',
      'tax-residency-status': 'Tax residency status and compliance verification',
      
      // Account
      'account-security-level': 'Account Security Level',
      'fully-verified': 'Fully Verified',
      'total-verifications': 'Total Verifications',
      verified: 'Verified',
      pending: 'Pending',
      required: 'Required',
      'action-required': 'Action Required',
      'all-verifications': 'All Verifications',
      'submitted-documents': 'Submitted Documents',
      'last-updated': 'Last Updated',
      'upload-documents': 'Upload Documents',
      'under-review': 'Under Review',
      'upload-verification-documents': 'Upload Verification Documents',
      'drag-drop-files-here': 'Drag & drop files here',
      'or-click-to-browse': 'or click to browse',
      
      // PIN Management
      'change-pin': 'Change PIN',
      'pin-too-short': 'PIN must be 4 digits',
      'confirm-pin-change': 'Confirm PIN Change',
      'pin-change-confirmation-message': 'Are you sure you want to change your transfer PIN?',
      'confirm-change': 'Confirm Change'
    }
  },
  {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
    translations: {
      // Navigation
      welcome: '欢迎',
      dashboard: '仪表板',
      transfer: '转账',
      history: '历史',
      cards: '卡片',
      profile: '资料',
      logout: '注销',
      
      // Common
      balance: '余额',
      'recent-transactions': '最近交易',
      'quick-actions': '快速操作',
      'send-money': '汇款',
      'receive-money': '收款',
      'pay-bills': '付款',
      'view-statements': '查看对账单',
      
      // Banking
      'my-cards': '我的卡片',
      'manage-cards': '管理您的信用卡和借记卡',
      'add-card': '添加卡片',
      'view-details': '查看详情',
      manage: '管理',
      
      // Services
      'instant-payments': '即时支付',
      'instant-payments-desc': '全球即时支付',
      'secure-transactions': '安全交易',
      'secure-transactions-desc': '银行级交易安全',
      'mobile-wallet': '移动钱包',
      'mobile-wallet-desc': '使用手机进行非接触式支付',
      
      // Actions
      'hide-balances': '隐藏余额',
      'show-balances': '显示余额',
      'lock-card': '锁定卡片',
      'unlock-card': '解锁卡片',
      'mobile-pay': '手机支付',
      'pay-bill': '缴费',
      
      // Status
      'card-locked': '卡片已锁定',
      'card-unlocked': '卡片已解锁',
      'card-locked-desc': '您的卡片已为安全起见被锁定',
      'card-unlocked-desc': '您的卡片已成功解锁',
      'lock-card-desc': '输入您的PIN码以锁定此卡片',
      'unlock-card-desc': '输入您的PIN码以解锁此卡片',
      
      // Personal Banking
      'personal-banking': '个人银行',
      'investment-services': '投资服务',
      copyright: '版权',
      'terms-of-service': '服务条款',
      
      // Verification
      'phone-verification': '手机验证',
      'verify-mobile-number': '验证您的手机号码以确保安全通信',
      'address-verification': '地址验证',
      'proof-of-residence-verification': '居住证明验证以符合合规要求',
      'income-verification': '收入验证',
      'employment-and-income-proof': '就业和收入证明以确定账户限额',
      'enhanced-due-diligence': '增强尽职调查',
      'additional-verification-high-value': '高价值交易的额外验证',
      'biometric-verification': '生物识别验证',
      'facial-recognition-fingerprint': '面部识别和指纹验证',
      'tax-compliance': '税务合规',
      'tax-residency-status': '税务居住状态和合规验证',
      
      // Account
      'account-security-level': '账户安全级别',
      'fully-verified': '完全验证',
      'total-verifications': '总验证项目',
      verified: '已验证',
      pending: '待处理',
      required: '必需',
      'action-required': '需要操作',
      'all-verifications': '所有验证',
      'submitted-documents': '已提交文件',
      'last-updated': '最后更新',
      'upload-documents': '上传文件',
      'under-review': '审核中',
      'upload-verification-documents': '上传验证文件',
      'drag-drop-files-here': '拖拽文件到这里',
      'or-click-to-browse': '或点击浏览',
      
      // PIN Management
      'change-pin': '更改PIN码',
      'pin-too-short': 'PIN码必须是4位数字',
      'confirm-pin-change': '确认PIN码更改',
      'pin-change-confirmation-message': '您确定要更改您的转账PIN码吗？',
      'confirm-change': '确认更改'
    }
  },
  {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    translations: {
      // Navigation
      welcome: 'Bienvenido',
      dashboard: 'Tablero',
      transfer: 'Transferir',
      history: 'Historial',
      cards: 'Tarjetas',
      profile: 'Perfil',
      logout: 'Cerrar sesión',
      
      // Common
      balance: 'Saldo',
      'recent-transactions': 'Transacciones Recientes',
      'quick-actions': 'Acciones Rápidas',
      'send-money': 'Enviar Dinero',
      'receive-money': 'Recibir Dinero',
      'pay-bills': 'Pagar Facturas',
      'view-statements': 'Ver Estados de Cuenta',
      
      // Banking
      'my-cards': 'Mis Tarjetas',
      'manage-cards': 'Gestiona tus tarjetas de crédito y débito',
      'add-card': 'Agregar Tarjeta',
      'view-details': 'Ver Detalles',
      manage: 'Gestionar',
      
      // Services
      'instant-payments': 'Pagos Instantáneos',
      'instant-payments-desc': 'Pagos instantáneos globales',
      'secure-transactions': 'Transacciones Seguras',
      'secure-transactions-desc': 'Seguridad de transacciones bancarias',
      'mobile-wallet': 'Billetera Móvil',
      'mobile-wallet-desc': 'Pagos sin contacto con tu teléfono',
      
      // Actions
      'hide-balances': 'Ocultar Saldos',
      'show-balances': 'Mostrar Saldos',
      'lock-card': 'Bloquear Tarjeta',
      'unlock-card': 'Desbloquear Tarjeta',
      'mobile-pay': 'Pago Móvil',
      'pay-bill': 'Pagar Factura',
      
      // Status
      'card-locked': 'Tarjeta Bloqueada',
      'card-unlocked': 'Tarjeta Desbloqueada',
      'card-locked-desc': 'Tu tarjeta ha sido bloqueada por seguridad',
      'card-unlocked-desc': 'Tu tarjeta ha sido desbloqueada exitosamente',
      'lock-card-desc': 'Ingresa tu PIN para bloquear esta tarjeta',
      'unlock-card-desc': 'Ingresa tu PIN para desbloquear esta tarjeta',
      
      // Personal Banking
      'personal-banking': 'Banca Personal',
      'investment-services': 'Servicios de Inversión',
      copyright: 'Copyright',
      'terms-of-service': 'Términos de Servicio',
      
      // Verification
      'phone-verification': 'Verificación Telefónica',
      'verify-mobile-number': 'Verifica tu número móvil para comunicación segura',
      'address-verification': 'Verificación de Dirección',
      'proof-of-residence-verification': 'Verificación de prueba de residencia para requisitos de cumplimiento',
      'income-verification': 'Verificación de Ingresos',
      'employment-and-income-proof': 'Prueba de empleo e ingresos para determinar límites de cuenta',
      'enhanced-due-diligence': 'Diligencia Debida Mejorada',
      'additional-verification-high-value': 'Verificación adicional para transacciones de alto valor',
      'biometric-verification': 'Verificación Biométrica',
      'facial-recognition-fingerprint': 'Reconocimiento facial y verificación de huellas dactilares',
      'tax-compliance': 'Cumplimiento Fiscal',
      'tax-residency-status': 'Estado de residencia fiscal y verificación de cumplimiento',
      
      // Account
      'account-security-level': 'Nivel de Seguridad de la Cuenta',
      'fully-verified': 'Completamente Verificado',
      'total-verifications': 'Verificaciones Totales',
      verified: 'Verificado',
      pending: 'Pendiente',
      required: 'Requerido',
      'action-required': 'Acción Requerida',
      'all-verifications': 'Todas las Verificaciones',
      'submitted-documents': 'Documentos Enviados',
      'last-updated': 'Última Actualización',
      'upload-documents': 'Subir Documentos',
      'under-review': 'En Revisión',
      'upload-verification-documents': 'Subir Documentos de Verificación',
      'drag-drop-files-here': 'Arrastra y suelta archivos aquí',
      'or-click-to-browse': 'o haz clic para navegar',
      
      // PIN Management
      'change-pin': 'Cambiar PIN',
      'pin-too-short': 'El PIN debe ser de 4 dígitos',
      'confirm-pin-change': 'Confirmar Cambio de PIN',
      'pin-change-confirmation-message': '¿Estás seguro de que quieres cambiar tu PIN de transferencia?',
      'confirm-change': 'Confirmar Cambio'
    }
  },
  {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    translations: {
      // Navigation
      welcome: 'Bienvenue',
      dashboard: 'Tableau de bord',
      transfer: 'Transférer',
      history: 'Historique',
      cards: 'Cartes',
      profile: 'Profil',
      logout: 'Se déconnecter',
      
      // Common
      balance: 'Solde',
      'recent-transactions': 'Transactions Récentes',
      'quick-actions': 'Actions Rapides',
      'send-money': 'Envoyer de l\'argent',
      'receive-money': 'Recevoir de l\'argent',
      'pay-bills': 'Payer les factures',
      'view-statements': 'Voir les relevés',
      
      // Banking
      'my-cards': 'Mes Cartes',
      'manage-cards': 'Gérez vos cartes de crédit et de débit',
      'add-card': 'Ajouter une Carte',
      'view-details': 'Voir les Détails',
      manage: 'Gérer',
      
      // Services
      'instant-payments': 'Paiements Instantanés',
      'instant-payments-desc': 'Paiements instantanés mondiaux',
      'secure-transactions': 'Transactions Sécurisées',
      'secure-transactions-desc': 'Sécurité des transactions bancaires',
      'mobile-wallet': 'Portefeuille Mobile',
      'mobile-wallet-desc': 'Paiements sans contact avec votre téléphone',
      
      // Actions
      'hide-balances': 'Masquer les Soldes',
      'show-balances': 'Afficher les Soldes',
      'lock-card': 'Verrouiller la Carte',
      'unlock-card': 'Déverrouiller la Carte',
      'mobile-pay': 'Paiement Mobile',
      'pay-bill': 'Payer la Facture',
      
      // Status
      'card-locked': 'Carte Verrouillée',
      'card-unlocked': 'Carte Déverrouillée',
      'card-locked-desc': 'Votre carte a été verrouillée pour la sécurité',
      'card-unlocked-desc': 'Votre carte a été déverrouillée avec succès',
      'lock-card-desc': 'Entrez votre PIN pour verrouiller cette carte',
      'unlock-card-desc': 'Entrez votre PIN pour déverrouiller cette carte',
      
      // Personal Banking
      'personal-banking': 'Banque Personnelle',
      'investment-services': 'Services d\'Investissement',
      copyright: 'Copyright',
      'terms-of-service': 'Conditions de Service',
      
      // Verification
      'phone-verification': 'Vérification Téléphonique',
      'verify-mobile-number': 'Vérifiez votre numéro de mobile pour une communication sécurisée',
      'address-verification': 'Vérification d\'Adresse',
      'proof-of-residence-verification': 'Vérification de preuve de résidence pour les exigences de conformité',
      'income-verification': 'Vérification des Revenus',
      'employment-and-income-proof': 'Preuve d\'emploi et de revenus pour déterminer les limites de compte',
      'enhanced-due-diligence': 'Diligence Raisonnée Renforcée',
      'additional-verification-high-value': 'Vérification supplémentaire pour les transactions de grande valeur',
      'biometric-verification': 'Vérification Biométrique',
      'facial-recognition-fingerprint': 'Reconnaissance faciale et vérification d\'empreintes digitales',
      'tax-compliance': 'Conformité Fiscale',
      'tax-residency-status': 'Statut de résidence fiscale et vérification de conformité',
      
      // Account
      'account-security-level': 'Niveau de Sécurité du Compte',
      'fully-verified': 'Entièrement Vérifié',
      'total-verifications': 'Vérifications Totales',
      verified: 'Vérifié',
      pending: 'En Attente',
      required: 'Requis',
      'action-required': 'Action Requise',
      'all-verifications': 'Toutes les Vérifications',
      'submitted-documents': 'Documents Soumis',
      'last-updated': 'Dernière Mise à Jour',
      'upload-documents': 'Télécharger des Documents',
      'under-review': 'En Révision',
      'upload-verification-documents': 'Télécharger les Documents de Vérification',
      'drag-drop-files-here': 'Glissez-déposez les fichiers ici',
      'or-click-to-browse': 'ou cliquez pour parcourir',
      
      // PIN Management
      'change-pin': 'Changer le PIN',
      'pin-too-short': 'Le PIN doit comporter 4 chiffres',
      'confirm-pin-change': 'Confirmer le Changement de PIN',
      'pin-change-confirmation-message': 'Êtes-vous sûr de vouloir changer votre PIN de transfert?',
      'confirm-change': 'Confirmer le Changement'
    }
  },
  {
    code: 'ar',
    name: 'العربية',
    flag: '🇸🇦',
    translations: {
      // Navigation
      welcome: 'مرحباً',
      dashboard: 'لوحة القيادة',
      transfer: 'تحويل',
      history: 'التاريخ',
      cards: 'البطاقات',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      
      // Common
      balance: 'الرصيد',
      'recent-transactions': 'المعاملات الأخيرة',
      'quick-actions': 'الإجراءات السريعة',
      'send-money': 'إرسال الأموال',
      'receive-money': 'استقبال الأموال',
      'pay-bills': 'دفع الفواتير',
      'view-statements': 'عرض الكشوفات',
      
      // Banking
      'my-cards': 'بطاقاتي',
      'manage-cards': 'إدارة بطاقات الائتمان والخصم الخاصة بك',
      'add-card': 'إضافة بطاقة',
      'view-details': 'عرض التفاصيل',
      manage: 'إدارة',
      
      // Services
      'instant-payments': 'المدفوعات الفورية',
      'instant-payments-desc': 'مدفوعات فورية عالمية',
      'secure-transactions': 'معاملات آمنة',
      'secure-transactions-desc': 'أمان المعاملات المصرفية',
      'mobile-wallet': 'المحفظة المحمولة',
      'mobile-wallet-desc': 'مدفوعات بدون تلامس باستخدام هاتفك',
      
      // Actions
      'hide-balances': 'إخفاء الأرصدة',
      'show-balances': 'إظهار الأرصدة',
      'lock-card': 'قفل البطاقة',
      'unlock-card': 'إلغاء قفل البطاقة',
      'mobile-pay': 'الدفع المحمول',
      'pay-bill': 'دفع الفاتورة',
      
      // Status
      'card-locked': 'البطاقة مقفلة',
      'card-unlocked': 'البطاقة مفتوحة',
      'card-locked-desc': 'تم قفل بطاقتك للأمان',
      'card-unlocked-desc': 'تم إلغاء قفل بطاقتك بنجاح',
      'lock-card-desc': 'أدخل رقمك السري لقفل هذه البطاقة',
      'unlock-card-desc': 'أدخل رقمك السري لإلغاء قفل هذه البطاقة',
      
      // Personal Banking
      'personal-banking': 'الخدمات المصرفية الشخصية',
      'investment-services': 'خدمات الاستثمار',
      copyright: 'حقوق الطبع والنشر',
      'terms-of-service': 'شروط الخدمة',
      
      // Verification
      'phone-verification': 'التحقق من الهاتف',
      'verify-mobile-number': 'تحقق من رقم هاتفك المحمول للتواصل الآمن',
      'address-verification': 'التحقق من العنوان',
      'proof-of-residence-verification': 'التحقق من إثبات الإقامة لمتطلبات الامتثال',
      'income-verification': 'التحقق من الدخل',
      'employment-and-income-proof': 'إثبات العمل والدخل لتحديد حدود الحساب',
      'enhanced-due-diligence': 'العناية الواجبة المعززة',
      'additional-verification-high-value': 'التحقق الإضافي للمعاملات عالية القيمة',
      'biometric-verification': 'التحقق البيومتري',
      'facial-recognition-fingerprint': 'التعرف على الوجه والتحقق من بصمة الإصبع',
      'tax-compliance': 'الامتثال الضريبي',
      'tax-residency-status': 'حالة الإقامة الضريبية والتحقق من الامتثال',
      
      // Account
      'account-security-level': 'مستوى أمان الحساب',
      'fully-verified': 'تم التحقق بالكامل',
      'total-verifications': 'إجمالي التحققات',
      verified: 'تم التحقق',
      pending: 'معلق',
      required: 'مطلوب',
      'action-required': 'إجراء مطلوب',
      'all-verifications': 'جميع التحققات',
      'submitted-documents': 'الوثائق المقدمة',
      'last-updated': 'آخر تحديث',
      'upload-documents': 'رفع الوثائق',
      'under-review': 'قيد المراجعة',
      'upload-verification-documents': 'رفع وثائق التحقق',
      'drag-drop-files-here': 'اسحب وأفلت الملفات هنا',
      'or-click-to-browse': 'أو انقر للتصفح',
      
      // PIN Management
      'change-pin': 'تغيير الرقم السري',
      'pin-too-short': 'يجب أن يكون الرقم السري 4 أرقام',
      'confirm-pin-change': 'تأكيد تغيير الرقم السري',
      'pin-change-confirmation-message': 'هل أنت متأكد من أنك تريد تغيير رقم التحويل السري الخاص بك؟',
      'confirm-change': 'تأكيد التغيير'
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

// Create context with safe defaults
const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: LANGUAGES[0],
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
    try {
      const savedLang = localStorage.getItem('selectedLanguage');
      if (savedLang) {
        const found = LANGUAGES.find(lang => lang.code === savedLang);
        return found || LANGUAGES[0];
      }
    } catch (error) {
      console.warn('Error loading saved language:', error);
    }
    return LANGUAGES[0];
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

  // Translation function with fallback
  const t = (key: string): string => {
    try {
      return currentLanguage?.translations?.[key] || key;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key;
    }
  };

  // Check if current language is RTL
  const isRTL = currentLanguage?.code === 'ar';

  // Set initial document direction
  useEffect(() => {
    try {
      if (currentLanguage?.code === 'ar') {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
      } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = currentLanguage?.code || 'en';
      }
    } catch (error) {
      console.warn('Error setting document direction:', error);
    }
  }, [currentLanguage]);

  // Context value
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
