export const uz = {
  app: {
    name: "Savdo Control",
    description: "TradeS uchun role-based admin va super admin paneli"
  },
  common: {
    close: "Yopish",
    cancel: "Bekor qilish",
    saveChanges: "O'zgarishlarni saqlash",
    create: "Yaratish",
    update: "Yangilash",
    edit: "Tahrirlash",
    delete: "O'chirish",
    view: "Ko'rish",
    search: "Qidirish",
    clearFilters: "Filtrlarni tozalash",
    applyFilter: "Filtrni qo'llash",
    exportCsv: "CSV export",
    exportLogs: "Loglarni export qilish",
    signOut: "Chiqish",
    language: "Til",
    actions: "Amallar",
    email: "Email",
    id: "ID",
    password: "Parol",
    status: "Holat",
    role: "Rol",
    name: "Nomi",
    type: "Turi",
    owner: "Egasi",
    phone: "Telefon",
    createdAt: "Yaratilgan",
    updatedAt: "Yangilangan",
    lastLogin: "Oxirgi kirish",
    lastActive: "Oxirgi faollik",
    createdBy: "Kim yaratgan",
    permissions: "Ruxsatlar",
    modules: "Modullar",
    notes: "Izohlar",
    backToLogin: "Login sahifasiga qaytish",
    forgot_password: "Parolni unutdingizmi?",
    dismiss: "Yopish",
    menu: "Menyu",
    all: "Barchasi",
    adminPanel: "Admin panel",
    live: "Jonli",
    from: "Dan:",
    to: "Gacha:",
    theme: "Mavzu",
    lightMode: "Light mode",
    darkMode: "Dark mode"
  },
  languages: {
    uz: "O'zbekcha",
    en: "English",
    ru: "Русский"
  },
  access: {
    full: "To'liq kirish",
    scoped: "Cheklangan kirish"
  },
  workspace: {
    superAdmin: "Super admin ish maydoni",
    admin: "Admin ish maydoni"
  },
  titles: {
    platformSuperAdmin: "Platforma super admini",
    operationsAdmin: "Operatsion admin"
  },
  time: {
    justNow: "Hozirgina",
    minutesAgo: "{count} daqiqa oldin",
    pendingInvite: "Taklif kutilmoqda",
    todayAt: "Bugun, {time}",
    never: "Hech qachon"
  },
  navigation: {
    menu: {
      dashboard: {
        label: "Dashboard",
        description: "Umumiy ko'rinish, statistika va tezkor actionlar"
      },
      users: {
        label: "Foydalanuvchilar",
        description: "User ro'yxati, filtrlar va moderatsiya"
      },
      admins: {
        label: "Adminlar",
        description: "Admin accountlari va yagona super admin nazorati"
      },
      roles: {
        label: "Rollar",
        description: "Rol kartalari va tayinlash qoidalari"
      },
      permissions: {
        label: "Ruxsatlar",
        description: "Modullar bo'yicha access matrix"
      },
      content: {
        label: "Kontent",
        description: "Kontent va ma'lumot boshqaruvi"
      },
      reports: {
        label: "Hisobotlar",
        description: "Operatsion va exportga tayyor hisobotlar"
      },
      auditLogs: {
        label: "Audit loglar",
        description: "Xavfsizlik va activity timeline"
      },
      settings: {
        label: "Sozlamalar",
        description: "Profil, tizim va xavfsizlik sozlamalari"
      },
      profile: {
        label: "Profil",
        description: "Akkaunt, sessiyalar va afzalliklar"
      }
    },
    pageMeta: {
      dashboard: {
        eyebrow: "Umumiy ko'rinish",
        description: "Tizim statistikasi, so'nggi faoliyatlar va tezkor actionlar."
      },
      users: {
        eyebrow: "Foydalanuvchi boshqaruvi",
        description: "Foydalanuvchilar ro'yxati, filterlar va moderation actionlari."
      },
      admins: {
        eyebrow: "Faqat super admin",
        description: "Admin accountlar, role assign va super admin qoidalari."
      },
      roles: {
        eyebrow: "Access dizayni",
        description: "Rollar, scope va biznes qoidalarini boshqarish."
      },
      permissions: {
        eyebrow: "Matrix",
        description: "Modullar bo'yicha access control va permission mapping."
      },
      content: {
        eyebrow: "Ma'lumot boshqaruvi",
        description: "Kontent jadvali, statuslar va bulk actionga tayyor UI."
      },
      reports: {
        eyebrow: "Analitika",
        description: "Metriclar, sana filtrlari va export workflow."
      },
      auditLogs: {
        eyebrow: "Xavfsizlik izi",
        description: "Kim nima o'zgartirgani va xavfsizlik faoliyati."
      },
      settings: {
        eyebrow: "Konfiguratsiya",
        description: "Profil, notification, security va system config."
      },
      profile: {
        eyebrow: "Sizning akkauntingiz",
        description: "Shaxsiy ma'lumotlar, sessionlar va xavfsizlik sozlamalari."
      },
      customers: {
        eyebrow: "Mijozlar",
        description: "Mijoz qidirish, sodiqlik va segmentatsiya."
      },
      orders: {
        eyebrow: "Buyurtmalar",
        description: "Buyurtma holati, yetkazib berish va qaytish."
      },
      products: {
        eyebrow: "Mahsulotlar",
        description: "Mahsulot katalogi, inventar nazorati va ommaviy boshqaruv."
      },
      login: {
        eyebrow: "Autentifikatsiya",
        description: "Admin yoki super admin sifatida tizimga kirish."
      },
      userDetail: {
        title: "Foydalanuvchi tafsiloti",
        eyebrow: "Foydalanuvchi boshqaruvi",
        description: "Foydalanuvchi profili, statusi va activity tarixi."
      },
      fallback: {
        title: "Admin",
        eyebrow: "Boshqaruv paneli",
        description: "Role-based boshqaruv workspace."
      }
    },
    breadcrumbs: {
      dashboard: "Dashboard",
      users: "Foydalanuvchilar",
      userDetail: "Foydalanuvchi tafsiloti"
    }
  },
  auth: {
    heroEyebrow: "TradeS boshqaruv markazi",
    heroTitle: "Admin va Super Admin panel starti tayyor.",
    heroDescription:
      "Hozircha demo auth ishlaydi. Keyin bu flow `POST /auth/login`, `POST /auth/refresh` va `GET /me` bilan ulanadi.",
    routeProtectionTitle: "Route himoyasi",
    routeProtectionDescription:
      "Private route va super admin only page guard ulangan.",
    roleMenuTitle: "Role-based menyu",
    roleMenuDescription: "Sidebar login qilingan role bo'yicha render bo'ladi.",
    singletonTitle: "Yagona super admin qoidasi",
    singletonDescription:
      "Ikkinchi super admin yaratish UI darajasida yopiq.",
    cardEyebrow: "Autentifikatsiya",
    signIn: "Kirish",
    signInDescription:
      "Email ichida `super` bo'lsa super admin, aks holda admin sifatida kiradi.",
    continue: "Davom etish",
    demoAdmin: "Demo admin",
    demoSuperAdmin: "Demo super admin",
    demoAccounts: "Demo akkauntlar",
    forgotPassword: "Parolni unutdingizmi",
    resetPassword: "Parolni tiklash",
    forgotPasswordEyebrow: "Parolni tiklash",
    forgotPasswordTitle: "Parolni unutdim",
    forgotPasswordDescription:
      "Email manzilingizni kiriting, parolni tiklash havolasini yuboramiz.",
    workEmail: "Email manzil",
    sendResetLink: "Tiklash havolasini yuborish",
    sending: "Yuborilmoqda...",
    checkYourEmail: "Emailni tekshiring",
    resetLinkSent: "Tiklash havolasi yuborildi:",
    resetLinkExpiry: "Havola 15 daqiqa ichida amal qiladi.",
    resetPasswordEyebrow: "Parol yangilash",
    resetPasswordTitle: "Parolni yangilash",
    resetPasswordDescription: "Yangi parolingizni kiriting.",
    newPassword: "Yangi parol",
    confirmPassword: "Parolni tasdiqlang",
    saveNewPassword: "Yangi parolni saqlash",
    saving: "Saqlanmoqda...",
    enterPassword: "Parolni kiriting",
    enterNewPassword: "Yangi parolni kiriting",
    repeatPassword: "Parolni qayta kiriting",
    passwordUpdated: "Parol muvaffaqiyatli yangilandi!",
    redirectingToLogin: "Login sahifasiga yo'naltirilmoqda...",
    invalidResetLink: "Havola yaroqsiz",
    invalidResetLinkDesc: "Tiklash havolasi noto'g'ri yoki muddati tugagan.",
    requestNewLink: "Yangi havola so'rash",
    emailRequired: "Email manzilini kiriting",
    somethingWentWrong: "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
    passwordMin: "Kamida 8 ta belgi",
    passwordUppercase: "Kamida 1 ta katta harf (A-Z)",
    passwordLowercase: "Kamida 1 ta kichik harf (a-z)",
    passwordNumber: "Kamida 1 ta raqam (0-9)",
    passwordMismatch: "Parollar mos kelmaydi",
  },
  dashboard: {
    pageTitle: "Dashboard",
    heroEyebrow: "MVP start",
    superAdminTitle: "Super Admin nazorat markazi",
    adminTitle: "Admin operatsion maydoni",
    heroDescription:
      "Dashboard endi lokal state bilan jonlandi: users, admins, audit va notifications ko'rsatkichlari CRUD actionlardan keyin yangilanadi.",
    pillCrud: "CRUD tayyor",
    pillAudit: "Audit logging",
    pillToast: "Toast feedback",
    pillRoleAware: "Role-aware route'lar",
    stats: {
      totalUsers: "Jami foydalanuvchilar",
      admins: "Adminlar",
      auditLogs: "Audit loglar",
      notifications: "Bildirishnomalar",
      activeCount: "{count} ta faol",
      liveTrail: "Jonli activity trail",
      actionableItems: "Bajarilishi kerak bo'lgan itemlar"
    },
    recentActivity: "So'nggi faoliyat",
    recentActivityEntries: {
      adminRightsGranted: "Admin huquqi berildi",
      adminRightsGrantedDetail: "Madina Ergasheva ga admin qo'shildi",
      userBlocked: "Foydalanuvchi bloklandi",
      userBlockedDetail: "USR-1030 bloklandi",
      contentPublished: "Kontent nashr etildi",
      contentPublishedDetail: "Bahor aksiyasi landing page"
    },
    notificationFeed: {
      newUsers: "Yangi foydalanuvchilar",
      newUsersDetail: "Bu hafta 12 ta yangi registratsiya",
      blockedAccounts: "Bloklangan akkauntlar",
      blockedAccountsDetail: "3 ta akkaunt faol emas",
      reportReady: "Hisobot tayyor",
      reportReadyDetail: "Oylik hisobot yuklab olishga tayyor"
    },
    liveStructure: "Jonli struktura",
    notificationsTitle: "Bildirishnomalar",
    priorityFeed: "Ustuvor feed",
    checkpoints: "Implementatsiya checkpointlari",
    planAlignment: "Plan bilan moslik"
  },
  users: {
    pageTitle: "Foydalanuvchilar",
    title: "Foydalanuvchi boshqaruvi",
    description:
      "Search, filter, create, edit, block va delete actionlar lokal store bilan ishlaydi.",
    createUser: "Foydalanuvchi yaratish",
    searchPlaceholder: "Ism, email yoki telefon bo'yicha qidiring",
    allRoles: "Barcha rollar",
    allStatuses: "Barcha holatlar",
    tableUser: "Foydalanuvchi",
    tableRole: "Rol",
    tableStatus: "Holat",
    tableCreated: "Yaratilgan",
    tableLastLogin: "Oxirgi kirish",
    noUsers: "Foydalanuvchilar topilmadi",
    noUsersDescription:
      "Filtrlarni o'zgartirib ko'ring yoki yangi user yarating.",
    editUser: "Userni tahrirlash",
    createUserModal: "User yaratish",
    userFormDescription:
      "User form MVP. Backend kelganda schema validation va API mutationga ulanadi.",
    fullName: "To'liq ism",
    deleteUser: "Userni o'chirish",
    deleteUserDescription:
      "Bu action audit logga yoziladi va lokal jadvaldan user olib tashlanadi.",
    deleteUserConfirm: "{name} foydalanuvchisini o'chirishni tasdiqlang.",
    saveChanges: "O'zgarishlarni saqlash",
    block: "Bloklash",
    unblock: "Blokdan chiqarish",
    userNotFound: "Foydalanuvchi topilmadi",
    userNotFoundDescription: "Bu demo dataset ichida `{id}` topilmadi.",
    backToUsers: "Foydalanuvchilarga qaytish",
    notesReady:
      "Reset-password va activity-history integratsiyasi uchun tayyor.",
    activityHistory: "Faoliyat tarixi",
    plannedDetailBlock: "Rejalashtirilgan detail blok",
    passwordResetPrepared: "Parolni tiklash tayyor",
    passwordResetPreparedDescription:
      "UI action `POST /users/:id/reset-password` ga ulanadi.",
    roleAssignmentVisible: "Role assignment ko'rinadigan",
    roleAssignmentVisibleDescription:
      "Route role history va audit integratsiyasi uchun tayyor."
  },
  admins: {
    pageTitle: "Adminlar",
    title: "Admin boshqaruvi",
    description:
      "Faqat super admin ko'radi. Create, edit va suspend actionlari ishlaydi.",
    createAdmin: "Admin yaratish",
    singletonTitle: "Yagona qoidasi",
    singletonDescription:
      "`super_admin` tanlash bloklangan. Demo ham, backend ham ikkinchi super adminni rad etishi kerak.",
    adminColumn: "Admin",
    editAdmin: "Adminni tahrirlash",
    createAdminModal: "Admin yaratish",
    modalDescription:
      "Bu forma admin accountlar va scoped role assignment uchun ishlaydi.",
    permissionsSummary: "Ruxsatlar qisqacha",
    activate: "Faollashtirish",
    suspend: "To'xtatish"
  },
  roles: {
    pageTitle: "Rollar",
    title: "Rollar",
    description:
      "Role cards, scope va business rule bloklari interaktiv create flow bilan kengaytirildi.",
    createRole: "Rol yaratish",
    createRoleDescription: "Custom role yaratish uchun minimal forma.",
    roleName: "Rol nomi",
    scope: "Qamrov",
    note: "Izoh",
    members: "{count} a'zo"
  },
  permissions: {
    pageTitle: "Ruxsatlar",
    title: "Permission matrix",
    description:
      "Checkbox matrix lokal state bilan ishlaydi. `Save changes` audit logga yoziladi."
  },
  content: {
    pageTitle: "Kontent",
    title: "Kontent va ma'lumot boshqaruvi",
    description:
      "Create content, status change va audit log integration ishlaydi.",
    createContent: "Kontent yaratish",
    publish: "Nashr qilish",
    archive: "Arxivlash",
    noContent: "Kontent yo'q",
    createContentDescription:
      "Rich text editor va media upload keyingi bosqichga qoldirilgan."
  },
  reports: {
    pageTitle: "Hisobotlar",
    title: "Hisobotlar",
    description:
      "Date range, metrics va export actionlari uchun ishchi skelet.",
    overview: "Umumiy ko'rinish",
    adminActivity: "Admin faolligi",
    security: "Xavfsizlik",
    chartPlaceholder: "Grafik ko'rinishi",
    chartPlaceholderDescription: "Backend ulangandan so'ng ko'rsatiladi"
  },
  audit: {
    pageTitle: "Audit loglar",
    title: "Audit loglar",
    description:
      "Action history, filterlar va CRUD eventlardan to'ladigan live list view.",
    searchPlaceholder: "Actor yoki entity bo'yicha qidiring",
    allActions: "Barcha actionlar",
    permissionChanges: "Permission o'zgarishlari",
    userActions: "User actionlari",
    adminActions: "Admin actionlari",
    contentActions: "Kontent actionlari",
    settingsActions: "Sozlamalar",
    authActions: "Autentifikatsiya",
    noAudit: "Audit log topilmadi",
    noAuditDescription: "Search yoki action filterini o'zgartiring.",
    action: "Action",
    actor: "Actor",
    target: "Target",
    ipAddress: "IP manzil",
    timestamp: "Vaqt"
  },
  settings: {
    pageTitle: "Sozlamalar",
    tabsTitle: "Sozlamalar tablari",
    description:
      "Profile, notifications, security va system config bloklari shu sahifada yig'ildi.",
    profileSettings: "Profil sozlamalari",
    notificationSettings: "Bildirishnoma sozlamalari",
    securitySettings: "Xavfsizlik sozlamalari",
    systemSettings: "Tizim sozlamalari",
    displayName: "Ko'rsatiladigan ism",
    sessionTimeout: "Sessiya timeout",
    securityNote: "Xavfsizlik eslatmasi",
    languagePreference: "Til afzalligi",
    themePreference: "Mavzu afzalligi",
    systemReadiness: "Tizim tayyorgarligi",
    superAdminScope: "Super admin qamrovi",
    adminScope: "Admin qamrovi",
    authFlow: "Auth flow",
    authFlowDescription:
      "Refresh token, unauthorized redirect va logout fallback keyingi bosqichga tayyor.",
    featureFlags: "Feature flaglar",
    featureFlagsDescription:
      "Reports beta, 2FA required va advanced permissions uchun joy qoldirilgan.",
    auditReadiness: "Audit tayyorgarligi",
    auditReadinessDescription:
      "Sensitive setting save actionlari audit-log eventlarga ulanadi.",
    noteDefault:
      "Unsaved changes modal, 2FA setup va recent sessions shu joyga ulanadi."
  },
  profile: {
    pageTitle: "Profil",
    permissionsConnected: "{count} ta permission ulangan",
    architectureReady: "Arxitektura tayyor",
    recentAuditEntries: "So'nggi audit yozuvlari",
    visibleInPanel: "Panelda {count} tasi ko'rinadi",
    modules: "Profil modullari",
    plannedSections: "Rejalashtirilgan bo'limlar",
    twoFa: "2FA"
  },
  notFound: {
    pageTitle: "Topilmadi",
    title: "Sahifa topilmadi",
    description: "Bu route topilmadi. Dashboardga qaytib davom eting.",
    openDashboard: "Dashboardni ochish"
  },
  labels: {
    roles: {
      super_admin: "Super admin",
      admin: "Admin",
      support: "Support",
      viewer: "Viewer",
      editor: "Editor",
      manager: "Manager",
      customer_support: "Customer support"
    },
    statuses: {
      active: "Faol",
      pending: "Kutilmoqda",
      blocked: "Bloklangan",
      invited: "Taklif yuborilgan",
      suspended: "To'xtatilgan",
      published: "Nashr qilingan",
      draft: "Qoralama",
      archived: "Arxivlangan"
    },
    modules: {
      dashboard: "Dashboard",
      users: "Foydalanuvchilar",
      admins: "Adminlar",
      roles: "Rollar",
      permissions: "Ruxsatlar",
      content: "Kontent",
      reports: "Hisobotlar",
      audit_logs: "Audit loglar",
      settings: "Sozlamalar"
    },
    actions: {
      view: "Ko'rish",
      create: "Yaratish",
      update: "Yangilash",
      delete: "O'chirish",
      export: "Export",
      manage: "Boshqarish"
    },
    priorities: {
      low: "Past",
      medium: "O'rta",
      high: "Yuqori"
    },
    contentTypes: {
      landing_page: "Landing page",
      knowledge_base: "Bilim bazasi",
      media_asset: "Media asset"
    },
    permissionSummaries: {
      full_access: "To'liq kirish",
      scoped_access: "Cheklangan modul kirishi",
      users_content_reports: "Userlar, kontent, hisobotlar",
      users_view_reports_view: "Userlarni ko'rish, hisobotlarni ko'rish"
    },
    createdBy: {
      system: "Tizim bootstrap"
    }
  },
  seeds: {
    dashboardHighlights: {
      permissionRollout: {
        title: "Permission rollout",
        description:
          "Role matrix modul darajasidagi access check va yagona super admin validatsiyasi uchun tayyor."
      },
      apiReadiness: {
        title: "API tayyorgarligi",
        description:
          "Auth, users, admins, roles, permissions, reports, settings va audit-log endpointlari rejalashtirilgan."
      },
      mvpScope: {
        title: "MVP qamrovi",
        description:
          "Login, dashboard, users, admins, roles, permissions va settings birinchi reliz uchun ustuvor."
      }
    },
    activities: {
      adminRoleUpdated: {
        title: "Admin roli yangilandi",
        detail: "Viewer roli {name} uchun Supportga ko'tarildi"
      },
      userBlocked: {
        title: "User bloklandi",
        detail: "Qayta-qayta muvaffaqiyatsiz login urinishlari qo'lda bloklashga olib keldi"
      },
      reportExported: {
        title: "Hisobot export qilindi",
        detail: "Oylik admin activity report CSV ko'rinishida export qilindi"
      },
      genericUpdatedBy: {
        detail: "{target} {actor} tomonidan yangilandi"
      }
    },
    notifications: {
      twoFaPending: {
        title: "2FA tayyorgarligi kutilyapti",
        detail: "UI arxitekturasi tayyor, backend talabi hali ochiq."
      },
      singleton: {
        title: "Yagona super admin",
        detail: "Ikkinchi super admin yaratish UI darajasida yopiq va API ham buni validatsiya qilishi kerak."
      },
      auditExport: {
        title: "Audit export",
        detail: "Export tugmasi `reports.export` ruxsatisiz foydalanuvchilardan yashirin qolishi kerak."
      }
    },
    roles: {
      super_admin: {
        scope: "Barcha modullar",
        note: "Singleton rol. Create-admin forma orqali berilmaydi."
      },
      admin: {
        scope: "Userlar, kontent, hisobotlar, sozlamalar",
        note: "Platforma boshqaruvi uchun asosiy operatsion rol."
      },
      editor: {
        scope: "Kontent yaratish va yangilash",
        note: "Admin management yoki permissionlarga kirishi yo'q."
      },
      viewer: {
        scope: "Faqat ko'rish huquqi",
        note: "Auditor va observerlar uchun mos."
      }
    },
    content: {
      springCampaign: "Bahor kampaniyasi landing sahifasi",
      deliveryFaq: "Yetkazib berish FAQ",
      promoBanners: "Promo banner to'plami"
    },
    reports: {
      dailyActiveUsers: {
        title: "Kunlik faol foydalanuvchilar",
        note: "Kechagiga nisbatan 6.3% o'sdi"
      },
      weeklyRegistrations: {
        title: "Haftalik ro'yxatdan o'tishlar",
        note: "So'nggi 7 kun davomida barqaror"
      },
      failedLogins: {
        title: "Muvaffaqiyatsiz loginlar",
        note: "2 ta holat qo'lda tekshiruv talab qiladi"
      }
    },
    auditActions: {
      permissionChanged: "Permission o'zgartirildi",
      userBlocked: "User bloklandi",
      loginFailed: "Login muvaffaqiyatsiz",
      userCreated: "User yaratildi",
      userUpdated: "User yangilandi",
      userUnblocked: "User blokdan chiqarildi",
      userDeleted: "User o'chirildi",
      adminCreated: "Admin yaratildi",
      adminUpdated: "Admin yangilandi",
      adminStatusChanged: "Admin statusi o'zgardi",
      roleCreated: "Rol yaratildi",
      permissionsSaved: "Permission matrix saqlandi",
      contentCreated: "Kontent yaratildi",
      contentStatusChanged: "Kontent statusi o'zgardi",
      settingsUpdated: "Sozlamalar yangilandi"
    },
    profileSections: {
      personalInfo: {
        title: "Shaxsiy ma'lumot",
        items: ["Ism va email", "Avatarni yangilash", "Til afzalligi"]
      },
      security: {
        title: "Xavfsizlik",
        items: ["Parol rotatsiyasi", "So'nggi sessiyalar", "2FA tayyorgarligi"]
      },
      preferences: {
        title: "Afzalliklar",
        items: ["Sidebar holati", "Bildirishnoma kanallari", "Default report oralig'i"]
      }
    }
  },
  toast: {
    userCreated: "User yaratildi: {name}",
    userUpdated: "User yangilandi",
    userDeleted: "User o'chirildi: {name}",
    userStatus: "User holati: {status}",
    onlyOneSuperAdmin: "Faqat bitta super admin bo'lishi mumkin",
    adminCreated: "Admin yaratildi: {name}",
    adminUpdated: "Admin yangilandi",
    adminStatus: "Admin holati: {status}",
    superAdminTransferDisabled:
      "Bu demo ichida super admin rolini ko'chirish o'chirilgan",
    roleCreated: "Rol yaratildi: {name}",
    permissionsSaved: "Ruxsatlar saqlandi",
    contentCreated: "Kontent yaratildi: {name}",
    contentStatusUpdated: "Kontent holati yangilandi: {status}",
    settingsSaved: "{section} saqlandi"
  }
};
