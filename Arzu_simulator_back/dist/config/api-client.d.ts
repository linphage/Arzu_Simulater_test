interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: any[];
    timestamp: string;
}
declare class ApiClient {
    private client;
    private isRefreshing;
    private failedQueue;
    constructor();
    private setupInterceptors;
    private transformResponse;
    private generateRequestId;
    private getAccessToken;
    private getRefreshToken;
    private handleTokenRefresh;
    private setAuthData;
    private clearAuthData;
    private redirectToLogin;
    private showErrorMessage;
    private request;
    auth: {
        register: (userData: {
            username: string;
            email: string;
            password: string;
        }) => Promise<ApiResponse<unknown>>;
        login: (credentials: {
            username: string;
            password: string;
        }) => Promise<ApiResponse<unknown>>;
        refreshToken: (refreshToken: string) => Promise<ApiResponse<unknown>>;
        logout: () => Promise<ApiResponse<unknown>>;
    };
    tasks: {
        create: (taskData: any) => Promise<ApiResponse<unknown>>;
        getAll: (params?: any) => Promise<ApiResponse<unknown>>;
        getById: (id: number) => Promise<ApiResponse<unknown>>;
        update: (id: number, updateData: any) => Promise<ApiResponse<unknown>>;
        delete: (id: number) => Promise<ApiResponse<unknown>>;
        getStats: () => Promise<ApiResponse<unknown>>;
        getAnalytics: (days?: number) => Promise<ApiResponse<unknown>>;
        search: (query: string, limit?: number) => Promise<ApiResponse<unknown>>;
        getUpcoming: (days?: number) => Promise<ApiResponse<unknown>>;
        getOverdue: () => Promise<ApiResponse<unknown>>;
        archiveCompleted: (daysOld?: number) => Promise<ApiResponse<unknown>>;
        batchOperate: (operation: string, taskIds: number[]) => Promise<ApiResponse<unknown>>;
        pomodoro: {
            createSession: (taskId?: number, durationMinutes?: number) => Promise<ApiResponse<unknown>>;
            completeSession: (sessionId: number) => Promise<ApiResponse<unknown>>;
            getSessions: () => Promise<ApiResponse<unknown>>;
            getActiveSession: () => Promise<ApiResponse<unknown>>;
            getStats: (days?: number) => Promise<ApiResponse<unknown>>;
        };
    };
    utils: {
        isAuthenticated: () => boolean;
        getUserInfo: () => any;
        setUserInfo: (userInfo: any) => void;
        clearAllData: () => void;
    };
}
declare const apiClient: ApiClient;
export default apiClient;
export { ApiClient };
//# sourceMappingURL=api-client.d.ts.map