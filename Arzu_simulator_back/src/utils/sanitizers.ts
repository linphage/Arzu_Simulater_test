// HTML转义函数
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'\/]/g, (s) => map[s]);
};

// 通用输入消毒
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // 去除前后空白
  let sanitized = input.trim();
  
  // 移除潜在的危险字符
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ''); // 控制字符
  
  // 限制长度
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  return sanitized;
};

// 用户名专用消毒
export const sanitizeUsername = (username: string): string => {
  let sanitized = sanitizeInput(username);
  
  // 只允许字母、数字和下划线
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');
  
  return sanitized;
};

// 邮箱专用消毒
export const sanitizeEmail = (email: string): string => {
  let sanitized = sanitizeInput(email);
  
  // 转换为小写
  sanitized = sanitized.toLowerCase();
  
  // 基本邮箱格式验证
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('无效的邮箱格式');
  }
  
  return sanitized;
};

// SQL注入防护 - 参数化查询的辅助函数
export const escapeSql = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
    .replace(/'/g, "''") // 转义单引号
    .replace(/"/g, '""'); // 转义双引号
};

// NoSQL注入防护
export const sanitizeMongoInput = (input: any): any => {
  if (typeof input === 'string') {
    return sanitizeInput(input);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    
    for (const key in input) {
      // 移除以$开头的键（MongoDB操作符）
      if (key.startsWith('$')) {
        continue;
      }
      
      // 递归处理嵌套对象
      if (typeof input[key] === 'object') {
        sanitized[key] = sanitizeMongoInput(input[key]);
      } else if (typeof input[key] === 'string') {
        sanitized[key] = sanitizeInput(input[key]);
      } else {
        sanitized[key] = input[key];
      }
    }
    
    return sanitized;
  }
  
  return input;
};

// 文件路径消毒
export const sanitizeFilePath = (filePath: string): string => {
  // 移除路径遍历字符
  let sanitized = filePath.replace(/\.{2,}/g, '');
  
  // 移除Windows路径中的非法字符
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // 确保路径不以斜杠开头
  sanitized = sanitized.replace(/^[/\\]+/, '');
  
  return sanitized;
};

// URL参数消毒
export const sanitizeUrlParam = (param: string): string => {
  let sanitized = sanitizeInput(param);
  
  // URL编码
  sanitized = encodeURIComponent(sanitized);
  
  return sanitized;
};

// 脚本标签移除
export const stripScriptTags = (html: string): string => {
  return html
    .replace(/\u003cscript[^\u003e]*\u003e[\s\S]*?\u003c\/script\u003e/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // 移除事件处理器
    .replace(/on\w+\s*=\s*[^\s\u003e]+/gi, '');
};

// 富文本内容消毒（允许基本的HTML标签）
export const sanitizeRichText = (html: string): string => {
  // 首先移除脚本标签
  let sanitized = stripScriptTags(html);
  
  // 只允许基本的HTML标签
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'];
  
  // 移除不允许的标签，但保留内容
  const tagRegex = /\u003c(?!\/?(?:${allowedTags.join('|')})\b)[^\u003e]*\u003e/gi;
  sanitized = sanitized.replace(tagRegex, '');
  
  return sanitized;
};