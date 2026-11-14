// Pure function: server /auth/me payload -> in-app role. No React Native imports, so it is unit-testable in plain Node.
export type UserRole = "admin" | "cashier";
export type AccountKind = "ADMIN" | "DIRECTOR" | "SOLO" | "CASHIER";

export function deriveRole(me: { user?: any; shopMemberships?: any[] }): { role: UserRole; kind: AccountKind } {
  const memberships = me.shopMemberships || [];
  if (me.user?.role === "ADMIN") return { role: "admin", kind: "ADMIN" };
  if (memberships.some((m) => m.myRole === "OWNER" && m.isBusiness)) return { role: "admin", kind: "DIRECTOR" };
  if (memberships.some((m) => m.myRole === "OWNER")) return { role: "admin", kind: "SOLO" };
  if (memberships.some((m) => m.myRole === "CASHIER")) return { role: "cashier", kind: "CASHIER" };
  return { role: "admin", kind: "SOLO" }; // no shop yet: a personal one is created on first use
}
