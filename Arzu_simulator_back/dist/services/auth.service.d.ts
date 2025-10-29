export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface LoginResult {
    user: {
        id: number;
        username: string;
        email: string;
    };
    tokens: AuthTokens;
}
export declare class AuthService {
    private userRepository;
    private readonly saltRounds;
    constructor();
    register(username: string, mail: string, password: string): Promise<{
        userId: number;
        username: string;
        mail: string;
    }>;
    login(username: string, password: string, clientIp?: string): Promise<LoginResult>;
    loginByEmail(mail: string, password: string): Promise<{
        token: string;
    }>;
    refreshAccessToken(refreshToken: string): Promise<AuthTokens>;
    logout(userId: number, refreshToken?: string): Promise<void>;
    validateAccessToken(token: string): Promise<{
        userId: number;
        username: string;
        email: string;
    }>;
    private validateRegistrationInput;
    private checkAccountStatus;
    private handleFailedLogin;
    private handleSuccessfulLogin;
    private generateTokens;
    private storeRefreshToken;
    private checkRefreshTokenExists;
    private removeRefreshToken;
    private removeAllRefreshTokens;
    private hashToken;
    cleanupExpiredRefreshTokens(): Promise<number>;
    getAuthStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        lockedUsers: number;
        refreshTokens: number;
    }>;
    getUserProfile(userId: number): Promise<{
        id: number;
        username: string;
        email: string;
        createdAt: string;
        daysSinceRegistration: number;
    }>;
}
export default AuthService;
//# sourceMappingURL=auth.service.d.ts.map