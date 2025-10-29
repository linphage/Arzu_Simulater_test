export interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}
export interface ErrorResponse {
    success: boolean;
    message: string;
    timestamp: string;
    stack?: string;
}
export declare const apiConfig: ApiConfig;
export declare const AUTH_CONSTANTS: {
    TOKEN_KEY: string;
    REFRESH_TOKEN_KEY: string;
    USER_INFO_KEY: string;
    TOKEN_EXPIRY_MARGIN: number;
};
export declare const API_ENDPOINTS: {
    AUTH: {
        REGISTER: string;
        LOGIN: string;
        REFRESH: string;
        LOGOUT: string;
    };
    TASKS: {
        BASE: string;
        BY_ID: (id: number) => string;
        STATS: string;
        ANALYTICS: string;
        SEARCH: string;
        UPCOMING: string;
        OVERDUE: string;
        ARCHIVE: string;
        BATCH: string;
        POMODORO: {
            BASE: string;
            COMPLETE: (sessionId: number) => string;
            ACTIVE: string;
            STATS: string;
        };
    };
};
export declare const HTTP_STATUS_CODES: {
    OK: number;
    CREATED: number;
    BAD_REQUEST: number;
    UNAUTHORIZED: number;
    FORBIDDEN: number;
    NOT_FOUND: number;
    CONFLICT: number;
    UNPROCESSABLE_ENTITY: number;
    TOO_MANY_REQUESTS: number;
    INTERNAL_SERVER_ERROR: number;
};
export declare const ERROR_MESSAGES: {
    NETWORK_ERROR: string;
    TIMEOUT_ERROR: string;
    SERVER_ERROR: string;
    AUTH_ERROR: string;
    VALIDATION_ERROR: string;
    NOT_FOUND_ERROR: string;
    CONFLICT_ERROR: string;
    RATE_LIMIT_ERROR: string;
};
export declare const SUCCESS_MESSAGES: {
    TASK_CREATED: string;
    TASK_UPDATED: string;
    TASK_DELETED: string;
    TASK_COMPLETED: string;
    POMODORO_STARTED: string;
    POMODORO_COMPLETED: string;
    LOGIN_SUCCESS: string;
    REGISTER_SUCCESS: string;
    LOGOUT_SUCCESS: string;
};
export declare const TASK_CONFIG: {
    CATEGORIES: {
        value: string;
        label: string;
        color: string;
        description: string;
    }[];
    PRIORITIES: {
        value: string;
        label: string;
        color: string;
        level: number;
        description: string;
    }[];
};
export declare const POMODORO_CONFIG: {
    DEFAULT_DURATION: number;
    SHORT_BREAK: number;
    LONG_BREAK: number;
    SESSIONS_BEFORE_LONG_BREAK: number;
    MIN_DURATION: number;
    MAX_DURATION: number;
};
export declare const PAGINATION_CONFIG: {
    DEFAULT_PAGE: number;
    DEFAULT_PAGE_SIZE: number;
    MAX_PAGE_SIZE: number;
    PAGE_SIZE_OPTIONS: number[];
};
export declare const STORAGE_KEYS: {
    TASKS_VIEW_TYPE: string;
    TASKS_SORT_BY: string;
    TASKS_SORT_ORDER: string;
    POMODORO_SETTINGS: string;
    THEME_PREFERENCE: string;
    LANGUAGE_PREFERENCE: string;
};
export declare const formatApiResponse: <T>(success: boolean, message: string, data?: T, errors?: any[]) => {
    success: boolean;
    message: string;
    timestamp: string;
    data: T | undefined;
    errors: any[] | undefined;
};
export declare const handleApiError: (error: any) => ErrorResponse;
export declare const retryAsync: <T>(fn: () => Promise<T>, attempts?: number, delay?: number) => Promise<T>;
export declare const formatDateTime: (dateString: string) => string;
export declare const getTaskStatus: (task: any) => string;
export declare const sortByPriority: (tasks: any[]) => any[];
//# sourceMappingURL=frontend.config.d.ts.map