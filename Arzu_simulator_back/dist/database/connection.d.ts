import sqlite3 from 'sqlite3';
export declare const createDatabaseConnection: () => Promise<sqlite3.Database>;
export declare const getDatabase: () => Promise<sqlite3.Database>;
export declare const closeDatabase: () => Promise<void>;
export declare const runQuery: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
export declare const getQuery: <T>(sql: string, params?: any[]) => Promise<T | undefined>;
export declare const allQuery: <T>(sql: string, params?: any[]) => Promise<T[]>;
export declare const executeTransaction: (callback: (db: sqlite3.Database) => Promise<void>) => Promise<void>;
//# sourceMappingURL=connection.d.ts.map