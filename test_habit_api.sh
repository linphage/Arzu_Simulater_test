#!/bin/bash

echo "=== 注册新用户 ==="
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"mail":"testapi@test.com","username":"testapi","password":"Test123456@"}')
echo "$REGISTER_RESPONSE"

echo ""
echo "=== 登录获取token ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/auth/login/email \
  -H "Content-Type: application/json" \
  -d '{"mail":"testapi@test.com","password":"Test123456@"}')
echo "$LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo ""
echo "Token: $TOKEN"

echo ""
echo "=== 测试习惯分析API (本周) ==="
curl -s -X GET "http://localhost:3002/api/v1/tasks/pomodoro/habit-stats?timeframe=week" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | head -100

echo ""
echo ""
echo "=== 完成 ==="
