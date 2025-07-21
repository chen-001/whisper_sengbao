# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于FastAPI和WebSocket的多人实时聊天室应用。用户无需注册即可通过设置昵称加入不同聊天室进行实时交流，支持消息持久化存储。

## 核心架构

### 后端架构
- **main.py**: FastAPI应用主文件，包含WebSocket连接管理、路由处理和消息广播逻辑
- **database.py**: SQLite数据库操作类，处理聊天室和消息的CRUD操作
- **ConnectionManager类**: 管理WebSocket连接、用户会话和房间状态的核心组件

### 前端架构
- **templates/**: Jinja2 HTML模板
  - **index.html**: 主页，显示聊天室列表和创建功能
  - **chat.html**: 聊天室页面，包含消息显示和输入界面
- **static/**: 静态资源
  - **chat.js**: 聊天室WebSocket客户端逻辑，包含消息处理、引用功能和分页加载
  - **script.js**: 主页交互逻辑
  - **style.css**: 响应式UI样式，支持主题切换

### 数据库设计
- **rooms表**: 存储聊天室信息(id, name, description, created_at)
- **messages表**: 存储消息记录(id, room_name, username, message, timestamp)

## 开发命令

### 环境设置
```bash
# 创建并激活虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 运行应用
```bash
# 使用启动脚本
./start.sh

# 或直接运行
source venv/bin/activate
python main.py
```

### 开发服务器
应用运行在 `http://localhost:8666`，启用自动重载模式

## 关键功能实现

### WebSocket通信流程
1. 客户端连接到 `/ws/{room_name}` 端点
2. 发送用户信息进行身份验证
3. 服务器通过ConnectionManager管理连接状态
4. 实现房间内消息广播和用户状态同步

### 消息处理
- 支持实时消息发送和接收
- 消息引用功能：长按消息可引用回复
- 分页历史消息加载：通过 `/api/messages/{room_name}` API实现

### 连接管理
- 自动重连机制处理网络断开
- 用户加入/离开的系统通知
- 实时在线用户列表更新

## 数据库操作
- 使用SQLite作为轻量级数据库
- 数据库文件: `chat.db` (首次运行自动创建)
- 包含三个默认聊天室：大厅、技术讨论、闲聊

## 前端特性
- 响应式设计，支持移动设备
- 主题切换功能(明暗模式)
- 用户昵称本地存储
- 消息引用和上下文菜单
- 滚动分页加载历史消息
- 浏览器通知功能：支持新消息桌面通知，可在页面上开关设置