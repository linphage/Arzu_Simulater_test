# ==============================================
# Git 推送状态检查脚本 (PowerShell 版本)
# ==============================================
# 功能：检查所有必要文件是否已成功推送到远程仓库
# 使用方法：.\check-git-push-status.ps1
# 或右键 -> "使用 PowerShell 运行"
# ==============================================

# 设置输出编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  📦 Git 推送状态检查" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$script:ErrorCount = 0
$script:WarningCount = 0

# ==============================================
# 1. 检查 Git 仓库状态
# ==============================================
Write-Host "1️⃣  检查 Git 仓库状态..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

if (-not (Test-Path ".git")) {
    Write-Host "✗ 当前目录不是 Git 仓库" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先初始化 Git 仓库："
    Write-Host "  git init"
    Write-Host "  git add ."
    Write-Host "  git commit -m '初始提交'"
    exit 1
}

Write-Host "✓ Git 仓库已初始化" -ForegroundColor Green
Write-Host ""

# ==============================================
# 2. 检查远程仓库配置
# ==============================================
Write-Host "2️⃣  检查远程仓库配置..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

$remoteCheck = git remote -v 2>&1
if ($remoteCheck -notmatch "origin") {
    Write-Host "✗ 未配置远程仓库 (origin)" -ForegroundColor Red
    Write-Host ""
    Write-Host "请添加远程仓库："
    Write-Host "  git remote add origin https://github.com/你的用户名/仓库名.git"
    exit 1
}

$remoteUrl = git remote get-url origin 2>&1
Write-Host "✓ 远程仓库已配置" -ForegroundColor Green
Write-Host "📍 远程地址: $remoteUrl" -ForegroundColor Blue
Write-Host ""

# ==============================================
# 3. 检查当前分支
# ==============================================
Write-Host "3️⃣  检查当前分支..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

$currentBranch = git branch --show-current
Write-Host "🌿 当前分支: $currentBranch" -ForegroundColor Blue

# 检查是否有未提交的更改
$statusOutput = git status --porcelain 2>&1
if ($statusOutput) {
    Write-Host "⚠  发现未提交的更改" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "未提交的文件列表："
    git status --short
    Write-Host ""
    Write-Host "请先提交这些更改："
    Write-Host "  git add ."
    Write-Host "  git commit -m '更新内容描述'"
    Write-Host ""
    $hasUncommitted = $true
    $script:WarningCount++
} else {
    Write-Host "✓ 工作目录干净，没有未提交的更改" -ForegroundColor Green
    $hasUncommitted = $false
}
Write-Host ""

# ==============================================
# 4. 检查远程分支状态
# ==============================================
Write-Host "4️⃣  检查远程分支状态..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

Write-Host "正在获取远程仓库信息..."
try {
    git fetch origin 2>&1 | Out-Null
} catch {
    Write-Host "✗ 无法连接到远程仓库" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因："
    Write-Host "  1. 网络连接问题"
    Write-Host "  2. 远程仓库不存在或无权限访问"
    Write-Host "  3. 认证失败（检查 SSH key 或 token）"
    exit 1
}

# 检查远程分支是否存在
$remoteBranches = git ls-remote --heads origin
if ($remoteBranches -match "refs/heads/$currentBranch") {
    Write-Host "✓ 远程分支 origin/$currentBranch 存在" -ForegroundColor Green
    
    # 比较本地和远程的提交
    $localCommit = git rev-parse HEAD
    $remoteCommit = git rev-parse "origin/$currentBranch"
    
    if ($localCommit -eq $remoteCommit) {
        Write-Host "✓ 本地分支与远程分支同步" -ForegroundColor Green
        $isSynced = $true
    } else {
        # 检查本地是否领先或落后
        $ahead = git rev-list --count "origin/$currentBranch..HEAD"
        $behind = git rev-list --count "HEAD..origin/$currentBranch"
        
        if ([int]$ahead -gt 0) {
            Write-Host "⚠  本地分支领先远程 $ahead 个提交" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "需要推送到远程："
            Write-Host "  git push origin $currentBranch"
            Write-Host ""
            $isSynced = $false
            $script:WarningCount++
        }
        
        if ([int]$behind -gt 0) {
            Write-Host "⚠  本地分支落后远程 $behind 个提交" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "需要拉取远程更新："
            Write-Host "  git pull origin $currentBranch"
            Write-Host ""
            $isSynced = $false
            $script:WarningCount++
        }
    }
} else {
    Write-Host "⚠  远程分支 origin/$currentBranch 不存在" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "需要首次推送："
    Write-Host "  git push -u origin $currentBranch"
    Write-Host ""
    $isSynced = $false
    $script:WarningCount++
}
Write-Host ""

# ==============================================
# 5. 检查必要的部署文件
# ==============================================
Write-Host "5️⃣  检查必要的部署文件..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

$requiredFiles = @(
    # 部署文档
    "RENDER_DEPLOYMENT_GUIDE.md",
    "DEPLOYMENT_CHECKLIST.md",
    "QUICK_START_DEPLOYMENT.md",
    
    # 配置文件
    "render.yaml",
    ".env.template",
    ".gitignore",
    
    # 后端核心文件
    "Arzu_simulator_back/package.json",
    "Arzu_simulator_back/tsconfig.json",
    "Arzu_simulator_back/src/server.ts",
    "Arzu_simulator_back/src/database/connection.ts",
    "Arzu_simulator_back/src/database/init.ts",
    
    # 前端核心文件
    "Arzu_simulator_front/package.json",
    "Arzu_simulator_front/vite.config.ts",
    "Arzu_simulator_front/src/App.tsx",
    "Arzu_simulator_front/src/config/api.ts"
)

$missingFiles = @()
$notCommitted = @()
$checkedCount = 0
$passedCount = 0

Write-Host "正在检查 $($requiredFiles.Count) 个关键文件..."
Write-Host ""

foreach ($file in $requiredFiles) {
    $checkedCount++
    
    # 检查文件是否存在
    if (-not (Test-Path $file)) {
        Write-Host "✗ $file - 文件不存在" -ForegroundColor Red
        $missingFiles += $file
        $script:ErrorCount++
        continue
    }
    
    # 检查文件是否已提交到 Git
    $gitLsFiles = git ls-files --error-unmatch $file 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠  $file - 未添加到 Git" -ForegroundColor Yellow
        $notCommitted += $file
        $script:WarningCount++
        continue
    }
    
    # 检查文件是否有未提交的修改
    $gitDiff = git diff --name-only | Select-String -Pattern "^$([regex]::Escape($file))$"
    if ($gitDiff) {
        Write-Host "⚠  $file - 有未提交的修改" -ForegroundColor Yellow
        $notCommitted += $file
        $script:WarningCount++
        continue
    }
    
    # 检查文件是否已推送到远程
    if ($isSynced) {
        Write-Host "✓ $file" -ForegroundColor Green
        $passedCount++
    } else {
        Write-Host "→ $file - 等待推送" -ForegroundColor Blue
    }
}

Write-Host ""
Write-Host "检查结果: $passedCount / $checkedCount 文件已同步"
Write-Host ""

# ==============================================
# 6. 生成详细报告
# ==============================================
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  📊 检查报告" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 报告远程仓库信息
Write-Host "📍 远程仓库:" -ForegroundColor Blue
Write-Host "   $remoteUrl"
Write-Host ""

# 报告分支信息
Write-Host "🌿 当前分支:" -ForegroundColor Blue
Write-Host "   $currentBranch"
Write-Host ""

# 报告同步状态
if ($isSynced -and -not $hasUncommitted -and $missingFiles.Count -eq 0 -and $notCommitted.Count -eq 0) {
    Write-Host "✅ 状态: 已同步" -ForegroundColor Green
    Write-Host "   本地代码与远程仓库完全一致"
    Write-Host ""
    
    Write-Host "🎉 恭喜！所有文件已成功推送到 GitHub！" -ForegroundColor Green
    Write-Host ""
    Write-Host "你现在可以："
    Write-Host "  1. 登录 Render Dashboard"
    Write-Host "  2. 连接你的 GitHub 仓库"
    Write-Host "  3. 开始部署"
    Write-Host ""
    Write-Host "详细步骤请参考: RENDER_DEPLOYMENT_GUIDE.md"
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
} else {
    Write-Host "⚠️  状态: 需要同步" -ForegroundColor Yellow
    Write-Host ""
    
    # 报告问题
    if ($missingFiles.Count -gt 0) {
        Write-Host "❌ 缺失的文件 ($($missingFiles.Count) 个):" -ForegroundColor Red
        foreach ($file in $missingFiles) {
            Write-Host "   • $file"
        }
        Write-Host ""
    }
    
    if ($notCommitted.Count -gt 0) {
        Write-Host "⚠️  未提交的文件 ($($notCommitted.Count) 个):" -ForegroundColor Yellow
        foreach ($file in $notCommitted) {
            Write-Host "   • $file"
        }
        Write-Host ""
    }
    
    if ($hasUncommitted) {
        Write-Host "⚠️  有未提交的更改" -ForegroundColor Yellow
        Write-Host ""
    }
    
    if (-not $isSynced) {
        Write-Host "⚠️  本地和远程不同步" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # 提供解决方案
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  🔧 解决方案" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    
    $stepNumber = 1
    
    if ($missingFiles.Count -gt 0) {
        Write-Host "$stepNumber. 创建缺失的文件"
        Write-Host ""
        $stepNumber++
    }
    
    if ($notCommitted.Count -gt 0 -or $hasUncommitted) {
        Write-Host "$stepNumber. 提交更改："
        Write-Host "   git add ."
        Write-Host "   git commit -m '添加部署配置文件'"
        Write-Host ""
        $stepNumber++
    }
    
    if (-not $isSynced) {
        Write-Host "$stepNumber. 推送到远程："
        if ($remoteBranches -match "refs/heads/$currentBranch") {
            Write-Host "   git push origin $currentBranch"
        } else {
            Write-Host "   git push -u origin $currentBranch"
        }
        Write-Host ""
        $stepNumber++
    }
    
    Write-Host ""
    Write-Host "总结: $script:ErrorCount 个错误, $script:WarningCount 个警告" -ForegroundColor $(if ($script:ErrorCount -gt 0) { "Red" } else { "Yellow" })
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
