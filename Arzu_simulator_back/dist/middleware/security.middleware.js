"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.preventMimeSniffing = exports.preventClickjacking = exports.ipWhitelist = exports.requestSizeLimit = exports.requestTimeout = exports.requestId = exports.requestLogger = exports.securityMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("../config/logger");
const securityMiddleware = () => {
    return (0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    });
};
exports.securityMiddleware = securityMiddleware;
const requestLogger = (req, res, next) => {
    const start = Date.now();
    logger_1.logger.info('Request started', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            timestamp: new Date().toISOString()
        };
        if (res.statusCode >= 400) {
            logger_1.logger.warn('Request completed with error', logData);
        }
        else {
            logger_1.logger.info('Request completed', logData);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
const requestId = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || generateRequestId();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
};
exports.requestId = requestId;
const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        let timeoutId;
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logger_1.logger.error('Request timeout', {
                    method: req.method,
                    url: req.originalUrl,
                    timeout: timeoutMs,
                    requestId: req.id
                });
                res.status(408).json({
                    success: false,
                    message: 'Request timeout',
                    requestId: req.id,
                    timestamp: new Date().toISOString()
                });
            }
        }, timeoutMs);
        res.on('finish', () => clearTimeout(timeout));
        res.on('close', () => clearTimeout(timeout));
        next();
    };
};
exports.requestTimeout = requestTimeout;
const requestSizeLimit = (maxSize = '10mb') => {
    return (req, res, next) => {
        const maxSizeBytes = parseSize(maxSize);
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > maxSizeBytes) {
                logger_1.logger.warn('Request body too large', {
                    method: req.method,
                    url: req.originalUrl,
                    size,
                    maxSize: maxSizeBytes,
                    ip: req.ip
                });
                req.destroy();
                res.status(413).json({
                    success: false,
                    message: `Request body too large. Maximum size is ${maxSize}`,
                    timestamp: new Date().toISOString()
                });
            }
        });
        next();
    };
};
exports.requestSizeLimit = requestSizeLimit;
const ipWhitelist = (allowedIPs) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!allowedIPs.includes(clientIP)) {
            logger_1.logger.warn('IP not in whitelist', {
                clientIP,
                allowedIPs,
                url: req.originalUrl,
                method: req.method
            });
            res.status(403).json({
                success: false,
                message: 'Access denied',
                timestamp: new Date().toISOString()
            });
            return;
        }
        next();
    };
};
exports.ipWhitelist = ipWhitelist;
const preventClickjacking = (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    next();
};
exports.preventClickjacking = preventClickjacking;
const preventMimeSniffing = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
};
exports.preventMimeSniffing = preventMimeSniffing;
function generateRequestId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function parseSize(size) {
    const units = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024
    };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/);
    if (!match) {
        throw new Error('Invalid size format');
    }
    const value = parseFloat(match[1]);
    const unit = match[2];
    return Math.floor(value * units[unit]);
}
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        requestId: req.id
    });
    if (res.headersSent) {
        return;
    }
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    res.status(statusCode).json({
        success: false,
        message,
        requestId: req.id,
        timestamp: new Date().toISOString()
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    logger_1.logger.warn('Route not found', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        requestId: req.id
    });
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        requestId: req.id,
        timestamp: new Date().toISOString()
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=security.middleware.js.map