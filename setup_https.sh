#!/bin/bash

# 快速配置HTTPS聊天室脚本
# 使用方法: ./setup_https.sh [域名或IP]

echo "========================================="
echo "聊天室HTTPS快速配置脚本"
echo "========================================="

# 获取域名/IP参数
DOMAIN=${1:-"localhost"}
echo "配置域名/IP: $DOMAIN"

# 1. 生成自签名SSL证书
echo ""
echo "1. 生成SSL证书..."
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
    -subj "/C=CN/ST=State/L=City/O=ChatRoom/CN=$DOMAIN" \
    -config <(echo '[req]'; echo 'distinguished_name=req'; echo '[v3_req]'; echo 'subjectAltName=@alt_names'; echo '[alt_names]'; echo "DNS.1=$DOMAIN"; echo 'DNS.2=localhost'; echo 'IP.1=127.0.0.1') \
    -extensions v3_req

if [ $? -eq 0 ]; then
    echo "✅ SSL证书生成成功"
else
    echo "❌ SSL证书生成失败，尝试简化版本..."
    mkdir -p ssl
    openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/C=CN/O=ChatRoom/CN=$DOMAIN"
fi

# 2. 修改main.py支持HTTPS
echo ""
echo "2. 配置HTTPS服务器..."

# 备份原文件
cp main.py main.py.backup

# 修改main.py的最后几行
sed -i '/if __name__ == "__main__":/,$d' main.py

cat >> main.py << 'EOF'
if __name__ == "__main__":
    import uvicorn
    import ssl
    import os
    
    # 检查是否存在SSL证书
    if os.path.exists("ssl/cert.pem") and os.path.exists("ssl/key.pem"):
        print("🔒 启动HTTPS服务器...")
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain("ssl/cert.pem", "ssl/key.pem")
        
        uvicorn.run("main:app", 
                   host="0.0.0.0", 
                   port=8666, 
                   reload=True,
                   ssl_keyfile="ssl/key.pem",
                   ssl_certfile="ssl/cert.pem")
    else:
        print("⚠️  SSL证书不存在，启动HTTP服务器...")
        uvicorn.run("main:app", host="0.0.0.0", port=8666, reload=True)
EOF

echo "✅ main.py已配置HTTPS支持"

# 3. 创建启动脚本
echo ""
echo "3. 创建HTTPS启动脚本..."

cat > start_https.sh << 'EOF'
#!/bin/bash

echo "启动HTTPS聊天室服务器..."
echo "HTTPS访问地址: https://localhost:8666"
echo "HTTP访问地址: http://localhost:8666"
echo "按 Ctrl+C 停止服务器"
echo ""

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

python main.py
EOF

chmod +x start_https.sh
echo "✅ HTTPS启动脚本创建成功"

# 4. 安装依赖（如果需要）
echo ""
echo "4. 检查Python依赖..."
if ! python -c "import uvicorn" 2>/dev/null; then
    echo "正在安装依赖..."
    pip install fastapi uvicorn websockets jinja2 python-multipart
fi

# 5. 创建防火墙配置提示
echo ""
echo "========================================="
echo "配置完成！"
echo "========================================="
echo ""
echo "🔧 使用说明："
echo "1. 运行: ./start_https.sh"
echo "2. 访问: https://$DOMAIN:8666"
echo "3. 浏览器会提示证书不安全，点击'高级'->'继续访问'"
echo ""
echo "🔥 防火墙配置（如需要）："
echo "sudo ufw allow 8666"
echo "# 或者"
echo "sudo firewall-cmd --add-port=8666/tcp --permanent"
echo "sudo firewall-cmd --reload"
echo ""
echo "📝 注意事项："
echo "- 自签名证书会显示不安全警告，这是正常的"
echo "- 生产环境建议使用正式SSL证书"
echo "- 证书文件保存在 ssl/ 目录下"
echo ""
echo "🚀 现在可以测试桌面通知功能了！"