#!/bin/bash

# 超快速HTTPS配置脚本 - 适合复制到其他服务器
# 使用方法: bash quick_https_setup.sh

echo "🚀 开始配置HTTPS..."

# 创建ssl目录
mkdir -p ssl

# 生成证书（简化版）
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
    -subj "/C=CN/O=ChatRoom/CN=localhost" 2>/dev/null

# 修改main.py支持HTTPS
if [ -f "main.py" ]; then
    # 备份
    cp main.py main.py.http.backup
    
    # 替换启动部分
    sed -i '/if __name__ == "__main__":/,$d' main.py
    
    cat >> main.py << 'EOF'
if __name__ == "__main__":
    import uvicorn
    import os
    
    if os.path.exists("ssl/cert.pem") and os.path.exists("ssl/key.pem"):
        print("🔒 HTTPS模式启动...")
        print("访问: https://localhost:8666")
        uvicorn.run("main:app", 
                   host="0.0.0.0", 
                   port=8666, 
                   reload=True,
                   ssl_keyfile="ssl/key.pem",
                   ssl_certfile="ssl/cert.pem")
    else:
        print("📡 HTTP模式启动...")
        print("访问: http://localhost:8666") 
        uvicorn.run("main:app", host="0.0.0.0", port=8666, reload=True)
EOF
fi

echo "✅ 配置完成！"
echo ""
echo "现在运行: python main.py"
echo "访问: https://localhost:8666"
echo "（需要在浏览器中接受证书警告）"