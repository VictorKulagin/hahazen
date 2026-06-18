// services/authStorage.ts
export type AuthUser = {
    id: number;
    username: string;
    email: string;
    name: string;
    last_name?: string | null;
    phone?: string | null;
};

export type AuthEmployee = {
    id: number;
    company_id?: number;
    branch_id: number;
    role?: string;
} | null;

export type AuthContext = {
    company_id: number;
    branch_id?: number | null;
    company_name?: string | null;
    branch_name?: string | null;
    role?: string | null;
    set_at?: number | null;
    permissions?: string[];
    label?: string;
} | null;

export type AuthPayload = {
    access_token: string;
    token_type?: "Bearer";
    user?: AuthUser;
    employee?: AuthEmployee;
    context?: AuthContext;
    roles?: Record<string, unknown>;
    permissions?: string[];
};

const KEYS = {
    token: "access_token",
    user: "user",
    employee: "employee",
    context: "api_context",
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
        else localStorage.removeItem(KEYS.user);

        if (payload.employee !== undefined) localStorage.setItem(KEYS.employee, JSON.stringify(payload.employee));
        else localStorage.removeItem(KEYS.employee);

        if (payload.context !== undefined) localStorage.setItem(KEYS.context, JSON.stringify(payload.context));
        else localStorage.removeItem(KEYS.context);

        if (payload.roles) localStorage.setItem(KEYS.roles, JSON.stringify(payload.roles));
        else localStorage.removeItem(KEYS.roles);

        if (payload.permissions) localStorage.setItem(KEYS.permissions, JSON.stringify(payload.permissions));
        else localStorage.removeItem(KEYS.permissions);
    },

    setContext(context: AuthContext) {
        if (typeof window === "undefined") return;
        localStorage.setItem(KEYS.context, JSON.stringify(context));
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

    getContext(): AuthContext {
        if (typeof window === "undefined") return null;
        return safeJsonParse<AuthContext>(localStorage.getItem(KEYS.context)) ?? null;
    },

    getRoles(): Record<string, unknown> {
        if (typeof window === "undefined") return {};
        return safeJsonParse<Record<string, unknown>>(localStorage.getItem(KEYS.roles)) ?? {};
    },

    getPermissions(): string[] {
        if (typeof window === "undefined") return [];
        const context = this.getContext();
        const storedPermissions = safeJsonParse<string[]>(localStorage.getItem(KEYS.permissions)) ?? [];
        const contextPermissions = context?.permissions ?? [];
        return Array.from(new Set([...storedPermissions, ...contextPermissions]));
    },

    has(permission: string): boolean {
        return this.getPermissions().includes(permission);
    },

    hasAny(perms: string[]): boolean {
        const set = new Set(this.getPermissions());
        return perms.some((p) => set.has(p));
    },

    hasRole(role: string): boolean {
        const expected = role.toLowerCase();
        const roles = this.getRoles();
        return [...Object.keys(roles), ...Object.values(roles).map(String)]
            .some((value) => value.toLowerCase() === expected);
    },

    // Примитивная роль мастера: employee != null
    isMaster(): boolean {
        return !!this.getEmployee();
    },
};
