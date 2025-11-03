import { User } from '../repositories/user.repository';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        mail: string;
        email: string;
      };
      pagination?: {
        page: number;
        limit: number;
      };
      sorting?: {
        sortBy: string;
        sortOrder: 'asc' | 'desc';
      };
    }
  }
}

export {};
