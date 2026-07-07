// Lightweight authentication audit log — console-only today (same "no real
// sink yet" pattern as NotificationService), swappable for a database table
// or analytics pipeline later without touching call sites in
// server/services/auth.ts or lib/auth.ts's `events` callbacks.

export type AuthAuditEvent =
  | "registration"
  | "login_success"
  | "login_failure"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_changed"
  | "email_verified"
  | "logout";

export interface AuthAuditContext {
  email?: string;
  userId?: string;
}

export interface AuthAuditService {
  log(event: AuthAuditEvent, context: AuthAuditContext): void;
}

class ConsoleAuditService implements AuthAuditService {
  log(event: AuthAuditEvent, context: AuthAuditContext): void {
    console.info(`[auth-audit] ${event}`, context);
  }
}

export const authAuditService: AuthAuditService = new ConsoleAuditService();
