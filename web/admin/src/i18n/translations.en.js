export const en = {
  app: {
    name: "TradeS",
    description: "Role-based admin and super admin panel for TradeS",
    sidebarTagline: "Trade management"
  },
  common: {
    close: "Close",
    cancel: "Cancel",
    saveChanges: "Save changes",
    create: "Create",
    update: "Update",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    search: "Search",
    clearFilters: "Clear filters",
    applyFilter: "Apply filter",
    exportCsv: "Export CSV",
    exportLogs: "Export logs",
    signOut: "Sign out",
    language: "Language",
    actions: "Actions",
    email: "Email",
    id: "ID",
    password: "Password",
    status: "Status",
    role: "Role",
    name: "Name",
    type: "Type",
    owner: "Owner",
    phone: "Phone",
    createdAt: "Created",
    updatedAt: "Updated",
    lastLogin: "Last login",
    lastActive: "Last active",
    createdBy: "Created by",
    permissions: "Permissions",
    modules: "Modules",
    notes: "Notes",
    backToLogin: "Back to login",
    dismiss: "Dismiss",
    menu: "Menu",
    all: "All",
    adminPanel: "Admin Panel",
    live: "Live",
    from: "From:",
    to: "To:",
    theme: "Theme",
    lightMode: "Light mode",
    darkMode: "Dark mode"
  },
  languages: {
    uz: "Uzbek",
    en: "English",
    ru: "Russian"
  },
  access: {
    full: "Full access",
    scoped: "Scoped access"
  },
  workspace: {
    superAdmin: "Super admin workspace",
    admin: "Admin workspace"
  },
  titles: {
    platformSuperAdmin: "Platform Super Admin",
    operationsAdmin: "Operations Admin"
  },
  time: {
    justNow: "Just now",
    minutesAgo: "{count} min ago",
    pendingInvite: "Pending invite",
    todayAt: "Today, {time}",
    never: "Never"
  },
  navigation: {
    menu: {
      dashboard: {
        label: "Dashboard",
        description: "Overview, stats and quick actions"
      },
      users: {
        label: "Users",
        description: "User list, filters and moderation"
      },
      admins: {
        label: "Admins",
        description: "Admin accounts and singleton super admin control"
      },
      roles: {
        label: "Roles",
        description: "Role cards and assignment rules"
      },
      permissions: {
        label: "Permissions",
        description: "Module access matrix"
      },
      orders: {
        label: "Orders",
        description: "Order status, delivery and returns"
      },
      products: {
        label: "Products",
        description: "Product catalog and inventory control"
      },
      content: {
        label: "Content",
        description: "Content and data management"
      },
      shops: {
        label: "Shops",
        description: "Shop list and blocking controls"
      },
      support: {
        label: "Support",
        description: "User support requests and replies"
      },
      notifications: {
        label: "Notifications",
        description: "System alerts and recent activity"
      },
      reports: {
        label: "Sales",
        description: "Operational and export-ready reports"
      },
      auditLogs: {
        label: "Audit Logs",
        description: "Security and activity timeline"
      },
      settings: {
        label: "Settings",
        description: "Profile, system and security settings"
      },
      profile: {
        label: "Profile",
        description: "Your account, sessions and preferences"
      }
    },
    pageMeta: {
      dashboard: {
        eyebrow: "Overview",
        description: "System stats, recent activity and quick actions."
      },
      users: {
        eyebrow: "User management",
        description: "User list, filters and moderation actions."
      },
      admins: {
        eyebrow: "Super admin only",
        description: "Admin accounts, role assignment and singleton super admin rules."
      },
      roles: {
        eyebrow: "Access design",
        description: "Manage roles, scopes and business rules."
      },
      permissions: {
        eyebrow: "Matrix",
        description: "Module-level access control and permission mapping."
      },
      content: {
        eyebrow: "Data management",
        description: "Content table, statuses and UI ready for bulk actions."
      },
      reports: {
        eyebrow: "Analytics",
        description: "Metrics, date filters and export workflow."
      },
      auditLogs: {
        eyebrow: "Security trail",
        description: "Who changed what and recent security activity."
      },
      settings: {
        eyebrow: "Configuration",
        description: "Profile, notifications, security and system config."
      },
      profile: {
        eyebrow: "Your account",
        description: "Personal info, sessions and security settings."
      },
      customers: {
        eyebrow: "Customers",
        description: "Customer search, loyalty status and segmentation." 
      },
      orders: {
        eyebrow: "Orders",
        description: "Order pipeline status, delivery updates and refunds." 
      },
      products: {
        eyebrow: "Products",
        description: "Product catalog, stock controls and bulk management." 
      },
      login: {
        eyebrow: "Authentication",
        description: "Sign in as admin or super admin."
      },
      userDetail: {
        title: "User Detail",
        eyebrow: "User management",
        description: "User profile, status and activity history."
      },
      fallback: {
        title: "Admin",
        eyebrow: "Control panel",
        description: "Role-based control workspace."
      }
    },
    breadcrumbs: {
      dashboard: "Dashboard",
      users: "Users",
      userDetail: "User Detail"
    }
  },
  auth: {
    heroEyebrow: "TradeS control room",
    heroTitle: "Admin and Super Admin panel starter is ready.",
    heroDescription:
      "Demo auth is active for now. Later this flow will connect to `POST /auth/login`, `POST /auth/refresh` and `GET /me`.",
    routeProtectionTitle: "Route protection",
    routeProtectionDescription:
      "Private routes and super-admin-only page guards are wired.",
    roleMenuTitle: "Role-based menu",
    roleMenuDescription: "The sidebar renders according to the signed-in role.",
    singletonTitle: "Singleton rule",
    singletonDescription:
      "Creating a second super admin is blocked at the UI level.",
    cardEyebrow: "Authentication",
    signIn: "Sign in",
    signInDescription:
      "If the email contains `super`, it signs in as super admin, otherwise as admin.",
    continue: "Continue",
    demoAdmin: "Demo Admin",
    demoSuperAdmin: "Demo Super Admin",
    demoAccounts: "Demo accounts",
    forgotPassword: "Forgot password",
    resetPassword: "Reset password",
    forgotPasswordEyebrow: "Password recovery",
    forgotPasswordTitle: "Forgot password",
    forgotPasswordDescription:
      "This page will later connect to `POST /auth/forgot-password`. For now, the email UI is ready.",
    workEmail: "Work email",
    sendResetLink: "Send reset link",
    resetPasswordEyebrow: "Password reset",
    resetPasswordTitle: "Reset password",
    resetPasswordDescription:
      "Placeholder page for token verification and password update flow.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    saveNewPassword: "Save new password",
    enterPassword: "Enter password",
    enterNewPassword: "Enter new password",
    repeatPassword: "Repeat password"
  },
  dashboard: {
    pageTitle: "Dashboard",
    heroEyebrow: "MVP kickoff",
    superAdminTitle: "Super Admin control center",
    adminTitle: "Admin operations workspace",
    heroDescription:
      "The dashboard is now powered by local state: users, admins, audit and notifications refresh after CRUD actions.",
    pillCrud: "CRUD ready",
    pillAudit: "Audit logging",
    pillToast: "Toast feedback",
    pillRoleAware: "Role-aware routes",
    stats: {
      totalUsers: "Total users",
      admins: "Admins",
      auditLogs: "Audit logs",
      notifications: "Notifications",
      activeCount: "{count} active",
      liveTrail: "Live activity trail",
      actionableItems: "Actionable items"
    },
    recentActivity: "Recent activity",
    recentActivityEntries: {
      adminRightsGranted: "Admin rights granted",
      adminRightsGrantedDetail: "Madina Ergasheva promoted to admin",
      userBlocked: "User blocked",
      userBlockedDetail: "USR-1030 blocked",
      contentPublished: "Content published",
      contentPublishedDetail: "Spring campaign landing page"
    },
    notificationFeed: {
      newUsers: "New users",
      newUsersDetail: "{count} new sign-ups this week",
      blockedAccounts: "Blocked accounts",
      blockedAccountsDetail: "{count} accounts currently inactive",
      newShops: "New shops",
      newShopsDetail: "{count} new shops this week",
      reportReady: "Report ready",
      reportReadyDetail: "Monthly report is ready for download"
    },
    liveStructure: "Live structure",
    notificationsTitle: "Notifications",
    priorityFeed: "Priority feed",
    checkpoints: "Implementation checkpoints",
    planAlignment: "Plan alignment",
    header: {
      title: "Dashboard",
      greeting: "Hello, {name} — today's overview and stats"
    },
    cards: {
      totalRevenue: "Total sales",
      totalOrders: "Orders",
      totalProducts: "Products",
      totalUsers: "Users"
    },
    lowStock: {
      title: "Low stock products",
      viewAll: "View all",
      empty: "No data",
      unit: "pcs",
      critical: "Urgent",
      warning: "Warning"
    },
    recentOrders: {
      title: "Recent orders",
      viewAll: "View all",
      unknownCustomer: "Unknown",
      empty: "No orders found",
      tableId: "#",
      tableCustomer: "Customer",
      tableDate: "Date",
      tableTotal: "Total",
      tableStatus: "Status"
    },
    orderStatus: {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled"
    }
  },
  users: {
    pageTitle: "Users",
    title: "User management",
    description:
      "Search, filter, create, edit, block and delete actions work through the local store.",
    createUser: "Create user",
    searchPlaceholder: "Search by name, email or phone",
    allRoles: "All roles",
    allStatuses: "All statuses",
    tableUser: "User",
    tableRole: "Role",
    tableStatus: "Status",
    tableCreated: "Created",
    tableLastLogin: "Last login",
    noUsers: "No users found",
    noUsersDescription: "Try adjusting filters or create a new user.",
    editUser: "Edit user",
    createUserModal: "Create user",
    userFormDescription:
      "User form MVP. Once the backend arrives, wire it to schema validation and API mutations.",
    fullName: "Full name",
    deleteUser: "Delete user",
    deleteUserDescription:
      "This action is written to the audit log and removes the user from the local table.",
    deleteUserConfirm: "Confirm deleting user {name}.",
    saveChanges: "Save changes",
    block: "Block",
    unblock: "Unblock",
    userNotFound: "User not found",
    userNotFoundDescription: "`{id}` was not found in this demo dataset.",
    backToUsers: "Back to users",
    notesReady: "Ready for reset-password and activity-history integration.",
    activityHistory: "Activity history",
    plannedDetailBlock: "Planned detail block",
    passwordResetPrepared: "Password reset prepared",
    passwordResetPreparedDescription:
      "This UI action can map to `POST /users/:id/reset-password`.",
    roleAssignmentVisible: "Role assignment visible",
    roleAssignmentVisibleDescription:
      "The route is ready for role history and audit integration.",
    listDescriptionUsers: "List of all users in the system and their permissions.",
    createUserButton: "New user",
    searchUsersPlaceholder: "Search users...",
    statusActive: "Active",
    statusPending: "Pending",
    statusBlocked: "Blocked",
    tablePhone: "Phone",
    tableRegistered: "Registered",
    tableActionsHeader: "Actions",
    noUsersFound: "No users found",
    viewTooltip: "View",
    editTooltip: "Edit",
    blockTooltip: "Block",
    unblockTooltip: "Unblock",
    makeAdminTooltip: "Make admin",
    deleteTooltip: "Delete",
    totalCount: "Total {count}",
    createModalTitleUser: "New user",
    editModalTitleUser: "Edit user",
    cancelButton: "Cancel",
    saveButton: "Save",
    createSubmitButton: "Create",
    fieldFullName: "Full name",
    fieldEmailOptional: "Email (optional)",
    fieldPhoneOptional: "Phone (optional)",
    fieldPasswordCreate: "Password *",
    fieldPasswordEdit: "Password (leave empty to keep unchanged)",
    contactRequiredNote: "* At least one of email or phone is required",
    statusFieldLabel: "Status",
    deleteModalTitleUser: "Delete user",
    deleteModalNoteUser: "This action cannot be undone. User history may be kept.",
    grantModalTitle: "Grant admin rights",
    revokeModalTitle: "Revoke admin rights",
    grantModalDescription: "This user will be granted admin rights and gain access to the admin panel.",
    revokeModalDescription: "This user's admin rights will be revoked and they will become a regular user.",
    grantConfirmButton: "Make admin",
    revokeConfirmButton: "Revoke admin"
  },
  admins: {
    pageTitle: "Admins",
    title: "Admin management",
    description:
      "Visible only to super admins. Create, edit and suspend actions are active.",
    createAdmin: "Create admin",
    singletonTitle: "Singleton rule",
    singletonDescription:
      "Selecting `super_admin` is blocked. Both the demo and the backend should reject a second super admin.",
    adminColumn: "Admin",
    editAdmin: "Edit admin",
    createAdminModal: "Create admin",
    modalDescription:
      "This form handles admin accounts and scoped role assignment.",
    permissionsSummary: "Permissions summary",
    activate: "Activate",
    suspend: "Suspend",
    listDescription: "List and management of system admins",
    searchPlaceholder: "Search admins...",
    tablePhone: "Phone",
    tableCreated: "Created",
    tableActions: "Actions",
    noAdminsFound: "No other admins yet",
    statusActive: "Active",
    statusBlocked: "Blocked",
    editTooltip: "Edit",
    activateTooltip: "Activate",
    blockTooltip: "Block",
    revokeTooltip: "Revoke admin"
  },
  roles: {
    pageTitle: "Roles",
    title: "Roles",
    description:
      "Role cards, scopes and business rules have been extended with an interactive create flow.",
    createRole: "Create role",
    createRoleDescription: "Minimal form for creating a custom role.",
    roleName: "Role name",
    scope: "Scope",
    note: "Note",
    members: "{count} members"
  },
  permissions: {
    pageTitle: "Permissions",
    title: "Permission matrix",
    description:
      "The checkbox matrix is backed by local state. `Save changes` is written to the audit log."
  },
  content: {
    pageTitle: "Content",
    title: "Content & data management",
    description:
      "Create content, status changes and audit log integration are active.",
    createContent: "Create content",
    publish: "Publish",
    archive: "Archive",
    noContent: "No content yet",
    createContentDescription:
      "Rich text editor and media upload are deferred to the next phase.",
    statusPublished: "Published",
    statusDraft: "Draft",
    statusArchived: "Archived",
    typeLanding: "Landing",
    typeKnowledgeBase: "Knowledge base",
    typeMedia: "Media",
    pageDescription: "Manage articles, pages and media resources for the platform",
    createButton: "New content",
    searchPlaceholder: "Search content...",
    allTypes: "All types",
    allStatuses: "All statuses",
    tableName: "Name",
    tableType: "Type",
    tableStatus: "Status",
    tableOwner: "Author",
    tableUpdated: "Updated",
    tableActions: "Actions",
    noContentFound: "No content found",
    deleteTooltip: "Delete",
    showingSummary: "Showing {count} of {total} results",
    publishedStatLabel: "Published",
    draftStatLabel: "Drafts",
    createModalTitle: "Create new content",
    cancelButton: "Cancel",
    savingButton: "Saving...",
    saveButton: "Save",
    nameFieldLabel: "Name",
    namePlaceholder: "E.g.: How to make a purchase?",
    typeFieldLabel: "Type",
    statusFieldLabel: "Status",
    bodyFieldLabel: "Text",
    markdownHint: "Markdown supported",
    bodyPlaceholder: "Enter the content text here...",
    deleteModalTitle: "Delete content",
    deleteConfirmButton: "Delete",
    deleteModalNote: "This action cannot be undone."
  },
  shops: {
    pageTitle: "Shops",
    title: "Shops",
    description: "List and management of all shops in the system.",
    searchPlaceholder: "Search by shop or owner...",
    allStatuses: "All statuses",
    active: "Active",
    blocked: "Blocked",
    tableShop: "Shop",
    tableOwner: "Owner",
    tablePhone: "Phone",
    tableProducts: "Products",
    tableCreated: "Created",
    tableStatus: "Status",
    tableActions: "Actions",
    noShops: "No shops found",
    blockAction: "Block",
    unblockAction: "Unblock",
    blockModalTitle: "Block shop",
    blockReasonLabel: "Reason (optional)",
    cancel: "Cancel",
    totalCount: "{count} total"
  },
  products: {
    title: "Products",
    description: "Product catalog and inventory management",
    createButton: "New product",
    statTotal: "Total products",
    statActive: "Active products",
    statLow: "Low stock",
    searchPlaceholder: "Product name or SKU...",
    allCategories: "All categories",
    allStatuses: "All statuses",
    statusInStock: "In stock",
    statusInactive: "Inactive",
    statusOutOfStock: "Out of stock",
    statusLowStock: "Low stock",
    tableImage: "Image",
    tableName: "Name",
    tableCategory: "Category",
    tablePrice: "Price",
    tableStock: "Stock",
    tableStatus: "Status",
    tableActions: "Actions",
    noProducts: "No products found",
    editTooltip: "Edit",
    activateTooltip: "Activate",
    deactivateTooltip: "Deactivate",
    deleteTooltip: "Delete",
    showingCount: "Showing {count} products",
    editModalTitle: "Edit product",
    createModalTitle: "New product",
    modalDescription: "Enter product details",
    cancel: "Cancel",
    saving: "Saving...",
    save: "Save",
    add: "Add",
    fieldName: "Product name",
    fieldCategory: "Category",
    fieldSku: "SKU",
    fieldPrice: "Price (UZS)",
    fieldStock: "Stock quantity",
    deleteModalTitle: "Delete product",
    deleteModalDescription: "Delete product \"{name}\"?",
    deleteConfirmButton: "Delete",
    deleteModalNote: "This action cannot be undone. The product can be archived."
  },
  support: {
    title: "Support requests",
    description: "Support requests received via the Telegram bot (/support) and the app",
    tabAll: "All",
    tabOpen: "Open",
    tabAnswered: "Answered",
    sourceBot: "Telegram bot",
    sourceWeb: "App (Contact Support)",
    replyLabel: "Reply:",
    webOnlyNote: "This came from the app form — replies can't be sent from here, contact via the provided details instead.",
    replyPlaceholder: "Write a reply...",
    sendButton: "Send",
    noTickets: "No support requests found",
    statusAnswered: "Answered",
    statusOpen: "Open",
    deleteConfirmQuestion: "Delete this?",
    yes: "Yes",
    no: "No",
    deleteTooltip: "Delete"
  },
  orders: {
    pageTitle: "Orders",
    title: "Orders",
    description: "Manage and track all customer orders",
    searchPlaceholder: "ID or customer...",
    tabAll: "All",
    tabPending: "Pending",
    tabProcessing: "Processing",
    tabShipped: "Shipped",
    tabDelivered: "Delivered",
    tabCancelled: "Cancelled",
    tableId: "ID",
    tableCustomer: "Customer",
    tableDate: "Date",
    tableTotal: "Total",
    tablePaymentStatus: "Payment status",
    tableOrderStatus: "Order status",
    paymentPaid: "Paid",
    paymentFailed: "Failed",
    paymentRefunded: "Refunded",
    unknownCustomer: "Unknown",
    noOrders: "No orders found",
    loading: "Loading...",
    totalShowing: "Showing {count} orders",
    statusUpdateError: "Error updating status: {message}",
    paymentUpdateError: "Error updating payment status: {message}"
  },
  reports: {
    pageTitle: "Sales",
    title: "Sales",
    description: "Full sales history and analysis",
    overview: "Overview",
    adminActivity: "Admin activity",
    security: "Security",
    chartPlaceholder: "Chart area",
    chartPlaceholderDescription: "Shown after backend integration",
    dateFrom: "From",
    dateTo: "To",
    refresh: "Refresh",
    loading: "Loading...",
    csvExport: "CSV Export",
    pdfExport: "PDF Export",
    noData: "No data",
    fetchError: "Error fetching data from server",
    exportError: "Error exporting data",
    totalUsers: "Total users",
    totalUsersNote: "Registered in the system",
    totalRevenue: "Total revenue",
    totalRevenueNote: "Confirmed payments (period)",
    totalOrders: "Total orders",
    totalOrdersNote: "All purchases",
    totalAdmins: "Total admins",
    totalAdminsNote: "All registered admins",
    activeAdmins: "Active admins",
    activeAdminsNote: "Have access to the system",
    blockedAdmins: "Blocked",
    blockedAdminsNote: "Cannot access the system",
    newBlocked: "Blocked (new)",
    newBlockedNote: "Blocked in the selected period",
    totalBlocked: "Total blocked",
    totalBlockedNote: "Total blocked users",
    failedLogins: "Failed logins",
    failedLoginsNote: "Incorrect password attempts",
    monthly: "Monthly report",
    newUsersThisMonth: "New users",
    newUsersThisMonthNote: "Registered this month",
    supportThisMonth: "Support messages",
    supportThisMonthNote: "Requests received this month",
    supportAnsweredThisMonth: "Answered",
    supportAnsweredThisMonthNote: "Open: {open}"
  },
  notificationsPage: {
    pageTitle: "Notifications",
    title: "Notifications",
    description: "System alerts and recent activity",
    empty: "No notifications yet",
    unreadSuffix: "{count} unread",
    markAllRead: "Mark all as read",
    markRead: "Mark as read"
  },
  audit: {
    pageTitle: "Audit Logs",
    title: "Audit logs",
    description:
      "Live list view filled by action history, filters and CRUD events.",
    searchPlaceholder: "Search actor or entity",
    allActions: "All actions",
    permissionChanges: "Permission changes",
    userActions: "User actions",
    adminActions: "Admin actions",
    contentActions: "Content actions",
    settingsActions: "Settings",
    authActions: "Authentication",
    noAudit: "No audit log found",
    noAuditDescription: "Try changing the search or action filter.",
    action: "Action",
    actor: "Actor",
    target: "Target",
    ipAddress: "IP address",
    timestamp: "Timestamp"
  },
  settings: {
    pageTitle: "Settings",
    tabsTitle: "Settings tabs",
    description:
      "Profile, notifications, security and system config blocks are collected on this page.",
    profileSettings: "Profile settings",
    notificationSettings: "Notification settings",
    securitySettings: "Security settings",
    systemSettings: "System settings",
    displayName: "Display name",
    sessionTimeout: "Session timeout",
    securityNote: "Security note",
    languagePreference: "Language preference",
    themePreference: "Theme preference",
    systemReadiness: "System readiness",
    superAdminScope: "Super admin scope",
    adminScope: "Admin scope",
    authFlow: "Auth flow",
    authFlowDescription:
      "Refresh token, unauthorized redirect and logout fallback are ready for the next phase.",
    featureFlags: "Feature flags",
    featureFlagsDescription:
      "Space is reserved for reports beta, 2FA required and advanced permissions.",
    auditReadiness: "Audit readiness",
    auditReadinessDescription:
      "Sensitive settings save actions connect to audit log events.",
    noteDefault:
      "Unsaved changes modal, 2FA setup and recent sessions can connect here.",
    navProfile: "Profile",
    navSecurity: "Security",
    navPreference: "System",
    profileSavedToast: "Changes saved",
    genericErrorToast: "An error occurred",
    passwordMismatch: "New passwords do not match",
    passwordUpdated: "Password updated successfully",
    pageDescription: "Manage your profile, security and system settings.",
    personalInfoTitle: "Personal information",
    personalInfoDescription: "Edit the basic information for your account.",
    nameLabel: "Name",
    emailLabel: "Email address",
    roleLabel: "Role",
    permissionsCountLabel: "Number of permissions",
    permissionsCountValue: "{count} permissions",
    saving: "Saving...",
    saveButton: "Save",
    changePasswordTitle: "Change password",
    changePasswordDescription: "Use a strong password to keep your account secure.",
    currentPasswordLabel: "Current password",
    newPasswordLabel: "New password",
    passwordMinLengthNote: "The password must be at least 8 characters.",
    confirmNewPasswordLabel: "Confirm new password",
    updatePasswordButton: "Update password",
    systemSettingsDescription: "Interface language and appearance settings.",
    interfaceLanguageLabel: "Interface language",
    appearanceTitle: "Appearance",
    appearanceNote: "Only the light theme is currently supported.",
    lightBadge: "Light"
  },
  profile: {
    pageTitle: "Profile",
    permissionsConnected: "{count} connected permissions",
    architectureReady: "Architecture ready",
    recentAuditEntries: "Recent audit entries",
    visibleInPanel: "{count} visible in panel",
    modules: "Profile modules",
    plannedSections: "Planned sections",
    twoFa: "2FA"
  },
  notFound: {
    pageTitle: "Not Found",
    title: "Page not found",
    description: "This route was not found. Go back to the dashboard.",
    openDashboard: "Open dashboard"
  },
  labels: {
    roles: {
      super_admin: "Super Admin",
      admin: "Admin",
      support: "Support",
      viewer: "Viewer",
      editor: "Editor",
      manager: "Manager",
      customer_support: "Customer Support"
    },
    statuses: {
      active: "Active",
      pending: "Pending",
      blocked: "Blocked",
      invited: "Invited",
      suspended: "Suspended",
      published: "Published",
      draft: "Draft",
      archived: "Archived"
    },
    modules: {
      dashboard: "Dashboard",
      users: "Users",
      admins: "Admins",
      roles: "Roles",
      permissions: "Permissions",
      content: "Content",
      reports: "Reports",
      audit_logs: "Audit Logs",
      settings: "Settings"
    },
    actions: {
      view: "View",
      create: "Create",
      update: "Update",
      delete: "Delete",
      export: "Export",
      manage: "Manage"
    },
    priorities: {
      low: "Low",
      medium: "Medium",
      high: "High"
    },
    contentTypes: {
      landing_page: "Landing page",
      knowledge_base: "Knowledge base",
      media_asset: "Media asset"
    },
    permissionSummaries: {
      full_access: "Full access",
      scoped_access: "Scoped module access",
      users_content_reports: "Users, content, reports",
      users_view_reports_view: "Users view, reports view"
    },
    createdBy: {
      system: "System bootstrap"
    }
  },
  seeds: {
    dashboardHighlights: {
      permissionRollout: {
        title: "Permission rollout",
        description:
          "The role matrix is ready for module-level access checks and singleton super admin validation."
      },
      apiReadiness: {
        title: "API readiness",
        description:
          "Auth, users, admins, roles, permissions, reports, settings and audit-log endpoints are planned."
      },
      mvpScope: {
        title: "MVP scope",
        description:
          "Login, dashboard, users, admins, roles, permissions and settings are prioritized for the first release."
      }
    },
    activities: {
      adminRoleUpdated: {
        title: "Admin role updated",
        detail: "Viewer role upgraded to Support for {name}"
      },
      userBlocked: {
        title: "User blocked",
        detail: "Repeated failed login attempts triggered a manual block"
      },
      reportExported: {
        title: "Report exported",
        detail: "Monthly admin activity report exported as CSV"
      },
      genericUpdatedBy: {
        detail: "{target} updated by {actor}"
      }
    },
    notifications: {
      twoFaPending: {
        title: "2FA preparation pending",
        detail: "UI architecture is ready, backend requirement is still open."
      },
      singleton: {
        title: "Super admin singleton",
        detail: "Second super admin creation is disabled in UI and must be validated by the API as well."
      },
      auditExport: {
        title: "Audit export",
        detail: "The export button should stay hidden for users without `reports.export` permission."
      }
    },
    roles: {
      super_admin: {
        scope: "All modules",
        note: "Singleton role. Cannot be assigned from the create-admin form."
      },
      admin: {
        scope: "Users, content, reports, settings",
        note: "Primary operational role for platform management."
      },
      editor: {
        scope: "Content create and update",
        note: "No access to admin management or permissions."
      },
      viewer: {
        scope: "Read-only access",
        note: "Suitable for auditors and observers."
      }
    },
    content: {
      springCampaign: "Spring Campaign Landing",
      deliveryFaq: "Delivery FAQ",
      promoBanners: "Promo banner set"
    },
    reports: {
      dailyActiveUsers: {
        title: "Daily active users",
        note: "Up 6.3% from yesterday"
      },
      weeklyRegistrations: {
        title: "Weekly registrations",
        note: "Stable over the last 7 days"
      },
      failedLogins: {
        title: "Failed logins",
        note: "2 cases require manual review"
      }
    },
    auditActions: {
      permissionChanged: "Permission changed",
      userBlocked: "User blocked",
      loginFailed: "Login failed",
      userCreated: "User created",
      userUpdated: "User updated",
      userUnblocked: "User unblocked",
      userDeleted: "User deleted",
      adminCreated: "Admin created",
      adminUpdated: "Admin updated",
      adminStatusChanged: "Admin status changed",
      roleCreated: "Role created",
      permissionsSaved: "Permission matrix saved",
      contentCreated: "Content created",
      contentStatusChanged: "Content status changed",
      settingsUpdated: "Settings updated"
    },
    profileSections: {
      personalInfo: {
        title: "Personal info",
        items: ["Name and email", "Avatar update", "Language preference"]
      },
      security: {
        title: "Security",
        items: ["Password rotation", "Recent sessions", "2FA readiness"]
      },
      preferences: {
        title: "Preferences",
        items: ["Sidebar state", "Notification channels", "Default report range"]
      }
    }
  },
  toast: {
    userCreated: "User created: {name}",
    userUpdated: "User updated",
    userDeleted: "User deleted: {name}",
    userStatus: "User status: {status}",
    onlyOneSuperAdmin: "Only one super admin is allowed",
    adminCreated: "Admin created: {name}",
    adminUpdated: "Admin updated",
    adminStatus: "Admin status: {status}",
    superAdminTransferDisabled:
      "Super admin role transfer is disabled in this demo",
    roleCreated: "Role created: {name}",
    permissionsSaved: "Permissions saved",
    contentCreated: "Content created: {name}",
    contentStatusUpdated: "Content status updated: {status}",
    settingsSaved: "{section} saved"
  }
};
