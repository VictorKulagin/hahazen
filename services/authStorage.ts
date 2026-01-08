// services/authStorage.ts
export type AuthUser = {
    id: number;
    username: string;
    email: string;
    name: string;
};

export type AuthEmployee = {
    id: number;
    branch_id: number;
} | null;

export type AuthPayload = {
    access_token: string;
    token_type?: "Bearer";
    user?: AuthUser;
    employee?: AuthEmployee;
    roles?: Record<string, any>;
    permissions?: string[];
};

const KEYS = {
    token: "access_token",
    user: "user",
    employee: "employee",
    roles: "roles",
    permissions: "permissions",
} as const;

const safeJsonParse = <T>(v: string | null): T | null => {
    if (!v) return null;
    try { return JSON.parse(v) as T; } catch { return null; }
};

export const authStorage = {
    setAuth(payload: AuthPayload) {
        if (typeof window === "undefined") return;

        if (payload.access_token) localStorage.setItem(KEYS.token, payload.access_token);

        if (payload.user) localStorage.setItem(KEYS.user, JSON.stringify(payload.user));
        if (payload.employee !== undefined) localStorage.setItem(KEYS.employee, JSON.stringify(payload.employee));
        if (payload.roles) localStorage.setItem(KEYS.roles, JSON.stringify(payload.roles));
        if (payload.permissions) localStorage.setItem(KEYS.permissions, JSON.stringify(payload.permissions));
    },

    clear() {
        if (typeof window === "undefined") return;
        Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    },

    getToken(): string | null {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(KEYS.token);
    },

    getUser(): AuthUser | null {
        if (typeof window === "undefined") return null;
        return safeJsonParse<AuthUser>(localStorage.getItem(KEYS.user));
    },

    getEmployee(): AuthEmployee {
        if (typeof window === "undefined") return null;
        return safeJsonParse<AuthEmployee>(localStorage.getItem(KEYS.employee)) ?? null;
    },

    getPermissions(): string[] {
        if (typeof window === "undefined") return [];
        return safeJsonParse<string[]>(localStorage.getItem(KEYS.permissions)) ?? [];
    },

    has(permission: string): boolean {
        return this.getPermissions().includes(permission);
    },

    hasAny(perms: string[]): boolean {
        const set = new Set(this.getPermissions());
        return perms.some((p) => set.has(p));
    },

    // Примитивная роль мастера: employee != null
    isMaster(): boolean {
        return !!this.getEmployee();
    },
};
