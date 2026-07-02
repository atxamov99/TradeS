export const en = {
  app: {
    name: "Savdo Control",
    description: "Role-based admin and super admin panel for Savdo-E"
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
      reports: {
        label: "Reports",
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
    heroEyebrow: "Savdo-E control room",
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
      newUsersDetail: "12 new sign-ups this week",
      blockedAccounts: "Blocked accounts",
      blockedAccountsDetail: "3 accounts currently inactive",
      reportReady: "Report ready",
      reportReadyDetail: "Monthly report is ready for download"
    },
    liveStructure: "Live structure",
    notificationsTitle: "Notifications",
    priorityFeed: "Priority feed",
    checkpoints: "Implementation checkpoints",
    planAlignment: "Plan alignment"
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
      "The route is ready for role history and audit integration."
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
    suspend: "Suspend"
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
      "Rich text editor and media upload are deferred to the next phase."
  },
  reports: {
    pageTitle: "Reports",
    title: "Reports",
    description:
      "Working skeleton for date range, metrics and export actions.",
    overview: "Overview",
    adminActivity: "Admin activity",
    security: "Security",
    chartPlaceholder: "Chart area",
    chartPlaceholderDescription: "Shown after backend integration"
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
      "Unsaved changes modal, 2FA setup and recent sessions can connect here."
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
