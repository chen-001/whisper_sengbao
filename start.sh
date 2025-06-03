#!/bin/bash

# 激活虚拟环境
source venv/bin/activate

# 启动聊天室应用
echo "正在启动多人在线聊天室..."
echo "访问地址: http://localhost:8000"
echo "按 Ctrl+C 停止服务器"
echo ""

python main.py 