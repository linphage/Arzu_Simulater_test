export declare const serverConfig: {
    port: number;
    env: string;
    isDevelopment: boolean;
    isProduction: boolean;
};
export declare const databaseConfig: {
    path: string;
};
export declare const authConfig: {
    jwtSecret: string;
    jwtRefreshSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    bcryptRounds: number;
    loginRateLimitWindow: number;
    loginRateLimitMax: number;
};
export declare const loggerConfig: {
    level: string;
    file: string;
    errorFile: string;
};
export declare const securityConfig: {
    corsOrigin: string | string[];
    rateLimitWindow: number;
    rateLimitMax: number;
};
export declare const appConfig: {
    name: string;
    version: string;
    apiPrefix: string;
};
declare const _default: {
    server: {
        port: number;
        env: string;
        isDevelopment: boolean;
        isProduction: boolean;
    };
    database: {
        path: string;
    };
    auth: {
        jwtSecret: string;
        jwtRefreshSecret: string;
        jwtExpiresIn: string;
        jwtRefreshExpiresIn: string;
        bcryptRounds: number;
        loginRateLimitWindow: number;
        loginRateLimitMax: number;
    };
    logger: {
        level: string;
        file: string;
        errorFile: string;
    };
    security: {
        corsOrigin: string | string[];
        rateLimitWindow: number;
        rateLimitMax: number;
    };
    app: {
        name: string;
        version: string;
        apiPrefix: string;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map