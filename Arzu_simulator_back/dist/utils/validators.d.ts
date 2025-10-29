import { ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
export declare const usernameValidation: ValidationChain;
export declare const emailValidation: ValidationChain;
export declare const passwordValidation: ValidationChain;
export declare const usernamValidation: ValidationChain;
export declare const mailValidation: ValidationChain;
export declare const registerValidation: ValidationChain[];
export declare const loginValidation: ValidationChain[];
export declare const emailLoginValidation: ValidationChain[];
export declare const createTaskValidation: ValidationChain[];
export declare const updateTaskValidation: ValidationChain[];
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParam: (paramName: string) => ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const paginationValidation: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const sortValidation: (allowedFields: string[]) => ((req: Request, res: Response, next: NextFunction) => void)[];
//# sourceMappingURL=validators.d.ts.map