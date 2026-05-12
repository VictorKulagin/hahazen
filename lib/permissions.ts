import { authStorage } from "@/services/authStorage";

export const can = {
    appointments: {
        viewAll: () => authStorage.has("appointment:view"),
        viewOwn: () => authStorage.has("appointment:view:own"),
        viewAny: () => authStorage.hasAny(["appointment:view", "appointment:view:own"]),
        create: () => authStorage.has("appointment:create"),
        update: () => authStorage.has("appointment:update"),
        delete: () => authStorage.has("appointment:delete"),
    },

    clients: {
        viewAny: () => authStorage.hasAny([
            "client:view",
            "client:view:own",
            "client:view:own:arrived",
            "client:view:own:scheduled",
        ]),
        viewContacts: () => authStorage.has("client:view:contacts"),
        create: () => authStorage.has("client:create"),
        update: () => authStorage.has("client:update"),
        delete: () => authStorage.has("client:delete"),
    },

    employees: {
        view: () => authStorage.has("master:view"),
        create: () => authStorage.has("master:create"),
        update: () => authStorage.has("master:update"),
        delete: () => authStorage.has("master:delete"),
        assignRoles: () => authStorage.hasAny(["master:update", "role:assign"]),
    },

    services: {
        view: () => authStorage.has("service:view"),
        create: () => authStorage.has("service:create"),
        update: () => authStorage.has("service:update"),
        delete: () => authStorage.has("service:delete"),
    },
};
