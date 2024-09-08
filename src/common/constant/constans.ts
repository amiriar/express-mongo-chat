export const MongoIDPattern: RegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
// Alternatively: /^[0-9a-fA-F]{24}$/

export const ROLES = Object.freeze({
    USER: "USER" as const,
    ADMIN: "ADMIN" as const,
    TEACHER: "TEACHER" as const
});

export const PERMISSIONS = Object.freeze({
    USER: ["profile"] as const,
    ADMIN: ["all"] as const,
    TEACHER: ["course", "blog", "events"] as const,
    ALL: "all" as const
});
