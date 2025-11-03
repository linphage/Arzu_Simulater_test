#!/bin/bash

# ==============================================
# Git 推送状态检查脚本
# ==============================================
# 功能：检查所有必要文件是否已成功推送到远程仓库
# 使用方法：bash check-git-push-status.sh
# ==============================================

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "  📦 Git 推送状态检查"
echo "======================================"
echo ""

# ==============================================
# 1. 检查 Git 仓库状态
# ==============================================
echo "1️⃣  检查 Git 仓库状态..."
echo "-----------------------------------"

if [ ! -d ".git" ]; then
    echo -e "${RED}✗${NC} 当前目录不是 Git 仓库"
    echo ""
    echo "请先初始化 Git 仓库："
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m '初始提交'"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git 仓库已初始化"
echo ""

# ==============================================
# 2. 检查远程仓库配置
# ==============================================
echo "2️⃣  检查远程仓库配置..."
echo "-----------------------------------"

if ! git remote -v | grep -q "origin"; then
    echo -e "${RED}✗${NC} 未配置远程仓库 (origin)"
    echo ""
    echo "请添加远程仓库："
    echo "  git remote add origin https://github.com/你的用户名/仓库名.git"
    exit 1
fi

REMOTE_URL=$(git remote get-url origin)
echo -e "${GREEN}✓${NC} 远程仓库已配置"
echo -e "${BLUE}📍 远程地址:${NC} $REMOTE_URL"
echo ""

# ==============================================
# 3. 检查当前分支
# ==============================================
echo "3️⃣  检查当前分支..."
echo "-----------------------------------"

CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}🌿 当前分支:${NC} $CURRENT_BRANCH"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠${NC}  发现未提交的更改"
    echo ""
    echo "未提交的文件列表："
    git status --short
    echo ""
    echo "请先提交这些更改："
    echo "  git add ."
    echo "  git commit -m '更新内容描述'"
    echo ""
    HAS_UNCOMMITTED=true
else
    echo -e "${GREEN}✓${NC} 工作目录干净，没有未提交的更改"
    HAS_UNCOMMITTED=false
fi
echo ""

# ==============================================
# 4. 检查远程分支状态
# ==============================================
echo "4️⃣  检查远程分支状态..."
echo "-----------------------------------"

# 获取远程更新
echo "正在获取远程仓库信息..."
git fetch origin 2>/dev/null || {
    echo -e "${RED}✗${NC} 无法连接到远程仓库"
    echo ""
    echo "可能的原因："
    echo "  1. 网络连接问题"
    echo "  2. 远程仓库不存在或无权限访问"
    echo "  3. 认证失败（检查 SSH key 或 token）"
    exit 1
}

# 检查远程分支是否存在
if git ls-remote --heads origin | grep -q "refs/heads/$CURRENT_BRANCH"; then
    echo -e "${GREEN}✓${NC} 远程分支 origin/$CURRENT_BRANCH 存在"
    
    # 比较本地和远程的提交
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/$CURRENT_BRANCH)
    
    if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo -e "${GREEN}✓${NC} 本地分支与远程分支同步"
        IS_SYNCED=true
    else
        # 检查本地是否领先或落后
        AHEAD=$(git rev-list --count origin/$CURRENT_BRANCH..HEAD)
        BEHIND=$(git rev-list --count HEAD..origin/$CURRENT_BRANCH)
        
        if [ "$AHEAD" -gt 0 ]; then
            echo -e "${YELLOW}⚠${NC}  本地分支领先远程 $AHEAD 个提交"
            echo ""
            echo "需要推送到远程："
            echo "  git push origin $CURRENT_BRANCH"
            echo ""
            IS_SYNCED=false
        fi
        
        if [ "$BEHIND" -gt 0 ]; then
            echo -e "${YELLOW}⚠${NC}  本地分支落后远程 $BEHIND 个提交"
            echo ""
            echo "需要拉取远程更新："
            echo "  git pull origin $CURRENT_BRANCH"
            echo ""
            IS_SYNCED=false
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC}  远程分支 origin/$CURRENT_BRANCH 不存在"
    echo ""
    echo "需要首次推送："
    echo "  git push -u origin $CURRENT_BRANCH"
    echo ""
    IS_SYNCED=false
fi
echo ""

# ==============================================
# 5. 检查必要的部署文件是否存在并已提交
# ==============================================
echo "5️⃣  检查必要的部署文件..."
echo "-----------------------------------"

REQUIRED_FILES=(
    # 部署文档
    "RENDER_DEPLOYMENT_GUIDE.md"
    "DEPLOYMENT_CHECKLIST.md"
    "QUICK_START_DEPLOYMENT.md"
    
    # 配置文件
    "render.yaml"
    ".env.template"
    ".gitignore"
    
    # 后端核心文件
    "Arzu_simulator_back/package.json"
    "Arzu_simulator_back/tsconfig.json"
    "Arzu_simulator_back/src/server.ts"
    "Arzu_simulator_back/src/database/connection.ts"
    "Arzu_simulator_back/src/database/init.ts"
    
    # 前端核心文件
    "Arzu_simulator_front/package.json"
    "Arzu_simulator_front/vite.config.ts"
    "Arzu_simulator_front/src/App.tsx"
    "Arzu_simulator_front/src/config/api.ts"
)

MISSING_FILES=()
NOT_COMMITTED=()
CHECKED_COUNT=0
PASSED_COUNT=0

echo "正在检查 ${#REQUIRED_FILES[@]} 个关键文件..."
echo ""

for file in "${REQUIRED_FILES[@]}"; do
    CHECKED_COUNT=$((CHECKED_COUNT + 1))
    
    # 检查文件是否存在
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗${NC} $file - 文件不存在"
        MISSING_FILES+=("$file")
        continue
    fi
    
    # 检查文件是否已提交到 Git
    if ! git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC}  $file - 未添加到 Git"
        NOT_COMMITTED+=("$file")
        continue
    fi
    
    # 检查文件是否有未提交的修改
    if git diff --name-only | grep -q "^$file$"; then
        echo -e "${YELLOW}⚠${NC}  $file - 有未提交的修改"
        NOT_COMMITTED+=("$file")
        continue
    fi
    
    # 检查文件是否已推送到远程
    if [ "$IS_SYNCED" = true ]; then
        echo -e "${GREEN}✓${NC} $file"
        PASSED_COUNT=$((PASSED_COUNT + 1))
    else
        echo -e "${BLUE}→${NC} $file - 等待推送"
    fi
done

echo ""
echo "检查结果: $PASSED_COUNT / $CHECKED_COUNT 文件已同步"
echo ""

# ==============================================
# 6. 生成详细报告
# ==============================================
echo "======================================"
echo "  📊 检查报告"
echo "======================================"
echo ""

# 报告远程仓库信息
echo -e "${BLUE}📍 远程仓库:${NC}"
echo "   $REMOTE_URL"
echo ""

# 报告分支信息
echo -e "${BLUE}🌿 当前分支:${NC}"
echo "   $CURRENT_BRANCH"
echo ""

# 报告同步状态
if [ "$IS_SYNCED" = true ] && [ "$HAS_UNCOMMITTED" = false ]; then
    echo -e "${GREEN}✅ 状态: 已同步${NC}"
    echo "   本地代码与远程仓库完全一致"
    echo ""
    
    echo -e "${GREEN}🎉 恭喜！所有文件已成功推送到 GitHub！${NC}"
    echo ""
    echo "你现在可以："
    echo "  1. 登录 Render Dashboard"
    echo "  2. 连接你的 GitHub 仓库"
    echo "  3. 开始部署"
    echo ""
    echo "详细步骤请参考: RENDER_DEPLOYMENT_GUIDE.md"
    exit 0
else
    echo -e "${YELLOW}⚠️  状态: 需要同步${NC}"
    echo ""
    
    # 报告问题
    if [ ${#MISSING_FILES[@]} -gt 0 ]; then
        echo -e "${RED}❌ 缺失的文件 (${#MISSING_FILES[@]} 个):${NC}"
        for file in "${MISSING_FILES[@]}"; do
            echo "   • $file"
        done
        echo ""
    fi
    
    if [ ${#NOT_COMMITTED[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  未提交的文件 (${#NOT_COMMITTED[@]} 个):${NC}"
        for file in "${NOT_COMMITTED[@]}"; do
            echo "   • $file"
        done
        echo ""
    fi
    
    if [ "$HAS_UNCOMMITTED" = true ]; then
        echo -e "${YELLOW}⚠️  有未提交的更改${NC}"
        echo ""
    fi
    
    if [ "$IS_SYNCED" = false ]; then
        echo -e "${YELLOW}⚠️  本地和远程不同步${NC}"
        echo ""
    fi
    
    # 提供解决方案
    echo "======================================"
    echo "  🔧 解决方案"
    echo "======================================"
    echo ""
    
    if [ ${#MISSING_FILES[@]} -gt 0 ]; then
        echo "1. 创建缺失的文件"
        echo ""
    fi
    
    if [ ${#NOT_COMMITTED[@]} -gt 0 ] || [ "$HAS_UNCOMMITTED" = true ]; then
        echo "2. 提交更改："
        echo "   git add ."
        echo "   git commit -m '添加部署配置文件'"
        echo ""
    fi
    
    if [ "$IS_SYNCED" = false ]; then
        echo "3. 推送到远程："
        if git ls-remote --heads origin | grep -q "refs/heads/$CURRENT_BRANCH"; then
            echo "   git push origin $CURRENT_BRANCH"
        else
            echo "   git push -u origin $CURRENT_BRANCH"
        fi
        echo ""
    fi
    
    exit 1
fi
