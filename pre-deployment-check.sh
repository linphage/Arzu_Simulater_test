#!/bin/bash

# ==============================================
# Arzu Simulator - 部署前准备脚本
# ==============================================
# 
# 功能：
# 1. 检查项目结构
# 2. 验证配置文件
# 3. 生成 JWT 密钥
# 4. 创建部署检查报告
#
# 使用方法：
# bash pre-deployment-check.sh
#
# ==============================================

set -e  # 遇到错误立即退出

echo "======================================"
echo "  Arzu Simulator 部署前检查"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 检查函数
check_item() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} $2"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# ==============================================
# 1. 检查项目结构
# ==============================================
echo "1️⃣  检查项目结构..."
echo "-----------------------------------"

# 检查后端目录
if [ -d "Arzu_simulator_back" ]; then
    check_item 0 "后端目录存在"
else
    check_item 1 "后端目录不存在"
fi

# 检查前端目录
if [ -d "Arzu_simulator_front" ]; then
    check_item 0 "前端目录存在"
else
    check_item 1 "前端目录不存在"
fi

# 检查后端 package.json
if [ -f "Arzu_simulator_back/package.json" ]; then
    check_item 0 "后端 package.json 存在"
else
    check_item 1 "后端 package.json 不存在"
fi

# 检查前端 package.json
if [ -f "Arzu_simulator_front/package.json" ]; then
    check_item 0 "前端 package.json 存在"
else
    check_item 1 "前端 package.json 不存在"
fi

# 检查后端 tsconfig.json
if [ -f "Arzu_simulator_back/tsconfig.json" ]; then
    check_item 0 "后端 tsconfig.json 存在"
else
    check_item 1 "后端 tsconfig.json 不存在"
fi

# 检查前端 vite.config.ts
if [ -f "Arzu_simulator_front/vite.config.ts" ]; then
    check_item 0 "前端 vite.config.ts 存在"
else
    check_item 1 "前端 vite.config.ts 不存在"
fi

echo ""

# ==============================================
# 2. 检查配置文件
# ==============================================
echo "2️⃣  检查配置文件..."
echo "-----------------------------------"

# 检查 render.yaml
if [ -f "render.yaml" ]; then
    check_item 0 "render.yaml 存在"
else
    check_item 1 "render.yaml 不存在 (可选)"
fi

# 检查 .env.template
if [ -f ".env.template" ]; then
    check_item 0 ".env.template 存在"
else
    check_item 1 ".env.template 不存在 (可选)"
fi

# 检查部署文档
if [ -f "RENDER_DEPLOYMENT_GUIDE.md" ]; then
    check_item 0 "RENDER_DEPLOYMENT_GUIDE.md 存在"
else
    check_item 1 "RENDER_DEPLOYMENT_GUIDE.md 不存在 (可选)"
fi

echo ""

# ==============================================
# 3. 检查后端关键文件
# ==============================================
echo "3️⃣  检查后端关键文件..."
echo "-----------------------------------"

if [ -f "Arzu_simulator_back/src/server.ts" ]; then
    check_item 0 "server.ts 存在"
else
    check_item 1 "server.ts 不存在"
fi

if [ -d "Arzu_simulator_back/src/database" ]; then
    check_item 0 "database 目录存在"
else
    check_item 1 "database 目录不存在"
fi

if [ -d "Arzu_simulator_back/src/api" ]; then
    check_item 0 "api 目录存在"
else
    check_item 1 "api 目录不存在"
fi

echo ""

# ==============================================
# 4. 检查前端关键文件
# ==============================================
echo "4️⃣  检查前端关键文件..."
echo "-----------------------------------"

if [ -f "Arzu_simulator_front/src/App.tsx" ]; then
    check_item 0 "App.tsx 存在"
else
    check_item 1 "App.tsx 不存在"
fi

if [ -f "Arzu_simulator_front/src/config/api.ts" ]; then
    check_item 0 "api.ts 配置存在"
else
    check_item 1 "api.ts 配置不存在"
fi

if [ -d "Arzu_simulator_front/src/services" ]; then
    check_item 0 "services 目录存在"
else
    check_item 1 "services 目录不存在"
fi

echo ""

# ==============================================
# 5. 检查 Git 状态
# ==============================================
echo "5️⃣  检查 Git 状态..."
echo "-----------------------------------"

if [ -d ".git" ]; then
    check_item 0 "Git 仓库已初始化"
    
    # 检查是否有远程仓库
    if git remote -v | grep -q "origin"; then
        REMOTE_URL=$(git remote get-url origin)
        echo -e "${GREEN}✓${NC} 远程仓库: $REMOTE_URL"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠${NC}  未配置远程仓库 (需要在 Render 部署前添加)"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
else
    check_item 1 "Git 仓库未初始化"
fi

# 检查 .gitignore
if [ -f ".gitignore" ]; then
    check_item 0 ".gitignore 存在"
    
    # 检查是否忽略了敏感文件
    if grep -q ".env" ".gitignore"; then
        check_item 0 ".gitignore 包含 .env"
    else
        check_item 1 ".gitignore 未包含 .env (建议添加)"
    fi
else
    check_item 1 ".gitignore 不存在"
fi

echo ""

# ==============================================
# 6. 生成 JWT 密钥
# ==============================================
echo "6️⃣  生成 JWT 密钥..."
echo "-----------------------------------"

# 检查 openssl 是否可用
if command -v openssl &> /dev/null; then
    echo "🔑 JWT_SECRET:"
    openssl rand -base64 48
    echo ""
    echo "🔑 JWT_REFRESH_SECRET:"
    openssl rand -base64 48
    echo ""
    echo -e "${YELLOW}⚠${NC}  请保存这些密钥，部署时需要使用！"
else
    echo -e "${YELLOW}⚠${NC}  openssl 不可用，请手动生成随机密钥"
fi

echo ""

# ==============================================
# 7. 检查 Node.js 版本
# ==============================================
echo "7️⃣  检查 Node.js 版本..."
echo "-----------------------------------"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js 版本: $NODE_VERSION"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    
    # 检查版本是否 >= 18
    NODE_MAJOR_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✓${NC} Node.js 版本符合要求 (>= 18)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} Node.js 版本过低，建议升级到 18+ (Render 使用 Node 18)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
else
    echo -e "${RED}✗${NC} Node.js 未安装"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

TOTAL_CHECKS=$((TOTAL_CHECKS + 2))

echo ""

# ==============================================
# 8. 总结
# ==============================================
echo "======================================"
echo "  检查完成"
echo "======================================"
echo ""
echo "总检查项: $TOTAL_CHECKS"
echo -e "${GREEN}通过: $PASSED_CHECKS${NC}"
echo -e "${RED}失败: $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过！可以开始部署。${NC}"
    echo ""
    echo "下一步："
    echo "1. 将代码推送到 GitHub/GitLab"
    echo "2. 登录 Render Dashboard"
    echo "3. 按照 RENDER_DEPLOYMENT_GUIDE.md 操作"
    exit 0
else
    echo -e "${YELLOW}⚠️  发现 $FAILED_CHECKS 个问题，请修复后再部署。${NC}"
    exit 1
fi
