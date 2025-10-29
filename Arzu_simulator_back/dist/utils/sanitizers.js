"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRichText = exports.stripScriptTags = exports.sanitizeUrlParam = exports.sanitizeFilePath = exports.sanitizeMongoInput = exports.escapeSql = exports.sanitizeEmail = exports.sanitizeUsername = exports.sanitizeInput = exports.escapeHtml = void 0;
const escapeHtml = (text) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };
    return text.replace(/[&<>"'\/]/g, (s) => map[s]);
};
exports.escapeHtml = escapeHtml;
const sanitizeInput = (input) => {
    if (typeof input !== 'string') {
        return input;
    }
    let sanitized = input.trim();
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    if (sanitized.length > 1000) {
        sanitized = sanitized.substring(0, 1000);
    }
    return sanitized;
};
exports.sanitizeInput = sanitizeInput;
const sanitizeUsername = (username) => {
    let sanitized = (0, exports.sanitizeInput)(username);
    sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');
    return sanitized;
};
exports.sanitizeUsername = sanitizeUsername;
const sanitizeEmail = (email) => {
    let sanitized = (0, exports.sanitizeInput)(email);
    sanitized = sanitized.toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
        throw new Error('无效的邮箱格式');
    }
    return sanitized;
};
exports.sanitizeEmail = sanitizeEmail;
const escapeSql = (input) => {
    if (typeof input !== 'string') {
        return input;
    }
    return input
        .replace(/[\x00-\x1F\x7F]/g, '')
        .replace(/'/g, "''")
        .replace(/"/g, '""');
};
exports.escapeSql = escapeSql;
const sanitizeMongoInput = (input) => {
    if (typeof input === 'string') {
        return (0, exports.sanitizeInput)(input);
    }
    if (typeof input === 'object' && input !== null) {
        const sanitized = {};
        for (const key in input) {
            if (key.startsWith('$')) {
                continue;
            }
            if (typeof input[key] === 'object') {
                sanitized[key] = (0, exports.sanitizeMongoInput)(input[key]);
            }
            else if (typeof input[key] === 'string') {
                sanitized[key] = (0, exports.sanitizeInput)(input[key]);
            }
            else {
                sanitized[key] = input[key];
            }
        }
        return sanitized;
    }
    return input;
};
exports.sanitizeMongoInput = sanitizeMongoInput;
const sanitizeFilePath = (filePath) => {
    let sanitized = filePath.replace(/\.{2,}/g, '');
    sanitized = sanitized.replace(/[<>:"|?*]/g, '');
    sanitized = sanitized.replace(/^[/\\]+/, '');
    return sanitized;
};
exports.sanitizeFilePath = sanitizeFilePath;
const sanitizeUrlParam = (param) => {
    let sanitized = (0, exports.sanitizeInput)(param);
    sanitized = encodeURIComponent(sanitized);
    return sanitized;
};
exports.sanitizeUrlParam = sanitizeUrlParam;
const stripScriptTags = (html) => {
    return html
        .replace(/\u003cscript[^\u003e]*\u003e[\s\S]*?\u003c\/script\u003e/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s\u003e]+/gi, '');
};
exports.stripScriptTags = stripScriptTags;
const sanitizeRichText = (html) => {
    let sanitized = (0, exports.stripScriptTags)(html);
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'];
    const tagRegex = /\u003c(?!\/?(?:${allowedTags.join('|')})\b)[^\u003e]*\u003e/gi;
    sanitized = sanitized.replace(tagRegex, '');
    return sanitized;
};
exports.sanitizeRichText = sanitizeRichText;
//# sourceMappingURL=sanitizers.js.map