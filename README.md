# 多人在线实时聊天室

一个支持多房间的实时聊天网页应用，无需注册登录，用户可直接设置昵称加入聊天。

## 功能特性

- 🚀 实时聊天：基于WebSocket的实时消息传递
- 🏠 多聊天室：支持创建和加入不同的聊天室
- 👤 免注册：用户只需设置昵称即可开始聊天
- 💾 消息持久化：聊天记录保存到数据库，重新进入仍可查看历史消息
- 📱 响应式设计：支持桌面和移动设备

## 快速开始

1. 创建虚拟环境并安装依赖：
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. 启动服务器：
```bash
# 方法一：使用启动脚本
./start.sh

# 方法二：手动启动
source venv/bin/activate
python main.py
```

3. 打开浏览器访问：http://localhost:8000

## 项目结构

- `main.py` - 主服务器文件，包含FastAPI应用和WebSocket处理
- `database.py` - 数据库操作类，处理聊天室和消息的存储
- `static/` - 静态文件目录
  - `style.css` - 样式文件，提供现代化UI设计
  - `script.js` - 主页JavaScript逻辑
  - `chat.js` - 聊天室页面JavaScript，处理WebSocket通信
- `templates/` - HTML模板文件目录
  - `index.html` - 主页模板，显示聊天室列表
  - `chat.html` - 聊天室页面模板
- `chat.db` - SQLite数据库文件（运行后自动创建）
- `start.sh` - 便捷启动脚本
- `requirements.txt` - Python依赖包列表
- `venv/` - Python虚拟环境目录

## 功能演示

1. **主页功能**：
   - 查看所有可用的聊天室
   - 创建新的聊天室
   - 设置昵称并加入聊天室

2. **聊天室功能**：
   - 实时发送和接收消息
   - 查看历史聊天记录
   - 显示在线用户列表
   - 系统消息提示（用户加入/离开）
   - 连接状态显示
   - 响应式设计，支持移动设备

3. **技术特性**：
   - WebSocket实时通信
   - SQLite数据库持久化存储
   - 多房间支持
   - 用户会话管理
   - 自动重连机制

## 注意事项

- 服务器默认运行在 `0.0.0.0:8000`，可在`main.py`中修改
- 聊天记录会持久保存在SQLite数据库中
- 用户昵称会保存在浏览器本地存储中，重新访问时会自动填充
- 建议在生产环境中使用nginx等反向代理服务器 