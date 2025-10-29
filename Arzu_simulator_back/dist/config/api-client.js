"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const frontend_config_1 = require("./frontend.config");
class ApiClient {
    constructor() {
        this.isRefreshing = false;
        this.failedQueue = [];
        this.auth = {
            register: (userData) => __awaiter(this, void 0, void 0, function* () {
                const response = yield this.request('POST', frontend_config_1.API_ENDPOINTS.AUTH.REGISTER, userData);
                return response;
            }),
            login: (credentials) => __awaiter(this, void 0, void 0, function* () {
                const response = yield this.request('POST', frontend_config_1.API_ENDPOINTS.AUTH.LOGIN, credentials);
                if (response.success && response.data) {
                    this.setAuthData(response.data.accessToken, response.data.refreshToken);
                }
                return response;
            }),
            refreshToken: (refreshToken) => __awaiter(this, void 0, void 0, function* () {
                const response = yield this.request('POST', frontend_config_1.API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
                if (response.success && response.data) {
                    this.setAuthData(response.data.accessToken, response.data.refreshToken);
                }
                return response;
            }),
            logout: () => __awaiter(this, void 0, void 0, function* () {
                const response = yield this.request('POST', frontend_config_1.API_ENDPOINTS.AUTH.LOGOUT);
                this.clearAuthData();
                return response;
            })
        };
        this.tasks = {
            create: (taskData) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('POST', frontend_config_1.API_ENDPOINTS.TASKS.BASE, taskData);
            }),
            getAll: (params) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.BASE, undefined, { params });
            }),
            getById: (id) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.BY_ID(id));
            }),
            update: (id, updateData) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('PATCH', frontend_config_1.API_ENDPOINTS.TASKS.BY_ID(id), updateData);
            }),
            delete: (id) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('DELETE', frontend_config_1.API_ENDPOINTS.TASKS.BY_ID(id));
            }),
            getStats: () => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.STATS);
            }),
            getAnalytics: (days) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.ANALYTICS, undefined, {
                    params: days ? { days } : undefined
                });
            }),
            search: (query, limit) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.SEARCH, undefined, {
                    params: { q: query, limit }
                });
            }),
            getUpcoming: (days) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.UPCOMING, undefined, {
                    params: days ? { days } : undefined
                });
            }),
            getOverdue: () => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.OVERDUE);
            }),
            archiveCompleted: (daysOld) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('POST', frontend_config_1.API_ENDPOINTS.TASKS.ARCHIVE, undefined, {
                    params: daysOld ? { daysOld } : undefined
                });
            }),
            batchOperate: (operation, taskIds) => __awaiter(this, void 0, void 0, function* () {
                return yield this.request('POST', frontend_config_1.API_ENDPOINTS.TASKS.BATCH, {
                    operation,
                    taskIds
                });
            }),
            pomodoro: {
                createSession: (taskId_1, ...args_1) => __awaiter(this, [taskId_1, ...args_1], void 0, function* (taskId, durationMinutes = 25) {
                    return yield this.request('POST', frontend_config_1.API_ENDPOINTS.TASKS.POMODORO.BASE, {
                        taskId,
                        durationMinutes
                    });
                }),
                completeSession: (sessionId) => __awaiter(this, void 0, void 0, function* () {
                    return yield this.request('PATCH', frontend_config_1.API_ENDPOINTS.TASKS.POMODORO.COMPLETE(sessionId));
                }),
                getSessions: () => __awaiter(this, void 0, void 0, function* () {
                    return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.POMODORO.BASE);
                }),
                getActiveSession: () => __awaiter(this, void 0, void 0, function* () {
                    return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.POMODORO.ACTIVE);
                }),
                getStats: (days) => __awaiter(this, void 0, void 0, function* () {
                    return yield this.request('GET', frontend_config_1.API_ENDPOINTS.TASKS.POMODORO.STATS, undefined, {
                        params: days ? { days } : undefined
                    });
                })
            }
        };
        this.utils = {
            isAuthenticated: () => {
                return !!this.getAccessToken();
            },
            getUserInfo: () => {
                const userInfo = localStorage.getItem(frontend_config_1.AUTH_CONSTANTS.USER_INFO_KEY);
                return userInfo ? JSON.parse(userInfo) : null;
            },
            setUserInfo: (userInfo) => {
                localStorage.setItem(frontend_config_1.AUTH_CONSTANTS.USER_INFO_KEY, JSON.stringify(userInfo));
            },
            clearAllData: () => {
                this.clearAuthData();
                localStorage.removeItem('arzu_tasks_cache');
                localStorage.removeItem('arzu_pomodoro_cache');
            }
        };
        this.client = axios_1.default.create({
            baseURL: frontend_config_1.apiConfig.baseUrl,
            timeout: frontend_config_1.apiConfig.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        this.client.interceptors.request.use((config) => {
            const token = this.getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            config.headers['X-Request-ID'] = this.generateRequestId();
            return config;
        }, (error) => Promise.reject(error));
        this.client.interceptors.response.use((response) => {
            if (response.data && typeof response.data === 'object') {
                return Object.assign(Object.assign({}, response), { data: this.transformResponse(response.data) });
            }
            return response;
        }, (error) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const originalRequest = error.config;
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    yield this.handleTokenRefresh();
                    return this.client(originalRequest);
                }
                catch (refreshError) {
                    this.clearAuthData();
                    this.redirectToLogin();
                    return Promise.reject(refreshError);
                }
            }
            const errorResponse = (0, frontend_config_1.handleApiError)(error);
            if (originalRequest.showError !== false) {
                this.showErrorMessage(errorResponse.message);
            }
            return Promise.reject(errorResponse);
        }));
    }
    transformResponse(data) {
        if (data && typeof data === 'object' && 'success' in data) {
            return data;
        }
        return (0, frontend_config_1.formatApiResponse)(true, '操作成功', data);
    }
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getAccessToken() {
        return localStorage.getItem(frontend_config_1.AUTH_CONSTANTS.TOKEN_KEY);
    }
    getRefreshToken() {
        return localStorage.getItem(frontend_config_1.AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
    }
    handleTokenRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRefreshing) {
                return new Promise((resolve, reject) => {
                    this.failedQueue.push({ resolve, reject });
                });
            }
            this.isRefreshing = true;
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            try {
                const response = yield this.client.post(frontend_config_1.API_ENDPOINTS.AUTH.REFRESH, {
                    refreshToken
                });
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                this.setAuthData(accessToken, newRefreshToken);
                this.failedQueue.forEach(({ resolve }) => resolve(undefined));
                this.failedQueue = [];
            }
            catch (error) {
                this.failedQueue.forEach(({ reject }) => reject(error));
                this.failedQueue = [];
                throw error;
            }
            finally {
                this.isRefreshing = false;
            }
        });
    }
    setAuthData(accessToken, refreshToken) {
        localStorage.setItem(frontend_config_1.AUTH_CONSTANTS.TOKEN_KEY, accessToken);
        localStorage.setItem(frontend_config_1.AUTH_CONSTANTS.REFRESH_TOKEN_KEY, refreshToken);
    }
    clearAuthData() {
        localStorage.removeItem(frontend_config_1.AUTH_CONSTANTS.TOKEN_KEY);
        localStorage.removeItem(frontend_config_1.AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
        localStorage.removeItem(frontend_config_1.AUTH_CONSTANTS.USER_INFO_KEY);
    }
    redirectToLogin() {
        window.location.href = '/login';
    }
    showErrorMessage(message) {
        console.error('API Error:', message);
    }
    request(method_1, url_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (method, url, data, config = {}) {
            const requestConfig = Object.assign({ method,
                url,
                data }, config);
            try {
                if (config.retry) {
                    return yield (0, frontend_config_1.retryAsync)(() => __awaiter(this, void 0, void 0, function* () {
                        const response = yield this.client.request(requestConfig);
                        return response.data;
                    }));
                }
                else {
                    const response = yield this.client.request(requestConfig);
                    return response.data;
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.ApiClient = ApiClient;
const apiClient = new ApiClient();
exports.default = apiClient;
//# sourceMappingURL=api-client.js.map