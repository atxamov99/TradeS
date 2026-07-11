export const ru = {
  app: {
    name: "TradeS Control",
    description: "Ролевая админ-панель и панель супер-админа для TradeS"
  },
  common: {
    close: "Закрыть",
    cancel: "Отмена",
    saveChanges: "Сохранить изменения",
    create: "Создать",
    update: "Обновить",
    edit: "Редактировать",
    delete: "Удалить",
    view: "Открыть",
    search: "Поиск",
    clearFilters: "Сбросить фильтры",
    applyFilter: "Применить фильтр",
    exportCsv: "Экспорт CSV",
    exportLogs: "Экспорт логов",
    signOut: "Выйти",
    language: "Язык",
    actions: "Действия",
    email: "Email",
    password: "Пароль",
    status: "Статус",
    role: "Роль",
    name: "Название",
    type: "Тип",
    owner: "Владелец",
    phone: "Телефон",
    createdAt: "Создано",
    updatedAt: "Обновлено",
    lastLogin: "Последний вход",
    lastActive: "Последняя активность",
    createdBy: "Кем создано",
    permissions: "Права",
    modules: "Модули",
    notes: "Примечания",
    backToLogin: "Назад к логину",
    forgot_password: "Забыли пароль?",
    dismiss: "Закрыть",
    menu: "Меню",
    all: "Все",
    adminPanel: "Панель администратора",
    live: "Онлайн",
    theme: "Тема",
    lightMode: "Светлая тема",
    darkMode: "Темная тема"
  },
  languages: {
    uz: "Узбекский",
    en: "Английский",
    ru: "Русский"
  },
  access: {
    full: "Полный доступ",
    scoped: "Ограниченный доступ"
  },
  workspace: {
    superAdmin: "Рабочая зона супер-админа",
    admin: "Рабочая зона админа"
  },
  titles: {
    platformSuperAdmin: "Супер-админ платформы",
    operationsAdmin: "Операционный админ"
  },
  time: {
    justNow: "Только что",
    minutesAgo: "{count} мин назад",
    pendingInvite: "Ожидает приглашения",
    todayAt: "Сегодня, {time}",
    never: "Никогда"
  },
  navigation: {
    menu: {
      dashboard: {
        label: "Дашборд",
        description: "Обзор, статистика и быстрые действия"
      },
      users: {
        label: "Пользователи",
        description: "Список пользователей, фильтры и модерация"
      },
      admins: {
        label: "Админы",
        description: "Аккаунты админов и контроль единственного супер-админа"
      },
      roles: {
        label: "Роли",
        description: "Карточки ролей и правила назначения"
      },
      permissions: {
        label: "Права",
        description: "Матрица доступа по модулям"
      },
      content: {
        label: "Контент",
        description: "Управление контентом и данными"
      },
      reports: {
        label: "Отчеты",
        description: "Операционные отчеты и экспорт"
      },
      auditLogs: {
        label: "Аудит-логи",
        description: "Лента безопасности и активности"
      },
      settings: {
        label: "Настройки",
        description: "Профиль, система и настройки безопасности"
      },
      profile: {
        label: "Профиль",
        description: "Ваш аккаунт, сессии и предпочтения"
      }
    },
    pageMeta: {
      dashboard: {
        eyebrow: "Обзор",
        description: "Статистика системы, недавняя активность и быстрые действия."
      },
      users: {
        eyebrow: "Управление пользователями",
        description: "Список пользователей, фильтры и действия модерации."
      },
      admins: {
        eyebrow: "Только для супер-админа",
        description: "Аккаунты админов, назначение ролей и правила единственного супер-админа."
      },
      roles: {
        eyebrow: "Дизайн доступа",
        description: "Управление ролями, scope и бизнес-правилами."
      },
      permissions: {
        eyebrow: "Матрица",
        description: "Контроль доступа по модулям и привязка permissions."
      },
      content: {
        eyebrow: "Управление данными",
        description: "Таблица контента, статусы и UI для bulk-действий."
      },
      reports: {
        eyebrow: "Аналитика",
        description: "Метрики, фильтры по датам и workflow экспорта."
      },
      auditLogs: {
        eyebrow: "След безопасности",
        description: "Кто что изменил и свежая активность по безопасности."
      },
      settings: {
        eyebrow: "Конфигурация",
        description: "Профиль, уведомления, безопасность и системный конфиг."
      },
      profile: {
        eyebrow: "Ваш аккаунт",
        description: "Личные данные, сессии и настройки безопасности."
      },
      customers: {
        eyebrow: "Пользователи",
        description: "Поиск клиентов, статус лояльности и сегментация."
      },
      orders: {
        eyebrow: "Заказы",
        description: "Статус заказов, доставка и возвраты."
      },
      products: {
        eyebrow: "Товары",
        description: "Каталог, управление запасами и массовые операции."
      },
      login: {
        eyebrow: "Аутентификация",
        description: "Вход как админ или супер-админ."
      },
      userDetail: {
        title: "Детали пользователя",
        eyebrow: "Управление пользователями",
        description: "Профиль пользователя, статус и история активности."
      },
      fallback: {
        title: "Админ",
        eyebrow: "Панель управления",
        description: "Рабочее пространство с role-based управлением."
      }
    },
    breadcrumbs: {
      dashboard: "Дашборд",
      users: "Пользователи",
      userDetail: "Детали пользователя"
    }
  },
  auth: {
    heroEyebrow: "Центр управления TradeS",
    heroTitle: "Старт админ-панели и панели супер-админа готов.",
    heroDescription:
      "Сейчас работает demo auth. Позже этот flow подключится к `POST /auth/login`, `POST /auth/refresh` и `GET /me`.",
    routeProtectionTitle: "Защита маршрутов",
    routeProtectionDescription:
      "Подключены private route и guard для страниц только супер-админа.",
    roleMenuTitle: "Меню по ролям",
    roleMenuDescription:
      "Sidebar рендерится в зависимости от роли после входа.",
    singletonTitle: "Правило singleton",
    singletonDescription:
      "Создание второго супер-админа заблокировано на уровне UI.",
    cardEyebrow: "Аутентификация",
    signIn: "Войти",
    signInDescription:
      "Если email содержит `super`, вход выполняется как супер-админ, иначе как админ.",
    continue: "Продолжить",
    demoAdmin: "Демо админ",
    demoSuperAdmin: "Демо супер-админ",
    demoAccounts: "Демо аккаунты",
    forgotPassword: "Забыли пароль",
    resetPassword: "Сброс пароля",
    forgotPasswordEyebrow: "Восстановление пароля",
    forgotPasswordTitle: "Забыли пароль",
    forgotPasswordDescription:
      "Введите ваш email, мы отправим ссылку для восстановления пароля.",
    workEmail: "Email адрес",
    sendResetLink: "Отправить ссылку для сброса",
    sending: "Отправляется...",
    checkYourEmail: "Проверьте почту",
    resetLinkSent: "Ссылка для сброса отправлена на:",
    resetLinkExpiry: "Ссылка действительна 15 минут.",
    resetPasswordEyebrow: "Сброс пароля",
    resetPasswordTitle: "Обновить пароль",
    resetPasswordDescription: "Введите новый пароль.",
    newPassword: "Новый пароль",
    confirmPassword: "Подтвердите пароль",
    saveNewPassword: "Сохранить новый пароль",
    saving: "Сохраняется...",
    enterPassword: "Введите пароль",
    enterNewPassword: "Введите новый пароль",
    repeatPassword: "Повторите пароль",
    passwordUpdated: "Пароль успешно обновлён!",
    redirectingToLogin: "Перенаправление на страницу входа...",
    invalidResetLink: "Ссылка недействительна",
    invalidResetLinkDesc: "Ссылка для сброса пароля недействительна или срок её действия истёк.",
    requestNewLink: "Запросить новую ссылку",
    emailRequired: "Введите email адрес",
    somethingWentWrong: "Что-то пошло не так. Попробуйте снова.",
    passwordMin: "Минимум 8 символов",
    passwordUppercase: "Минимум 1 заглавная буква (A-Z)",
    passwordLowercase: "Минимум 1 строчная буква (a-z)",
    passwordNumber: "Минимум 1 цифра (0-9)",
    passwordMismatch: "Пароли не совпадают",
  },
  dashboard: {
    pageTitle: "Дашборд",
    heroEyebrow: "Старт MVP",
    superAdminTitle: "Центр управления Super Admin",
    adminTitle: "Операционная зона админа",
    heroDescription:
      "Дашборд теперь работает на local state: users, admins, audit и notifications обновляются после CRUD-действий.",
    pillCrud: "CRUD готов",
    pillAudit: "Audit logging",
    pillToast: "Toast feedback",
    pillRoleAware: "Маршруты с учетом роли",
    stats: {
      totalUsers: "Всего пользователей",
      admins: "Админы",
      auditLogs: "Аудит-логи",
      notifications: "Уведомления",
      activeCount: "Активных: {count}",
      liveTrail: "Живая лента активности",
      actionableItems: "Требуют действия"
    },
    recentActivity: "Недавняя активность",
    recentActivityEntries: {
      adminRightsGranted: "Предоставлены права администратора",
      adminRightsGrantedDetail: "Мадина Эргашева назначена администратором",
      userBlocked: "Пользователь заблокирован",
      userBlockedDetail: "USR-1030 заблокирован",
      contentPublished: "Контент опубликован",
      contentPublishedDetail: "Лендинговая страница весенней кампании"
    },
    notificationFeed: {
      newUsers: "Новые пользователи",
      newUsersDetail: "12 новых регистраций на этой неделе",
      blockedAccounts: "Заблокированные аккаунты",
      blockedAccountsDetail: "3 аккаунта сейчас неактивны",
      reportReady: "Отчет готов",
      reportReadyDetail: "Месячный отчет готов к загрузке"
    },
    liveStructure: "Живая структура",
    notificationsTitle: "Уведомления",
    priorityFeed: "Лента приоритетов",
    checkpoints: "Контрольные точки реализации",
    planAlignment: "Соответствие плану"
  },
  users: {
    pageTitle: "Пользователи",
    title: "Управление пользователями",
    description:
      "Поиск, фильтрация, создание, редактирование, блокировка и удаление работают через local store.",
    createUser: "Создать пользователя",
    searchPlaceholder: "Поиск по имени, email или телефону",
    allRoles: "Все роли",
    allStatuses: "Все статусы",
    tableUser: "Пользователь",
    tableRole: "Роль",
    tableStatus: "Статус",
    tableCreated: "Создан",
    tableLastLogin: "Последний вход",
    noUsers: "Пользователи не найдены",
    noUsersDescription:
      "Попробуйте изменить фильтры или создать нового пользователя.",
    editUser: "Редактировать пользователя",
    createUserModal: "Создать пользователя",
    userFormDescription:
      "MVP-форма пользователя. Когда появится backend, подключите schema validation и API mutations.",
    fullName: "Полное имя",
    deleteUser: "Удалить пользователя",
    deleteUserDescription:
      "Это действие записывается в audit log и удаляет пользователя из локальной таблицы.",
    deleteUserConfirm: "Подтвердите удаление пользователя {name}.",
    saveChanges: "Сохранить изменения",
    block: "Заблокировать",
    unblock: "Разблокировать",
    userNotFound: "Пользователь не найден",
    userNotFoundDescription: "`{id}` не найден в этом demo dataset.",
    backToUsers: "Назад к пользователям",
    notesReady:
      "Готово для интеграции reset-password и истории активности.",
    activityHistory: "История активности",
    plannedDetailBlock: "Запланированный блок деталей",
    passwordResetPrepared: "Сброс пароля подготовлен",
    passwordResetPreparedDescription:
      "Это UI-действие может быть связано с `POST /users/:id/reset-password`.",
    roleAssignmentVisible: "Назначение роли видно",
    roleAssignmentVisibleDescription:
      "Маршрут готов для истории ролей и интеграции аудита."
  },
  admins: {
    pageTitle: "Админы",
    title: "Управление админами",
    description:
      "Доступно только супер-админу. Активны действия create, edit и suspend.",
    createAdmin: "Создать админа",
    singletonTitle: "Правило singleton",
    singletonDescription:
      "Выбор `super_admin` заблокирован. И demo, и backend должны отклонять второго супер-админа.",
    adminColumn: "Админ",
    editAdmin: "Редактировать админа",
    createAdminModal: "Создать админа",
    modalDescription:
      "Эта форма управляет аккаунтами админов и scoped role assignment.",
    permissionsSummary: "Сводка прав",
    activate: "Активировать",
    suspend: "Приостановить"
  },
  roles: {
    pageTitle: "Роли",
    title: "Роли",
    description:
      "Карточки ролей, scope и business rules расширены интерактивным create flow.",
    createRole: "Создать роль",
    createRoleDescription: "Минимальная форма для создания custom role.",
    roleName: "Название роли",
    scope: "Scope",
    note: "Примечание",
    members: "{count} участников"
  },
  permissions: {
    pageTitle: "Права",
    title: "Permission matrix",
    description:
      "Checkbox matrix работает на local state. `Save changes` записывается в audit log."
  },
  content: {
    pageTitle: "Контент",
    title: "Управление контентом и данными",
    description:
      "Работают создание контента, смена статуса и интеграция с audit log.",
    createContent: "Создать контент",
    publish: "Опубликовать",
    archive: "В архив",
    createContentDescription:
      "Rich text editor и media upload перенесены на следующий этап."
  },
  reports: {
    pageTitle: "Отчеты",
    title: "Отчеты",
    description:
      "Рабочий скелет для диапазона дат, метрик и действий экспорта.",
    overview: "Обзор",
    adminActivity: "Активность админов",
    security: "Безопасность"
  },
  audit: {
    pageTitle: "Аудит-логи",
    title: "Аудит-логи",
    description:
      "Живой список, который наполняется историей действий, фильтрами и CRUD-событиями.",
    searchPlaceholder: "Поиск по actor или entity",
    allActions: "Все действия",
    permissionChanges: "Изменения прав",
    userActions: "Действия пользователей",
    adminActions: "Действия админов",
    contentActions: "Действия с контентом",
    settingsActions: "Настройки",
    authActions: "Аутентификация",
    noAudit: "Аудит-лог не найден",
    noAuditDescription: "Попробуйте изменить поиск или фильтр действий.",
    action: "Действие",
    actor: "Actor",
    target: "Target",
    ipAddress: "IP адрес",
    timestamp: "Время"
  },
  settings: {
    pageTitle: "Настройки",
    tabsTitle: "Вкладки настроек",
    description:
      "Блоки profile, notifications, security и system config собраны на этой странице.",
    profileSettings: "Настройки профиля",
    notificationSettings: "Настройки уведомлений",
    securitySettings: "Настройки безопасности",
    systemSettings: "Системные настройки",
    displayName: "Отображаемое имя",
    sessionTimeout: "Таймаут сессии",
    securityNote: "Заметка по безопасности",
    languagePreference: "Предпочитаемый язык",
    themePreference: "Предпочтение темы",
    systemReadiness: "Готовность системы",
    superAdminScope: "Область супер-админа",
    adminScope: "Область админа",
    authFlow: "Auth flow",
    authFlowDescription:
      "Refresh token, unauthorized redirect и logout fallback готовы для следующего этапа.",
    featureFlags: "Feature flags",
    featureFlagsDescription:
      "Оставлено место для reports beta, 2FA required и advanced permissions.",
    auditReadiness: "Готовность аудита",
    auditReadinessDescription:
      "Сохранение чувствительных настроек подключается к audit-log событиям.",
    noteDefault:
      "Сюда можно подключить unsaved changes modal, 2FA setup и recent sessions."
  },
  profile: {
    pageTitle: "Профиль",
    permissionsConnected: "Подключено permissions: {count}",
    architectureReady: "Архитектура готова",
    recentAuditEntries: "Последние записи аудита",
    visibleInPanel: "В панели видно: {count}",
    modules: "Модули профиля",
    plannedSections: "Запланированные секции",
    twoFa: "2FA"
  },
  notFound: {
    pageTitle: "Не найдено",
    title: "Страница не найдена",
    description: "Этот маршрут не найден. Вернитесь в дашборд.",
    openDashboard: "Открыть дашборд"
  },
  labels: {
    roles: {
      super_admin: "Супер-админ",
      admin: "Админ",
      support: "Поддержка",
      viewer: "Наблюдатель",
      editor: "Редактор",
      manager: "Менеджер",
      customer_support: "Поддержка клиентов"
    },
    statuses: {
      active: "Активен",
      pending: "Ожидает",
      blocked: "Заблокирован",
      invited: "Приглашен",
      suspended: "Приостановлен",
      published: "Опубликован",
      draft: "Черновик",
      archived: "В архиве"
    },
    modules: {
      dashboard: "Дашборд",
      users: "Пользователи",
      admins: "Администраторы",
      roles: "Роли",
      permissions: "Права",
      content: "Контент",
      reports: "Отчёты",
      audit_logs: "Журнал действий",
      settings: "Настройки"
    },
    actions: {
      view: "Просмотр",
      create: "Создать",
      update: "Обновить",
      delete: "Удалить",
      export: "Экспорт",
      manage: "Управлять"
    },
    priorities: {
      low: "Низкий",
      medium: "Средний",
      high: "Высокий"
    },
    contentTypes: {
      landing_page: "Лендинг",
      knowledge_base: "База знаний",
      media_asset: "Медиафайл"
    },
    permissionSummaries: {
      full_access: "Полный доступ",
      scoped_access: "Ограниченный доступ к модулям",
      users_content_reports: "Пользователи, контент, отчеты",
      users_view_reports_view: "Просмотр пользователей, просмотр отчетов"
    },
    createdBy: {
      system: "Системный bootstrap"
    }
  },
  seeds: {
    dashboardHighlights: {
      permissionRollout: {
        title: "Permission rollout",
        description:
          "Role matrix готова для module-level access checks и валидации единственного супер-админа."
      },
      apiReadiness: {
        title: "Готовность API",
        description:
          "Планируются endpoint'ы для auth, users, admins, roles, permissions, reports, settings и audit-log."
      },
      mvpScope: {
        title: "Объем MVP",
        description:
          "Login, dashboard, users, admins, roles, permissions и settings приоритетны для первого релиза."
      }
    },
    activities: {
      adminRoleUpdated: {
        title: "Роль админа обновлена",
        detail: "Роль Viewer повышена до Support для {name}"
      },
      userBlocked: {
        title: "Пользователь заблокирован",
        detail: "Повторные неудачные попытки входа привели к ручной блокировке"
      },
      reportExported: {
        title: "Отчет экспортирован",
        detail: "Ежемесячный отчет по активности админов экспортирован в CSV"
      },
      genericUpdatedBy: {
        detail: "{target} обновлено пользователем {actor}"
      }
    },
    notifications: {
      twoFaPending: {
        title: "Подготовка 2FA ожидается",
        detail: "UI-архитектура готова, backend-требование пока открыто."
      },
      singleton: {
        title: "Единственный супер-админ",
        detail: "Создание второго супер-админа отключено в UI и также должно валидироваться API."
      },
      auditExport: {
        title: "Экспорт аудита",
        detail: "Кнопка экспорта должна быть скрыта для пользователей без права `reports.export`."
      }
    },
    roles: {
      super_admin: {
        scope: "Все модули",
        note: "Singleton role. Нельзя назначить из формы create-admin."
      },
      admin: {
        scope: "Пользователи, контент, отчеты, настройки",
        note: "Основная операционная роль для управления платформой."
      },
      editor: {
        scope: "Создание и обновление контента",
        note: "Нет доступа к управлению админами и permissions."
      },
      viewer: {
        scope: "Только чтение",
        note: "Подходит для аудиторов и наблюдателей."
      }
    },
    content: {
      springCampaign: "Лендинг весенней кампании",
      deliveryFaq: "FAQ по доставке",
      promoBanners: "Набор промо-баннеров"
    },
    reports: {
      dailyActiveUsers: {
        title: "Ежедневно активные пользователи",
        note: "На 6.3% выше, чем вчера"
      },
      weeklyRegistrations: {
        title: "Недельные регистрации",
        note: "Стабильно за последние 7 дней"
      },
      failedLogins: {
        title: "Неудачные входы",
        note: "2 случая требуют ручной проверки"
      }
    },
    auditActions: {
      permissionChanged: "Permission изменен",
      userBlocked: "Пользователь заблокирован",
      loginFailed: "Ошибка входа",
      userCreated: "Пользователь создан",
      userUpdated: "Пользователь обновлен",
      userUnblocked: "Пользователь разблокирован",
      userDeleted: "Пользователь удален",
      adminCreated: "Админ создан",
      adminUpdated: "Админ обновлен",
      adminStatusChanged: "Статус админа изменен",
      roleCreated: "Роль создана",
      permissionsSaved: "Permission matrix сохранена",
      contentCreated: "Контент создан",
      contentStatusChanged: "Статус контента изменен",
      settingsUpdated: "Настройки обновлены"
    },
    profileSections: {
      personalInfo: {
        title: "Личная информация",
        items: ["Имя и email", "Обновление аватара", "Предпочтение языка"]
      },
      security: {
        title: "Безопасность",
        items: ["Ротация пароля", "Последние сессии", "Готовность 2FA"]
      },
      preferences: {
        title: "Предпочтения",
        items: ["Состояние sidebar", "Каналы уведомлений", "Диапазон отчета по умолчанию"]
      }
    }
  },
  toast: {
    userCreated: "Пользователь создан: {name}",
    userUpdated: "Пользователь обновлен",
    userDeleted: "Пользователь удален: {name}",
    userStatus: "Статус пользователя: {status}",
    onlyOneSuperAdmin: "Разрешен только один супер-админ",
    adminCreated: "Админ создан: {name}",
    adminUpdated: "Админ обновлен",
    adminStatus: "Статус админа: {status}",
    superAdminTransferDisabled:
      "Передача роли супер-админа отключена в этом demo",
    roleCreated: "Роль создана: {name}",
    permissionsSaved: "Права сохранены",
    contentCreated: "Контент создан: {name}",
    contentStatusUpdated: "Статус контента обновлен: {status}",
    settingsSaved: "{section} сохранено"
  }
};
