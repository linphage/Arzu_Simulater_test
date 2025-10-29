export interface User {
    user_id: number;
    id: number;
    username: string;
    mail: string;
    password_hash: string;
    created_at: string;
    api_ds: string | null;
    work_count: number;
    worktime_count: number;
    last_reward_trigger_time: number;
    reward_count: number;
}
export interface CreateUserData {
    username: string;
    mail: string;
    passwordHash: string;
}
export interface UpdateUserData {
    username?: string;
    mail?: string;
    password_hash?: string;
    api_ds?: string | null;
    work_count?: number;
    worktime_count?: number;
    last_reward_trigger_time?: number;
    reward_count?: number;
}
export declare class UserRepository {
    create(userData: CreateUserData): Promise<number>;
    findById(id: number): Promise<User | undefined>;
    findByUsername(username: string): Promise<User | undefined>;
    findByEmail(email: string): Promise<User | undefined>;
    findByUsernameOrEmail(username: string, mail: string): Promise<User | undefined>;
    update(id: number, updateData: UpdateUserData): Promise<void>;
    delete(id: number): Promise<void>;
    findAll(options?: {
        page?: number;
        limit?: number;
        isActive?: boolean;
    }): Promise<{
        users: User[];
        total: number;
    }>;
    updateLastLogin(id: number): Promise<void>;
    incrementFailedLoginAttempts(id: number): Promise<void>;
    resetFailedLoginAttempts(id: number): Promise<void>;
    lockAccount(id: number, lockedUntil: Date): Promise<void>;
    unlockAccount(id: number): Promise<void>;
    isAccountLocked(id: number): Promise<boolean>;
    getActiveUserCount(): Promise<number>;
    getRecentUsers(days?: number): Promise<User[]>;
    getUsersByLastLogin(days?: number): Promise<User[]>;
    searchUsers(query: string): Promise<User[]>;
    deleteInactiveUsers(daysInactive?: number): Promise<number>;
    getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
        lockedUsers: number;
        recentUsers: number;
    }>;
}
export default UserRepository;
//# sourceMappingURL=user.repository.d.ts.map