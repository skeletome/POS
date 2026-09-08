import type { Cashier, Role } from "./types";

const KEY = "pos.session";

export interface SessionUser {
  role: Role;
  name: string;
}

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(role: Role, name: string) {
  window.localStorage.setItem(KEY, JSON.stringify({ role, name }));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}

export function getNameForRole(role: Role): string {
  return role === "OWNER" ? "Andi Wijaya" : "Rina Kartika";
}

export function getCashierName(id: string, cashiers: Cashier[]): string {
  return cashiers.find((c) => c.id === id)?.name ?? id;
}